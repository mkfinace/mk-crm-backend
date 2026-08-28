import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { UpsertVehicleDto } from './vehicles.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ADMIN_ROLES } from '../auth/role-groups';

@ApiTags('vehicles')
@Controller('vehicles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_ROLES)
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
