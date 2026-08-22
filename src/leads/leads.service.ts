import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Locked pipeline sequences per CLAUDE.md section 9 & 11
export const SALES_PIPELINE = [
  'NEW', 'CONTACTED', 'QUALIFIED', 'INTERESTED', 'TEST_DRIVE', 'QUOTATION',
  'NEGOTIATION', 'BOOKING', 'DELIVERY', 'CLOSED',
]; // HOLD and LOST can apply at any point
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
  constructor(private prisma: PrismaService) {}

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
    // Find or create the customer by mobile number
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
        followUps: { orderBy: { createdAt: 'desc' } },
        activities: { orderBy: { createdAt: 'desc' } },
        quotations: true, testDrives: true, documents: true,
        financeCase: true, booking: true, delivery: true,
      },
    });
    if (!lead) throw new NotFoundException('Lead not found.');
    return lead;
  }

  async assignLead(id: string, data: { dealerExecutiveId?: string; financeExecutiveId?: string; assignedBy: string }) {
    await this.getLead(id); // 404 if missing
    const lead = await this.prisma.lead.update({
      where: { id },
      data: {
        dealerExecutiveId: data.dealerExecutiveId,
        financeExecutiveId: data.financeExecutiveId,
      },
    });
    await this.prisma.assignment.create({
      data: {
        leadId: id,
        dealerExecutiveId: data.dealerExecutiveId,
        financeExecutiveId: data.financeExecutiveId,
        assignedBy: data.assignedBy,
      },
    });
    await this.logActivity(id, data.assignedBy, 'LEAD_ASSIGNED', { dealerExecutiveId: data.dealerExecutiveId, financeExecutiveId: data.financeExecutiveId });
    return lead;
  }

  async updateSalesStatus(id: string, status: string, userId: string, lostReasonId?: string) {
    if (!SALES_PIPELINE.includes(status) && status !== 'HOLD' && status !== 'LOST') {
      throw new BadRequestException(`Invalid sales status: ${status}`);
    }
    if (status === 'LOST' && !lostReasonId) {
      throw new BadRequestException('Lost reason is mandatory when marking a lead as LOST.');
    }
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
    return lead;
  }

  async updateFinanceStatus(id: string, status: string, userId: string) {
    if (!FINANCE_PIPELINE.includes(status)) {
      throw new BadRequestException(`Invalid finance status: ${status}`);
    }
    const lead = await this.prisma.lead.update({ where: { id }, data: { financeStatus: status } });
    await this.logActivity(id, userId, 'FINANCE_STATUS_UPDATED', { status });
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
    // Activity/audit trail is append-only — never silently deletable (CLAUDE.md section 13)
    return this.prisma.activity.create({
      data: { leadId, userId, action, metaJson: meta ? JSON.stringify(meta) : undefined },
    });
  }
}
