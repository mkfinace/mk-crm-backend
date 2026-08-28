import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './bookings.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { STAFF_ROLES } from '../auth/role-groups';

@ApiTags('bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...STAFF_ROLES)
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  @Post()
  createBooking(@Body() data: CreateBookingDto) {
    return this.bookingsService.createBooking(data);
  }

  @Get()
  listBookings(@Query('leadId') leadId?: string) {
    return this.bookingsService.listBookings(leadId);
  }

  @Get(':id')
  getBooking(@Param('id') id: string) {
    return this.bookingsService.getBooking(id);
  }
}
