import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogsService } from '../auditlogs/auditlogs.service';

export const SALES_PIPELINE = [
  'NEW', 'CONTACTED', 'QUALIFIED', 'INTERESTED', 'TEST_DRIVE', 'QUOTATION',
  'NEGOTIATION', 'BOOKING', 'DELIVERY', 'CLOSED',
];
export const FINANCE_PIPELINE = [
  'NOT_REQUIRED', 'PENDING', 'DOCUMENTS', 'LOGIN', 'VERIFICATION', 'BANK_QUERY',
  'QUERY_RESOLVED', 'SANCTION', 'AGREEMENT', 'DISBURSEMENT', 'FINANCE_COMPLETED',
];
export const LOST_REASONS = [
  'Price High', 'Other Brand', 'Other Dealer', 'Finance Rejected',
  'Loan Amount Issue', 'Purchase Postponed', 'No Response', 'Not Interested', 'Other',
];

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService, private auditLogs: AuditLogsService) {}

  private async generateLeadCode(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.lead.count({
      where: { leadCode: { startsWith: `CAR-${year}-` } },
    });
    const next = (count + 1).toString().padStart(6, '0');
    return `CAR-${year}-${next}`;
  }

  async createLead(data: {
    customerName: string;
    customerMobile: string;
    city?: string;
    brandId?: string;
    modelId?: string;
    variantId?: string;
    budget?: number;
    financeRequired?: boolean;
    expectedPurchaseDate?: string;
    source?: string;
  }) {
    let customer = await this.prisma.customer.findUnique({ where: { mobile: data.customerMobile } });
    if (!customer) {
      customer = await this.prisma.customer.create({
        data: { name: data.customerName, mobile: data.customerMobile, city: data.city },
      });
    }

    const leadCode = await this.generateLeadCode();

    return this.prisma.lead.create({
      data: {
        leadCode,
        customerId: customer.id,
        brandId: data.brandId,
        modelId: data.modelId,
        variantId: data.variantId,
        budget: data.budget,
        financeRequired: data.financeRequired || false,
        expectedPurchaseDate: data.expectedPurchaseDate ? new Date(data.expectedPurchaseDate) : undefined,
        source: data.source || 'WEBSITE',
        financeStatus: data.financeRequired ? 'PENDING' : 'NOT_REQUIRED',
      },
      include: { customer: true, brand: true, model: true, variant: true },
    });
  }

  listLeads(filters: { dealerExecutiveId?: string; financeExecutiveId?: string; salesStatus?: string }) {
    return this.prisma.lead.findMany({
      where: {
        ...(filters.dealerExecutiveId ? { dealerExecutiveId: filters.dealerExecutiveId } : {}),
        ...(filters.financeExecutiveId ? { financeExecutiveId: filters.financeExecutiveId } : {}),
        ...(filters.salesStatus ? { salesStatus: filters.salesStatus } : {}),
      },
      include: { customer: true, brand: true, model: true, variant: true, dealer: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getLead(id: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        customer: true, brand: true, model: true, variant: true, dealer: true,
        dealerExecutive: true, financeExecutive: true, bank: true,
        followUps: { orderBy: { createdAt: 'desc' } },
        activities: { orderBy: { createdAt: 'desc' } },
        quotations: true, testDrives: true, documents: true,
        financeCase: true, booking: true, delivery: true,
      },
    });
    if (!lead) throw new NotFoundException('Lead not found.');
    return lead;
  }

  async updateLead(id: string, data: {
    customerName?: string;
    customerMobile?: string;
    city?: string;
    brandId?: string;
    modelId?: string;
    variantId?: string;
    budget?: number;
    financeRequired?: boolean;
    expectedPurchaseDate?: string;
    source?: string;
  }) {
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException('Lead not found.');

    if (data.customerName || data.customerMobile || data.city) {
      await this.prisma.customer.update({
        where: { id: lead.customerId },
        data: {
          ...(data.customerName ? { name: data.customerName } : {}),
          ...(data.customerMobile ? { mobile: data.customerMobile } : {}),
          ...(data.city ? { city: data.city } : {}),
        },
      });
    }

    return this.prisma.lead.update({
      where: { id },
      data: {
        brandId: data.brandId,
        modelId: data.modelId,
        variantId: data.variantId,
        budget: data.budget,
        financeRequired: data.financeRequired,
        expectedPurchaseDate: data.expectedPurchaseDate ? new Date(data.expectedPurchaseDate) : undefined,
        source: data.source,
      },
      include: { customer: true, brand: true, model: true, variant: true },
    });
  }

  async deleteLead(id: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException('Lead not found.');
    try {
      await this.prisma.activity.deleteMany({ where: { leadId: id } });
      await this.prisma.followUp.deleteMany({ where: { leadId: id } });
      await this.prisma.assignment.deleteMany({ where: { leadId: id } });
      await this.prisma.quotation.deleteMany({ where: { leadId: id } });
      await this.prisma.testDrive.deleteMany({ where: { leadId: id } });
      await this.prisma.document.deleteMany({ where: { leadId: id } });
      await this.prisma.message.deleteMany({ where: { leadId: id } });
      await this.prisma.booking.deleteMany({ where: { leadId: id } });
      await this.prisma.delivery.deleteMany({ where: { leadId: id } });
      const financeCase = await this.prisma.financeCase.findUnique({ where: { leadId: id } });
      if (financeCase) {
        await this.prisma.financeStatusHistory.deleteMany({ where: { financeCaseId: financeCase.id } });
        await this.prisma.financeCase.delete({ where: { id: financeCase.id } });
      }
      return await this.prisma.lead.delete({ where: { id } });
    } catch (e) {
      throw new BadRequestException('Could not delete this lead due to linked records.');
    }
  }

  async assignLead(id: string, data: {
    dealerId?: string;
    dealerExecutiveId?: string;
    bankId?: string;
    financeExecutiveId?: string;
    assignedBy: string;
  }) {
    await this.getLead(id); // 404 if missing

    // Validate the executive actually belongs to the selected dealer/bank.
    if (data.dealerExecutiveId && data.dealerId) {
      const exec = await this.prisma.dealerExecutive.findUnique({ where: { userId: data.dealerExecutiveId } });
      if (!exec || exec.dealerId !== data.dealerId) {
        throw new BadRequestException('This executive does not belong to the selected dealer.');
      }
    }
    if (data.financeExecutiveId && data.bankId) {
      const exec = await this.prisma.financeExecutive.findUnique({ where: { userId: data.financeExecutiveId } });
      if (!exec || exec.bankId !== data.bankId) {
        throw new BadRequestException('This executive does not belong to the selected bank.');
      }
    }

    const lead = await this.prisma.lead.update({
      where: { id },
      data: {
        dealerId: data.dealerId,
        dealerExecutiveId: data.dealerExecutiveId,
        bankId: data.bankId,
        financeExecutiveId: data.financeExecutiveId,
      },
      include: { dealer: true, dealerExecutive: true, bank: true, financeExecutive: true },
    });
    await this.prisma.assignment.create({
      data: {
        leadId: id,
        dealerExecutiveId: data.dealerExecutiveId,
        financeExecutiveId: data.financeExecutiveId,
        assignedBy: data.assignedBy,
      },
    });
    await this.logActivity(id, data.assignedBy, 'LEAD_ASSIGNED', {
      dealerId: data.dealerId, dealerExecutiveId: data.dealerExecutiveId,
      bankId: data.bankId, financeExecutiveId: data.financeExecutiveId,
    });
    await this.auditLogs.logAction(data.assignedBy, 'Lead', id, 'LEAD_ASSIGNED', undefined, {
      dealerId: data.dealerId, dealerExecutiveId: data.dealerExecutiveId,
      bankId: data.bankId, financeExecutiveId: data.financeExecutiveId,
    });
    return lead;
  }

  async updateSalesStatus(id: string, status: string, userId: string, lostReasonId?: string) {
    if (!SALES_PIPELINE.includes(status) && status !== 'HOLD' && status !== 'LOST') {
      throw new BadRequestException(`Invalid sales status: ${status}`);
    }
    if (status === 'LOST' && !lostReasonId) {
      throw new BadRequestException('Lost reason is mandatory when marking a lead as LOST.');
    }
    const before = await this.prisma.lead.findUnique({ where: { id } });
    const lead = await this.prisma.lead.update({
      where: { id },
      data: {
        salesStatus: status,
        isHold: status === 'HOLD',
        isLost: status === 'LOST',
        lostReasonId: status === 'LOST' ? lostReasonId : null,
      },
    });
    await this.logActivity(id, userId, 'SALES_STATUS_UPDATED', { status });
    await this.auditLogs.logAction(userId, 'Lead', id, 'SALES_STATUS_UPDATED', { salesStatus: before?.salesStatus }, { salesStatus: status });
    return lead;
  }

  async updateFinanceStatus(id: string, status: string, userId: string) {
    if (!FINANCE_PIPELINE.includes(status)) {
      throw new BadRequestException(`Invalid finance status: ${status}`);
    }
    const before = await this.prisma.lead.findUnique({ where: { id } });
    const lead = await this.prisma.lead.update({ where: { id }, data: { financeStatus: status } });
    await this.logActivity(id, userId, 'FINANCE_STATUS_UPDATED', { status });
    await this.auditLogs.logAction(userId, 'Lead', id, 'FINANCE_STATUS_UPDATED', { financeStatus: before?.financeStatus }, { financeStatus: status });
    return lead;
  }

  async addFollowUp(leadId: string, userId: string, data: { type: string; result: string; notes?: string; nextFollowUpAt: string }) {
    if (!data.nextFollowUpAt) throw new BadRequestException('Next follow-up date/time is mandatory.');
    const followUp = await this.prisma.followUp.create({
      data: { leadId, userId, type: data.type, result: data.result, notes: data.notes, nextFollowUpAt: new Date(data.nextFollowUpAt) },
    });
    await this.logActivity(leadId, userId, 'FOLLOW_UP_ADDED', { type: data.type, result: data.result });
    return followUp;
  }

  private async logActivity(leadId: string, userId: string, action: string, meta?: any) {
    return this.prisma.activity.create({
      data: { leadId, userId, action, metaJson: meta ? JSON.stringify(meta) : undefined },
    });
  }
}
