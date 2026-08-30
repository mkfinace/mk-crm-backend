import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService, private realtime: RealtimeGateway) {}

  async createMessage(data: {
    leadId: string;
    senderUserId: string;
    recipientUserId?: string;
    body: string;
    customerVisible?: boolean;
  }) {
    const lead = await this.prisma.lead.findUnique({ where: { id: data.leadId } });
    if (!lead) throw new NotFoundException('Lead not found.');
    const message = await this.prisma.message.create({
      data: {
        leadId: data.leadId,
        senderUserId: data.senderUserId,
        recipientUserId: data.recipientUserId,
        body: data.body,
        customerVisible: data.customerVisible || false,
      },
      include: { sender: true },
    });
    this.realtime.notifyLeadUpdated(data.leadId);
    return message;
  }

  listMessages(leadId: string) {
    return this.prisma.message.findMany({
      where: { leadId },
      include: { sender: true },
      orderBy: { createdAt: 'asc' },
    });
  }
}
