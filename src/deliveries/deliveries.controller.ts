import { Body, Controller, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DeliveriesService } from './deliveries.service';
import { CreateDeliveryDto, UpdateDeliveryDto } from './deliveries.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequirePermission } from '../permissions/permissions.decorator';

@ApiTags('deliveries')
@Controller('deliveries')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DeliveriesController {
  constructor(private deliveriesService: DeliveriesService) {}

  @RequirePermission('deliveries.manage')
  @Post()
  createDelivery(@Body() data: CreateDeliveryDto, @Req() req: any) {
    return this.deliveriesService.createDelivery(data, req.user.sub);
  }

  @RequirePermission('deliveries.view')
  @Get()
  listDeliveries(@Query('leadId') leadId?: string) {
    return this.deliveriesService.listDeliveries(leadId);
  }

  @RequirePermission('deliveries.manage')
  @Put(':id')
  updateDelivery(@Param('id') id: string, @Body() data: UpdateDeliveryDto, @Req() req: any) {
    return this.deliveriesService.updateDelivery(id, data, req.user.sub);
  }
}
