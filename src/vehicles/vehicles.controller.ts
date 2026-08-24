import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { UpsertVehicleDto } from './vehicles.dto';

@ApiTags('vehicles')
@Controller('vehicles')
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
