import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SALES_PIPELINE, FINANCE_PIPELINE } from '../leads/leads.service';

function dateFilter(from?: string, to?: string) {
  if (!from && !to) return undefined;
  const range: { gte?: Date; lte?: Date } = {};
  if (from) range.gte = new Date(from);
  if (to) range.lte = new Date(`${to}T23:59:59.999Z`);
  return range;
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async salesReport(from?: string, to?: string, dealerId?: string) {
    const createdAt = dateFilter(from, to);
    const leads = await this.prisma.lead.findMany({
      where: { ...(createdAt ? { createdAt } : {}), ...(dealerId ? { dealerId } : {}) },
      include: { brand: true, model: true, lostReason: true },
    });

    const byStage: Record<string, number> = {};
    for (const s of SALES_PIPELINE) byStage[s] = 0;
    const bySource: Record<string, number> = {};
    const byBrand: Record<string, number> = {};
    const byLostReason: Record<string, number> = {};
    let lostCount = 0;
    let holdCount = 0;
    let closedCount = 0;

    for (const l of leads) {
      if (byStage[l.salesStatus] !== undefined) byStage[l.salesStatus]++;
      bySource[l.source] = (bySource[l.source] || 0) + 1;
      if (l.brand?.name) byBrand[l.brand.name] = (byBrand[l.brand.name] || 0) + 1;
      if (l.isLost) {
        lostCount++;
        const reason = l.lostReason?.label || 'Not specified';
        byLostReason[reason] = (byLostReason[reason] || 0) + 1;
      }
      if (l.isHold) holdCount++;
      if (l.salesStatus === 'CLOSED') closedCount++;
    }

    const total = leads.length;
    return {
      total,
      closedCount,
      lostCount,
      holdCount,
      conversionRate: total > 0 ? Math.round((closedCount / total) * 1000) / 10 : 0,
      byStage,
      bySource,
      byBrand,
      byLostReason,
      pipelineOrder: SALES_PIPELINE,
    };
  }

  async financeReport(from?: string, to?: string, dealerId?: string) {
    const createdAt = dateFilter(from, to);
    const leads = await this.prisma.lead.findMany({
      where: { financeRequired: true, ...(createdAt ? { createdAt } : {}), ...(dealerId ? { dealerId } : {}) },
    });
    const cases = await this.prisma.financeCase.findMany({
      where: { ...(createdAt ? { createdAt } : {}), ...(dealerId ? { lead: { dealerId } } : {}) },
      include: { bank: true },
    });

    const byStage: Record<string, number> = {};
    for (const s of FINANCE_PIPELINE) byStage[s] = 0;
    for (const l of leads) {
      if (byStage[l.financeStatus] !== undefined) byStage[l.financeStatus]++;
    }

    const byBank: Record<string, { count: number; totalLoanAmount: number }> = {};
    let totalLoanAmount = 0;
    let disbursedAmount = 0;
    let sanctionedCount = 0;
    let disbursedCount = 0;

    for (const c of cases) {
      totalLoanAmount += c.loanAmount || 0;
      const bankName = c.bank?.name || 'Unknown';
      if (!byBank[bankName]) byBank[bankName] = { count: 0, totalLoanAmount: 0 };
      byBank[bankName].count++;
      byBank[bankName].totalLoanAmount += c.loanAmount || 0;
      if (['SANCTION', 'AGREEMENT', 'DISBURSEMENT', 'FINANCE_COMPLETED'].includes(c.stage)) sanctionedCount++;
      if (c.stage === 'DISBURSEMENT' || c.stage === 'FINANCE_COMPLETED') {
        disbursedCount++;
        disbursedAmount += c.loanAmount || 0;
      }
    }

    return {
      totalFinanceLeads: leads.length,
      totalCases: cases.length,
      sanctionedCount,
      disbursedCount,
      totalLoanAmount,
      disbursedAmount,
      byStage,
      byBank,
      pipelineOrder: FINANCE_PIPELINE,
    };
  }

  // dealerIds: when set, scopes the whole report to just those dealer(s) —
  // used for a Dealer Manager's own "My Team" view so they only ever see
  // their own dealership's numbers, never another dealer's.
  async dealerPerformanceReport(from?: string, to?: string, dealerIds?: string[]) {
    const createdAt = dateFilter(from, to);
    const leads = await this.prisma.lead.findMany({
      where: {
        dealerId: dealerIds && dealerIds.length > 0 ? { in: dealerIds } : { not: null },
        ...(createdAt ? { createdAt } : {}),
      },
      include: {
        dealer: true, dealerExecutive: true,
        quotations: true, testDrives: true, booking: true, followUps: true, financeCase: true,
      },
    });

    const byDealer: Record<string, { dealerName: string; total: number; closed: number; lost: number; conversionRate: number }> = {};
    const byExecutive: Record<
      string,
      {
        execName: string; dealerName: string; total: number; closed: number; lost: number; conversionRate: number;
        firstContactCount: number; firstContactPct: number;
        quotations: number; testDrives: number; bookings: number;
        avgClosureDays: number | null; financeConversion: number | null;
        _closureDaysSum: number; _closedWithClosureCount: number;
        _financeLeadsTotal: number; _financeCompleted: number;
      }
    > = {};

    for (const l of leads) {
      if (l.dealerId) {
        if (!byDealer[l.dealerId]) byDealer[l.dealerId] = { dealerName: l.dealer?.name || 'Unknown', total: 0, closed: 0, lost: 0, conversionRate: 0 };
        byDealer[l.dealerId].total++;
        if (l.salesStatus === 'CLOSED') byDealer[l.dealerId].closed++;
        if (l.isLost) byDealer[l.dealerId].lost++;
      }
      if (l.dealerExecutiveId) {
        if (!byExecutive[l.dealerExecutiveId]) {
          byExecutive[l.dealerExecutiveId] = {
            execName: l.dealerExecutive?.name || 'Unknown', dealerName: l.dealer?.name || 'Unknown',
            total: 0, closed: 0, lost: 0, conversionRate: 0,
            firstContactCount: 0, firstContactPct: 0,
            quotations: 0, testDrives: 0, bookings: 0,
            avgClosureDays: null, financeConversion: null,
            _closureDaysSum: 0, _closedWithClosureCount: 0,
            _financeLeadsTotal: 0, _financeCompleted: 0,
          };
        }
        const e = byExecutive[l.dealerExecutiveId];
        e.total++;
        if (l.salesStatus === 'CLOSED') e.closed++;
        if (l.isLost) e.lost++;
        if (l.followUps && l.followUps.length > 0) e.firstContactCount++;
        e.quotations += l.quotations?.length || 0;
        e.testDrives += l.testDrives?.length || 0;
        if (l.booking) e.bookings++;
        if (l.closedAt) {
          e._closureDaysSum += (new Date(l.closedAt).getTime() - new Date(l.createdAt).getTime()) / 86400000;
          e._closedWithClosureCount++;
        }
        if (l.financeRequired) {
          e._financeLeadsTotal++;
          if (l.financeStatus === 'FINANCE_COMPLETED') e._financeCompleted++;
        }
      }
    }

    for (const d of Object.values(byDealer)) {
      d.conversionRate = d.total > 0 ? Math.round((d.closed / d.total) * 1000) / 10 : 0;
    }
    for (const e of Object.values(byExecutive)) {
      e.conversionRate = e.total > 0 ? Math.round((e.closed / e.total) * 1000) / 10 : 0;
      e.firstContactPct = e.total > 0 ? Math.round((e.firstContactCount / e.total) * 1000) / 10 : 0;
      e.avgClosureDays = e._closedWithClosureCount > 0 ? Math.round((e._closureDaysSum / e._closedWithClosureCount) * 10) / 10 : null;
      e.financeConversion = e._financeLeadsTotal > 0 ? Math.round((e._financeCompleted / e._financeLeadsTotal) * 1000) / 10 : null;
      delete (e as any)._closureDaysSum;
      delete (e as any)._closedWithClosureCount;
      delete (e as any)._financeLeadsTotal;
      delete (e as any)._financeCompleted;
    }

    return {
      byDealer: Object.values(byDealer).sort((a, b) => b.total - a.total),
      byExecutive: Object.values(byExecutive).sort((a, b) => b.total - a.total),
    };
  }

  async exportLeadsCsv(from?: string, to?: string) {
    const createdAt = dateFilter(from, to);
    const leads = await this.prisma.lead.findMany({
      where: createdAt ? { createdAt } : undefined,
      include: { customer: true, brand: true, model: true, dealer: true, dealerExecutive: true },
      orderBy: { createdAt: 'desc' },
    });

    const headers = ['Lead Code', 'Customer', 'Mobile', 'City', 'Brand', 'Model', 'Sales Status', 'Finance Status', 'Source', 'Budget', 'Dealer', 'Dealer Executive', 'Created At'];
    const escape = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = leads.map((l) =>
      [
        l.leadCode,
        l.customer?.name,
        l.customer?.mobile,
        l.customer?.city,
        l.brand?.name,
        l.model?.name,
        l.salesStatus,
        l.financeStatus,
        l.source,
        l.budget,
        l.dealer?.name,
        l.dealerExecutive?.name,
        l.createdAt.toISOString(),
      ]
        .map(escape)
        .join(','),
    );
    return [headers.map(escape).join(','), ...rows].join('\n');
  }
}
