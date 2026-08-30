import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PricingService } from './pricing.service';
import { CreateVariantPriceDto } from './pricing.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequirePermission } from '../permissions/permissions.decorator';

@ApiTags('pricing')
@Controller('pricing')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PricingController {
  constructor(private pricingService: PricingService) {}

  @RequirePermission('pricing.manage')
  @Post()
  createPrice(@Body() data: CreateVariantPriceDto, @Req() req: any) {
    return this.pricingService.createPrice(data, req.user.sub);
  }

  @RequirePermission('pricing.view')
  @Get('current')
  getCurrentPrice(@Query('variantId') variantId: string, @Query('dealerId') dealerId?: string, @Query('city') city?: string) {
    return this.pricingService.getCurrentPrice(variantId, dealerId, city);
  }

  @RequirePermission('pricing.view')
  @Get('history')
  listHistory(@Query('variantId') variantId: string, @Query('dealerId') dealerId?: string, @Query('city') city?: string) {
    return this.pricingService.listHistory(variantId, dealerId, city);
  }

  @RequirePermission('pricing.view')
  @Get('cities')
  listCitiesWithPricing() {
    return this.pricingService.listCitiesWithPricing();
  }
}
