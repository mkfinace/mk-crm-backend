import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FeaturesService } from './features.service';
import { CreateFeatureDto, SetVariantFeaturesDto, UpdateFeatureDto } from './features.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequirePermission } from '../permissions/permissions.decorator';

@ApiTags('features')
@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FeaturesController {
  constructor(private featuresService: FeaturesService) {}

  @RequirePermission('features.manage')
  @Post('features')
  createFeature(@Body() data: CreateFeatureDto) {
    return this.featuresService.createFeature(data);
  }

  @RequirePermission('features.view')
  @Get('features')
  listFeatures(@Query('includeArchived') includeArchived?: string) {
    return this.featuresService.listFeatures(includeArchived === 'true');
  }

  @RequirePermission('features.manage')
  @Put('features/:id')
  updateFeature(@Param('id') id: string, @Body() data: UpdateFeatureDto) {
    return this.featuresService.updateFeature(id, data);
  }

  @RequirePermission('features.manage')
  @Delete('features/:id')
  deleteFeature(@Param('id') id: string) {
    return this.featuresService.deleteFeature(id);
  }

  @RequirePermission('features.view')
  @Get('variants/:variantId/features')
  getVariantFeatures(@Param('variantId') variantId: string) {
    return this.featuresService.getVariantFeatures(variantId);
  }

  @RequirePermission('features.manage')
  @Put('variants/:variantId/features')
  setVariantFeatures(@Param('variantId') variantId: string, @Body() data: SetVariantFeaturesDto) {
    return this.featuresService.setVariantFeatures(variantId, data.items || []);
  }
}
