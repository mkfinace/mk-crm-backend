import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { WarrantyService } from './warranty.service';
import { UpsertWarrantyDto } from './warranty.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequirePermission } from '../permissions/permissions.decorator';

@ApiTags('warranty')
@Controller('variants')
export class WarrantyController {
  constructor(private warrantyService: WarrantyService) {}

  // Public — shown on the car detail page.
  @Get(':variantId/warranty')
  getByVariant(@Param('variantId') variantId: string) {
    return this.warrantyService.getByVariant(variantId);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('warranty.manage')
  @Put(':variantId/warranty')
  upsert(@Param('variantId') variantId: string, @Body() data: UpsertWarrantyDto) {
    return this.warrantyService.upsertByVariant(variantId, data);
  }
}
