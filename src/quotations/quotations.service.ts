import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class QuotationsService {
  constructor(private prisma: PrismaService, private realtime: RealtimeGateway) {}

  async createQuotation(data: {
    leadId: string;
    price: number;
    onRoadPrice: number;
    exchangeValue?: number;
    validTill: string;
    createdBy?: string;
    exShowroomPrice?: number;
    rto?: number;
    insurance?: number;
    accessories?: number;
    otherCharges?: number;
    discount?: number;
    exchangeBonus?: number;
    dealerOffer?: number;
    manufacturerOffer?: number;
    tcs?: number;
    extraWarranty?: number;
    fastag?: number;
    crtmCharges?: number;
    rsa?: number;
  }) {
    const lead = await this.prisma.lead.findUnique({ where: { id: data.leadId } });
    if (!lead) throw new NotFoundException('Lead not found.');

    // Never overwrite a previous quotation — each save is a new version.
    const latest = await this.prisma.quotation.findFirst({ where: { leadId: data.leadId }, orderBy: { version: 'desc' } });
    const version = (latest?.version || 0) + 1;

    const quotation = await this.prisma.quotation.create({
      data: {
        leadId: data.leadId,
        price: data.price,
        onRoadPrice: data.onRoadPrice,
        exchangeValue: data.exchangeValue,
        validTill: new Date(data.validTill),
        version,
        createdBy: data.createdBy,
        exShowroomPrice: data.exShowroomPrice,
        rto: data.rto,
        insurance: data.insurance,
        accessories: data.accessories,
        otherCharges: data.otherCharges,
        discount: data.discount,
        exchangeBonus: data.exchangeBonus,
        dealerOffer: data.dealerOffer,
        manufacturerOffer: data.manufacturerOffer,
        tcs: data.tcs,
        extraWarranty: data.extraWarranty,
        fastag: data.fastag,
        crtmCharges: data.crtmCharges,
        rsa: data.rsa,
      },
    });
    this.realtime.notifyLeadUpdated(data.leadId);
    return quotation;
  }

  listQuotations(leadId?: string) {
    return this.prisma.quotation.findMany({
      where: leadId ? { leadId } : {},
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteQuotation(id: string) {
    const quotation = await this.prisma.quotation.findUnique({ where: { id } });
    if (!quotation) throw new NotFoundException('Quotation not found.');
    const deleted = await this.prisma.quotation.delete({ where: { id } });
    this.realtime.notifyLeadUpdated(quotation.leadId);
    return deleted;
  }
}
