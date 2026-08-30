import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogsService } from '../auditlogs/auditlogs.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class FinanceApplicationsService {
  constructor(private prisma: PrismaService, private auditLogs: AuditLogsService, private realtime: RealtimeGateway) {}

  async createApplication(
    data: {
      leadId: string;
      bankId: string;
      applicationNumber?: string;
      loginDate?: string;
      loanAmount?: number;
      tenureMonths?: number;
      notes?: string;
    },
    executiveId: string,
  ) {
    const lead = await this.prisma.lead.findUnique({ where: { id: data.leadId } });
    if (!lead) throw new NotFoundException('Lead not found.');

    const application = await this.prisma.financeApplication.create({
      data: {
        leadId: data.leadId,
        bankId: data.bankId,
        applicationNumber: data.applicationNumber,
        loginDate: data.loginDate ? new Date(data.loginDate) : undefined,
        loanAmount: data.loanAmount,
        tenureMonths: data.tenureMonths,
        executiveId,
        notes: data.notes,
      },
      include: { bank: true },
    });

    await this.auditLogs.logAction(executiveId, 'FinanceApplication', application.id, 'FINANCE_APPLICATION_CREATED', undefined, { bankId: data.bankId });
    this.realtime.notifyLeadUpdated(data.leadId);
    return application;
  }

  listApplications(leadId: string) {
    return this.prisma.financeApplication.findMany({
      where: { leadId },
      include: { bank: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, status: string, notes: string | undefined, changedBy: string) {
    const application = await this.prisma.financeApplication.findUnique({ where: { id } });
    if (!application) throw new NotFoundException('Finance application not found.');
    const updated = await this.prisma.financeApplication.update({
      where: { id },
      data: { status, notes: notes ?? application.notes },
      include: { bank: true },
    });
    await this.auditLogs.logAction(changedBy, 'FinanceApplication', id, 'FINANCE_APPLICATION_STATUS_UPDATED', { status: application.status }, { status });
    this.realtime.notifyLeadUpdated(application.leadId);
    return updated;
  }
}
