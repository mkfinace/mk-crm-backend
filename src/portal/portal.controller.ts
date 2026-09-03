import { Controller, Get, Param, Post, Body, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('portal')
@UseGuards(JwtAuthGuard)
export class PortalController {
  constructor(private prisma: PrismaService) {}

  private customerId(req: any) { return req.user?.customerId || req.user?.customer?.id || req.user?.sub; }

  @Get('my/bookings')
  async bookings(@Req() req: any) {
    const customerId = this.customerId(req);
    return this.prisma.booking.findMany({ where: { lead: { customerId } }, include: { lead: { include: { brand: true, model: true, variant: true } } }, orderBy: { bookedAt: 'desc' } });
  }

  @Get('my/deliveries')
  async deliveries(@Req() req: any) {
    const customerId = this.customerId(req);
    return this.prisma.delivery.findMany({ where: { lead: { customerId } }, include: { lead: { include: { brand: true, model: true, variant: true } } }, orderBy: { scheduledAt: 'desc' } });
  }

  @Get('my/quotations')
  async quotations(@Req() req: any) {
    const customerId = this.customerId(req);
    return this.prisma.quotation.findMany({ where: { lead: { customerId } }, include: { lead: { include: { brand: true, model: true, variant: true } } }, orderBy: { createdAt: 'desc' } });
  }

  @Post('my/deliveries/request')
  async requestDelivery(@Req() req: any, @Body() body: { leadId: string; scheduledAt: string }) {
    const customerId = this.customerId(req);
    const lead = await this.prisma.lead.findFirst({ where: { id: body.leadId, customerId } });
    if (!lead) throw new Error('Lead not found.');
    const existing = await this.prisma.delivery.findUnique({ where: { leadId: body.leadId } });
    if (existing) return existing;
    return this.prisma.delivery.create({ data: { leadId: body.leadId, scheduledAt: new Date(body.scheduledAt) } });
  }
}
