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

  // Editing case details is only allowed while the case is still open — once
  // it reaches the final stage, the numbers are locked for the record.
  async updateDetails(
    id: string,
    data: { loanAmount?: number; downPayment?: number; tenureMonths?: number; roi?: number; emi?: number; processingFee?: number; otherChargesJson?: string },
    changedBy: string,
  ) {
    const financeCase = await this.prisma.financeCase.findUnique({ where: { id } });
    if (!financeCase) throw new NotFoundException('Finance case not found.');
    if (financeCase.stage === 'FINANCE_COMPLETED') {
      throw new BadRequestException('This finance case is closed and can no longer be edited.');
    }
    const updated = await this.prisma.financeCase.update({ where: { id }, data });
    await this.auditLogs.logAction(changedBy, 'FinanceCase', id, 'FINANCE_CASE_DETAILS_UPDATED', undefined, data);
    return updated;
  }

  // ---- Phase B: structured Bank Query ----
  async createBankQuery(financeCaseId: string, data: { query: string; requestedDocument?: string; dueDate?: string }, createdBy: string) {
    const financeCase = await this.prisma.financeCase.findUnique({ where: { id: financeCaseId } });
    if (!financeCase) throw new NotFoundException('Finance case not found.');

    const bankQuery = await this.prisma.bankQuery.create({
      data: {
        financeCaseId,
        query: data.query,
        requestedDocument: data.requestedDocument,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        createdBy,
      },
    });

    // Move the case (and lead) into BANK_QUERY so it's visible in the pipeline.
    if (financeCase.stage !== 'BANK_QUERY') {
      await this.prisma.financeCase.update({ where: { id: financeCaseId }, data: { stage: 'BANK_QUERY' } });
      await this.prisma.financeStatusHistory.create({
        data: { financeCaseId, fromStage: financeCase.stage, toStage: 'BANK_QUERY', changedBy: createdBy, notes: data.query },
      });
      await this.prisma.lead.update({ where: { id: financeCase.leadId }, data: { financeStatus: 'BANK_QUERY' } });
    }

    await this.auditLogs.logAction(createdBy, 'BankQuery', bankQuery.id, 'BANK_QUERY_CREATED', undefined, { query: data.query });
    return bankQuery;
  }

  listBankQueries(financeCaseId: string) {
    return this.prisma.bankQuery.findMany({ where: { financeCaseId }, orderBy: { createdAt: 'desc' } });
  }

  async resolveBankQuery(id: string, resolutionNotes: string, resolvedBy: string) {
    const bankQuery = await this.prisma.bankQuery.findUnique({ where: { id } });
    if (!bankQuery) throw new NotFoundException('Bank query not found.');
    if (bankQuery.status === 'RESOLVED') throw new BadRequestException('This query is already resolved.');

    const updated = await this.prisma.bankQuery.update({
      where: { id },
      data: { status: 'RESOLVED', resolvedBy, resolutionNotes, resolvedAt: new Date() },
    });

    // If no other queries are still open on this case, move it forward.
    const stillOpen = await this.prisma.bankQuery.count({ where: { financeCaseId: bankQuery.financeCaseId, status: 'OPEN' } });
    if (stillOpen === 0) {
      const financeCase = await this.prisma.financeCase.findUnique({ where: { id: bankQuery.financeCaseId } });
      if (financeCase && financeCase.stage === 'BANK_QUERY') {
        await this.prisma.financeCase.update({ where: { id: bankQuery.financeCaseId }, data: { stage: 'QUERY_RESOLVED' } });
        await this.prisma.financeStatusHistory.create({
          data: { financeCaseId: bankQuery.financeCaseId, fromStage: 'BANK_QUERY', toStage: 'QUERY_RESOLVED', changedBy: resolvedBy },
        });
        await this.prisma.lead.update({ where: { id: financeCase.leadId }, data: { financeStatus: 'QUERY_RESOLVED' } });
      }
    }

    await this.auditLogs.logAction(resolvedBy, 'BankQuery', id, 'BANK_QUERY_RESOLVED', undefined, { resolutionNotes });
    return updated;
  }
}
