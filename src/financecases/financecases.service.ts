import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogsService } from '../auditlogs/auditlogs.service';

export const FINANCE_CASE_STAGES = [
  'PENDING', 'DOCUMENTS', 'LOGIN', 'VERIFICATION', 'BANK_QUERY',
  'QUERY_RESOLVED', 'SANCTION', 'AGREEMENT', 'DISBURSEMENT', 'FINANCE_COMPLETED',
];

@Injectable()
export class FinanceCasesService {
  constructor(private prisma: PrismaService, private auditLogs: AuditLogsService) {}

  async createFinanceCase(data: {
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
  }) {
    const lead = await this.prisma.lead.findUnique({ where: { id: data.leadId } });
    if (!lead) throw new NotFoundException('Lead not found.');
    const existing = await this.prisma.financeCase.findUnique({ where: { leadId: data.leadId } });
    if (existing) throw new BadRequestException('This lead already has a finance case.');

    const financeCase = await this.prisma.financeCase.create({ data });

    await this.prisma.lead.update({
      where: { id: data.leadId },
      data: { bankId: data.bankId, financeExecutiveId: data.financeExecutiveId, financeStatus: 'PENDING' },
    });

    await this.auditLogs.logAction(data.financeExecutiveId, 'FinanceCase', financeCase.id, 'FINANCE_CASE_CREATED', undefined, { loanAmount: data.loanAmount });
    return financeCase;
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
