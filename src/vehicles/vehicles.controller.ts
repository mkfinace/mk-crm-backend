import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { UpsertVehicleDto } from './vehicles.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequirePermission } from '../permissions/permissions.decorator';

@ApiTags('vehicles')
@Controller('vehicles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermission('vehicles.manage')
export class VehiclesController {
  constructor(private service: VehiclesService) {}

  @Get(':variantId')
  getByVariant(@Param('variantId') variantId: string) {
    return this.service.getByVariant(variantId);
  }

  @Put(':variantId')
  upsert(@Param('variantId') variantId: string, @Body() data: UpsertVehicleDto) {
    return this.service.upsertByVariant(variantId, data);
  }
}
