import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuotationsService {
  constructor(private prisma: PrismaService) {}

  async createQuotation(data: {
    leadId: string;
    price: number;
    onRoadPrice: number;
    exchangeValue?: number;
    validTill: string;
  }) {
    const lead = await this.prisma.lead.findUnique({ where: { id: data.leadId } });
    if (!lead) throw new NotFoundException('Lead not found.');
    return this.prisma.quotation.create({
      data: {
        leadId: data.leadId,
        price: data.price,
        onRoadPrice: data.onRoadPrice,
        exchangeValue: data.exchangeValue,
        validTill: new Date(data.validTill),
      },
    });
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
    return this.prisma.quotation.delete({ where: { id } });
  }
}
