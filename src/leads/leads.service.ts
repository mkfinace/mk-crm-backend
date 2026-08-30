import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogsService } from '../auditlogs/auditlogs.service';
import { NotificationsService } from '../notifications/notifications.service';

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
  constructor(
    private prisma: PrismaService,
    private auditLogs: AuditLogsService,
    private notifications: NotificationsService,
  ) {}

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
    temperature?: string;
    purpose?: string;
    decisionMaker?: string;
    currentCar?: string;
    exchangeValue?: number;
    customerPriority?: string;
    fuelPreference?: string;
    transmissionPreference?: string;
    colourPreference?: string;
    specialRequirements?: string;
    customerNotes?: string;
  }) {
    let customer = await this.prisma.customer.findUnique({ where: { mobile: data.customerMobile } });
    if (!customer) {
      customer = await this.prisma.customer.create({
        data: { name: data.customerName, mobile: data.customerMobile, city: data.city },
      });
    } else if (data.customerName && (data.customerName !== customer.name || (data.city && data.city !== customer.city))) {
      // Same mobile enquiring again — keep the customer record's name/city
      // current rather than freezing it at whatever was typed the first time.
      customer = await this.prisma.customer.update({
        where: { id: customer.id },
        data: { name: data.customerName, city: data.city || customer.city },
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
        temperature: data.temperature || 'WARM',
        purpose: data.purpose,
        decisionMaker: data.decisionMaker,
        currentCar: data.currentCar,
        exchangeValue: data.exchangeValue,
        customerPriority: data.customerPriority,
        fuelPreference: data.fuelPreference,
        transmissionPreference: data.transmissionPreference,
        colourPreference: data.colourPreference,
        specialRequirements: data.specialRequirements,
        customerNotes: data.customerNotes,
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
        dealerExecutive: { select: { id: true, name: true, mobile: true, role: true } },
        financeExecutive: { select: { id: true, name: true, mobile: true, role: true } },
        bank: true,
        followUps: { orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true } } } },
        activities: { orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true } } } },
        quotations: true, testDrives: true, documents: true,
        financeCase: { include: { statusHistory: { orderBy: { createdAt: 'asc' } } } },
        booking: true, delivery: true,
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
    temperature?: string;
    purpose?: string;
    decisionMaker?: string;
    currentCar?: string;
    exchangeValue?: number;
    customerPriority?: string;
    fuelPreference?: string;
    transmissionPreference?: string;
    colourPreference?: string;
    specialRequirements?: string;
    customerNotes?: string;
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
        temperature: data.temperature,
        purpose: data.purpose,
        decisionMaker: data.decisionMaker,
        currentCar: data.currentCar,
        exchangeValue: data.exchangeValue,
        customerPriority: data.customerPriority,
        fuelPreference: data.fuelPreference,
        transmissionPreference: data.transmissionPreference,
        colourPreference: data.colourPreference,
        specialRequirements: data.specialRequirements,
        customerNotes: data.customerNotes,
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
    const before = await this.getLead(id); // 404 if missing

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
      include: {
        dealer: true,
        dealerExecutive: { select: { id: true, name: true, mobile: true, role: true } },
        bank: true,
        financeExecutive: { select: { id: true, name: true, mobile: true, role: true } },
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
    await this.logActivity(id, data.assignedBy, 'LEAD_ASSIGNED', {
      dealerId: data.dealerId, dealerExecutiveId: data.dealerExecutiveId,
      bankId: data.bankId, financeExecutiveId: data.financeExecutiveId,
    });
    await this.auditLogs.logAction(data.assignedBy, 'Lead', id, 'LEAD_ASSIGNED', undefined, {
      dealerId: data.dealerId, dealerExecutiveId: data.dealerExecutiveId,
      bankId: data.bankId, financeExecutiveId: data.financeExecutiveId,
    });

    // Notify the newly assigned executive(s) — only when the assignment actually changed.
    if (data.dealerExecutiveId && data.dealerExecutiveId !== before.dealerExecutiveId) {
      await this.notifications.notify(
        data.dealerExecutiveId,
        'LEAD_ASSIGNED',
        'New lead assigned to you',
        `${lead.leadCode} — ${before.customer?.name || 'A customer'} is interested in ${before.brand?.name || ''} ${before.model?.name || ''}.`.trim(),
      );
    }
    if (data.financeExecutiveId && data.financeExecutiveId !== before.financeExecutiveId) {
      await this.notifications.notify(
        data.financeExecutiveId,
        'LEAD_ASSIGNED',
        'New finance lead assigned to you',
        `${lead.leadCode} — ${before.customer?.name || 'A customer'} needs financing.`,
      );
    }

    return lead;
  }

  async updateSalesStatus(id: string, status: string, userId: string, lostReasonId?: string) {
    if (!SALES_PIPELINE.includes(status) && status !== 'HOLD' && status !== 'LOST') {
      throw new BadRequestException(`Invalid sales status: ${status}`);
    }
    if (status === 'LOST' && !lostReasonId) {
      throw new BadRequestException('Lost reason is mandatory when marking a lead as LOST.');
    }
    const before = await this.prisma.lead.findUnique({
      where: { id },
      include: { financeCase: true, booking: true, delivery: true },
    });

    // Deal Closure gating (Phase D) — CLOSED is only reachable once finance,
    // booking, and delivery are all genuinely done, so "Closed Won" always
    // means the same thing across every lead.
    if (status === 'CLOSED') {
      const missing: string[] = [];
      if (before?.financeRequired && before.financeStatus !== 'FINANCE_COMPLETED') missing.push('Finance not completed');
      if (!before?.booking) missing.push('No booking recorded');
      if (!before?.delivery || before.delivery.status !== 'DELIVERED') missing.push('Vehicle not yet delivered');
      if (missing.length > 0) {
        throw new BadRequestException(`Cannot close this lead yet — ${missing.join('; ')}.`);
      }
    }

    const lead = await this.prisma.lead.update({
      where: { id },
      data: {
        salesStatus: status,
        isHold: status === 'HOLD',
        isLost: status === 'LOST',
        lostReasonId: status === 'LOST' ? lostReasonId : null,
        ...(status === 'CLOSED' ? { closedAt: new Date(), closedBy: userId } : {}),
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

  // ==================== FOLLOW-UP DASHBOARD (Phase A) ====================
  // Returns each open lead's most recently logged follow-up (i.e. the
  // currently-scheduled next follow-up) so the frontend can bucket into
  // Due Today / Overdue / Upcoming / No Follow-up Scheduled.
  async getFollowUpDashboard(filters: { dealerExecutiveId?: string; financeExecutiveId?: string }) {
    const leads = await this.prisma.lead.findMany({
      where: {
        isLost: false,
        salesStatus: { notIn: ['CLOSED'] },
        ...(filters.dealerExecutiveId ? { dealerExecutiveId: filters.dealerExecutiveId } : {}),
        ...(filters.financeExecutiveId ? { financeExecutiveId: filters.financeExecutiveId } : {}),
      },
      include: {
        customer: { select: { name: true, mobile: true } },
        brand: { select: { name: true } },
        model: { select: { name: true } },
        followUps: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });

    return leads.map((l) => ({
      id: l.id,
      leadCode: l.leadCode,
      customerName: l.customer.name,
      customerMobile: l.customer.mobile,
      brand: l.brand?.name,
      model: l.model?.name,
      salesStatus: l.salesStatus,
      temperature: l.temperature,
      nextFollowUpAt: l.followUps[0]?.nextFollowUpAt || null,
      lastFollowUpResult: l.followUps[0]?.result || null,
    }));
  }

  // ==================== CUSTOMER PORTAL (customer-facing, self-service) ====================
  // Deliberately excludes internal-only data (FollowUp notes, Activity log,
  // dealer/finance-executive assignment, internal document verifiedBy) —
  // customers only see what's relevant to their own purchase/finance journey.

  listMyLeads(customerId: string) {
    return this.prisma.lead.findMany({
      where: { customerId },
      select: {
        id: true,
        leadCode: true,
        salesStatus: true,
        financeStatus: true,
        createdAt: true,
        brand: { select: { name: true } },
        model: { select: { name: true } },
        variant: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyLead(customerId: string, leadId: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        brand: true,
        model: true,
        variant: true,
        dealer: { select: { name: true, phone: true, address: true, city: true } },
        quotations: { orderBy: { createdAt: 'desc' } },
        testDrives: { orderBy: { scheduledAt: 'desc' } },
        documents: {
          select: { id: true, type: true, status: true, rejectionReason: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
        financeCase: {
          select: { bank: { select: { name: true } }, loanAmount: true, downPayment: true, tenureMonths: true, roi: true, emi: true, stage: true, createdAt: true },
        },
        booking: true,
        delivery: true,
        messages: {
          where: { customerVisible: true },
          select: { id: true, body: true, createdAt: true, senderCustomerId: true, sender: { select: { name: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!lead || lead.customerId !== customerId) throw new NotFoundException('Lead not found.');
    return lead;
  }

  async addMyMessage(customerId: string, leadId: string, body: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead || lead.customerId !== customerId) throw new NotFoundException('Lead not found.');
    return this.prisma.message.create({
      data: { leadId, senderCustomerId: customerId, body, customerVisible: true },
    });
  }
}
