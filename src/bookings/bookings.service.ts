import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService, private realtime: RealtimeGateway) {}

  async createBooking(data: { leadId: string; bookingAmount: number; bookedBy: string }) {
    const lead = await this.prisma.lead.findUnique({ where: { id: data.leadId } });
    if (!lead) throw new NotFoundException('Lead not found.');
    const existing = await this.prisma.booking.findUnique({ where: { leadId: data.leadId } });
    if (existing) throw new BadRequestException('This lead already has a booking.');

    const booking = await this.prisma.booking.create({ data });
    await this.prisma.lead.update({ where: { id: data.leadId }, data: { salesStatus: 'BOOKING' } });
    this.realtime.notifyLeadUpdated(data.leadId);
    return booking;
  }

  listBookings(leadId?: string) {
    return this.prisma.booking.findMany({
      where: leadId ? { leadId } : {},
      orderBy: { bookedAt: 'desc' },
    });
  }

  async getBooking(id: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id }, include: { lead: true } });
    if (!booking) throw new NotFoundException('Booking not found.');
    return booking;
  }
}
