import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogsService } from '../auditlogs/auditlogs.service';

export const FINANCE_CASE_STAGES = [
  'PENDING_APPROVAL', 'PENDING', 'DOCUMENTS', 'LOGIN', 'VERIFICATION', 'BANK_QUERY',
  'QUERY_RESOLVED', 'SANCTION', 'AGREEMENT', 'DISBURSEMENT', 'FINANCE_COMPLETED',
];

// Roles whose finance-case submissions need Admin sign-off before they count
// as the lead's active finance case.
const NEEDS_APPROVAL_ROLES = ['DEALER_EXECUTIVE', 'DEALER_MANAGER'];

@Injectable()
export class FinanceCasesService {
  constructor(private prisma: PrismaService, private auditLogs: AuditLogsService) {}

  async createFinanceCase(
    data: {
      leadId: string;
      bankId: string;
      financeExecutiveId: string;
      loanAmount: number;
      downPayment: number;
      tenureMonths: number;
      roi: number;
      emi: number;
      processingFee?: number;
      otherChargesJson?: string;
    },
    creatorRole: string,
  ) {
    const lead = await this.prisma.lead.findUnique({ where: { id: data.leadId } });
    if (!lead) throw new NotFoundException('Lead not found.');
    const existing = await this.prisma.financeCase.findUnique({ where: { leadId: data.leadId } });
    if (existing) throw new BadRequestException('This lead already has a finance case.');

    const needsApproval = NEEDS_APPROVAL_ROLES.includes(creatorRole);
    const initialStage = needsApproval ? 'PENDING_APPROVAL' : 'PENDING';

    const financeCase = await this.prisma.financeCase.create({ data: { ...data, stage: initialStage } });

    await this.prisma.lead.update({
      where: { id: data.leadId },
      data: {
        bankId: data.bankId,
        financeExecutiveId: data.financeExecutiveId,
        // Don't advance the lead's own finance pipeline until an admin has
        // actually approved this submission.
        ...(needsApproval ? {} : { financeStatus: 'PENDING' }),
      },
    });

    await this.auditLogs.logAction(
      data.financeExecutiveId,
      'FinanceCase',
      financeCase.id,
      needsApproval ? 'FINANCE_CASE_SUBMITTED_FOR_APPROVAL' : 'FINANCE_CASE_CREATED',
      undefined,
      { loanAmount: data.loanAmount },
    );
    return financeCase;
  }

  async approveFinanceCase(id: string, approvedBy: string) {
    const financeCase = await this.prisma.financeCase.findUnique({ where: { id } });
    if (!financeCase) throw new NotFoundException('Finance case not found.');
    if (financeCase.stage !== 'PENDING_APPROVAL') {
      throw new BadRequestException('This finance case is not awaiting approval.');
    }

    const updated = await this.prisma.financeCase.update({ where: { id }, data: { stage: 'PENDING' } });

    await this.prisma.financeStatusHistory.create({
      data: { financeCaseId: id, fromStage: 'PENDING_APPROVAL', toStage: 'PENDING', changedBy: approvedBy, notes: 'Approved by admin' },
    });

    await this.prisma.lead.update({ where: { id: financeCase.leadId }, data: { financeStatus: 'PENDING' } });

    await this.auditLogs.logAction(approvedBy, 'FinanceCase', id, 'FINANCE_CASE_APPROVED');
    return updated;
  }

  listFinanceCases(leadId?: string) {
    return this.prisma.financeCase.findMany({
      where: leadId ? { leadId } : {},
      include: { statusHistory: { orderBy: { createdAt: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getFinanceCase(id: string) {
    const financeCase = await this.prisma.financeCase.findUnique({
      where: { id },
      include: { statusHistory: { orderBy: { createdAt: 'desc' } }, lead: true, bank: true },
    });
    if (!financeCase) throw new NotFoundException('Finance case not found.');
    return financeCase;
  }

  async updateStage(id: string, stage: string, changedBy: string, notes?: string) {
    const financeCase = await this.prisma.financeCase.findUnique({ where: { id } });
    if (!financeCase) throw new NotFoundException('Finance case not found.');
    if (!FINANCE_CASE_STAGES.includes(stage)) {
      throw new BadRequestException(`Invalid stage: ${stage}.`);
    }

    const updated = await this.prisma.financeCase.update({ where: { id }, data: { stage } });

    await this.prisma.financeStatusHistory.create({
      data: { financeCaseId: id, fromStage: financeCase.stage, toStage: stage, changedBy, notes },
    });

    await this.prisma.lead.update({ where: { id: financeCase.leadId }, data: { financeStatus: stage } });

    await this.auditLogs.logAction(changedBy, 'FinanceCase', id, 'FINANCE_STAGE_UPDATED', { stage: financeCase.stage }, { stage });
    return updated;
  }
}
