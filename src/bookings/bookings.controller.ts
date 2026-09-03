import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './bookings.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequirePermission } from '../permissions/permissions.decorator';

@ApiTags('bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  // Customer-safe routes: ownership is enforced by the service using req.user.sub.
  @RequirePermission('portal.access')
  @Get('my')
  listMyBookings(@Req() req: any) {
    return this.bookingsService.listMyBookings(req.user.sub);
  }

  @RequirePermission('portal.access')
  @Get('my/:id')
  getMyBooking(@Req() req: any, @Param('id') id: string) {
    return this.bookingsService.getMyBooking(req.user.sub, id);
  }

  @RequirePermission('bookings.manage')
  @Post()
  createBooking(@Body() data: CreateBookingDto) {
    return this.bookingsService.createBooking(data);
  }

  @RequirePermission('bookings.view')
  @Get()
  listBookings(@Query('leadId') leadId?: string) {
    return this.bookingsService.listBookings(leadId);
  }

  @RequirePermission('bookings.view')
  @Get(':id')
  getBooking(@Param('id') id: string) {
    return this.bookingsService.getBooking(id);
  }
}
