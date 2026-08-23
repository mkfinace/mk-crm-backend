import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DeliveriesService } from './deliveries.service';
import { CreateDeliveryDto, UpdateDeliveryDto } from './deliveries.dto';

@ApiTags('deliveries')
@Controller('deliveries')
export class DeliveriesController {
  constructor(private deliveriesService: DeliveriesService) {}

  @Post()
  createDelivery(@Body() data: CreateDeliveryDto) {
    return this.deliveriesService.createDelivery(data);
  }

  @Get()
  listDeliveries(@Query('leadId') leadId?: string) {
    return this.deliveriesService.listDeliveries(leadId);
  }

  @Put(':id')
  updateDelivery(@Param('id') id: string, @Body() data: UpdateDeliveryDto) {
    return this.deliveriesService.updateDelivery(id, data);
  }
}
