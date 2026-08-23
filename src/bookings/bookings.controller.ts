import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './bookings.dto';

@ApiTags('bookings')
@Controller('bookings')
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
