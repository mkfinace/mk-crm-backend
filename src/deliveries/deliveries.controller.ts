import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DeliveriesService } from './deliveries.service';
import { CreateDeliveryDto, UpdateDeliveryDto } from './deliveries.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { STAFF_ROLES } from '../auth/role-groups';

@ApiTags('deliveries')
@Controller('deliveries')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...STAFF_ROLES)
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
