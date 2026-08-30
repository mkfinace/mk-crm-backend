import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

const DELIVERY_STATUSES = ['SCHEDULED', 'DELIVERED', 'DELAYED'];

@Injectable()
export class DeliveriesService {
  constructor(private prisma: PrismaService, private realtime: RealtimeGateway) {}

  async createDelivery(data: { leadId: string; scheduledAt: string }) {
    const lead = await this.prisma.lead.findUnique({ where: { id: data.leadId } });
    if (!lead) throw new NotFoundException('Lead not found.');
    const existing = await this.prisma.delivery.findUnique({ where: { leadId: data.leadId } });
    if (existing) throw new BadRequestException('This lead already has a delivery scheduled.');

    const delivery = await this.prisma.delivery.create({
      data: { leadId: data.leadId, scheduledAt: new Date(data.scheduledAt) },
    });
    this.realtime.notifyLeadUpdated(data.leadId);
    return delivery;
  }

  listDeliveries(leadId?: string) {
    return this.prisma.delivery.findMany({
      where: leadId ? { leadId } : {},
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async updateDelivery(id: string, data: { scheduledAt?: string; status?: string; deliveredAt?: string }) {
    const delivery = await this.prisma.delivery.findUnique({ where: { id } });
    if (!delivery) throw new NotFoundException('Delivery not found.');
    if (data.status && !DELIVERY_STATUSES.includes(data.status)) {
      throw new BadRequestException(`Invalid status: ${data.status}.`);
    }

    const updated = await this.prisma.delivery.update({
      where: { id },
      data: {
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
        status: data.status,
        deliveredAt: data.deliveredAt ? new Date(data.deliveredAt) : undefined,
      },
    });

    if (data.status === 'DELIVERED') {
      await this.prisma.lead.update({ where: { id: delivery.leadId }, data: { salesStatus: 'CLOSED' } });
    }

    this.realtime.notifyLeadUpdated(delivery.leadId);
    return updated;
  }
}
