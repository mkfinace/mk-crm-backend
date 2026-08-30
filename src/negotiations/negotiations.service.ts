import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogsService } from '../auditlogs/auditlogs.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

// Discount above this amount needs Dealer Manager / Admin sign-off before
// the Dealer Executive can proceed with it. Simple constant for now —
// move to a per-dealer SiteSetting later if different dealers need
// different limits.
const DISCOUNT_APPROVAL_LIMIT = 15000;

@Injectable()
export class NegotiationsService {
  constructor(private prisma: PrismaService, private auditLogs: AuditLogsService, private realtime: RealtimeGateway) {}

  async createNegotiation(data: {
    leadId: string;
    customerExpectedPrice?: number;
    dealerOfferedPrice?: number;
    discountRequested?: number;
    exchangeValueOffered?: number;
    accessoriesOffered?: string;
    specialOffer?: string;
    notes?: string;
    createdBy: string;
  }) {
    const lead = await this.prisma.lead.findUnique({ where: { id: data.leadId } });
    if (!lead) throw new NotFoundException('Lead not found.');

    const requiresApproval = (data.discountRequested || 0) > DISCOUNT_APPROVAL_LIMIT;

    const negotiation = await this.prisma.negotiation.create({
      data: {
        ...data,
        requiresApproval,
        approvalStatus: requiresApproval ? 'PENDING' : 'NOT_REQUIRED',
      },
    });

    await this.auditLogs.logAction(data.createdBy, 'Negotiation', negotiation.id, 'NEGOTIATION_RECORDED', undefined, {
      discountRequested: data.discountRequested,
      requiresApproval,
    });
    this.realtime.notifyLeadUpdated(data.leadId);
    return negotiation;
  }

  listNegotiations(leadId?: string) {
    return this.prisma.negotiation.findMany({
      where: leadId ? { leadId } : {},
      orderBy: { createdAt: 'desc' },
    });
  }

  async decideApproval(id: string, approve: boolean, decidedBy: string, discountApproved?: number) {
    const negotiation = await this.prisma.negotiation.findUnique({ where: { id } });
    if (!negotiation) throw new NotFoundException('Negotiation not found.');
    if (!negotiation.requiresApproval) {
      throw new BadRequestException('This negotiation was never flagged for approval.');
    }
    const updated = await this.prisma.negotiation.update({
      where: { id },
      data: {
        approvalStatus: approve ? 'APPROVED' : 'REJECTED',
        approvedBy: decidedBy,
        discountApproved: approve ? (discountApproved ?? negotiation.discountRequested) : 0,
      },
    });
    await this.auditLogs.logAction(decidedBy, 'Negotiation', id, approve ? 'NEGOTIATION_APPROVED' : 'NEGOTIATION_REJECTED');
    this.realtime.notifyLeadUpdated(negotiation.leadId);
    return updated;
  }
}
