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
@RequirePermission('features.manage')
export class FeaturesController {
  constructor(private featuresService: FeaturesService) {}

  @Post('features')
  createFeature(@Body() data: CreateFeatureDto) {
    return this.featuresService.createFeature(data);
  }

  @Get('features')
  listFeatures(@Query('includeArchived') includeArchived?: string) {
    return this.featuresService.listFeatures(includeArchived === 'true');
  }

  @Put('features/:id')
  updateFeature(@Param('id') id: string, @Body() data: UpdateFeatureDto) {
    return this.featuresService.updateFeature(id, data);
  }

  @Delete('features/:id')
  deleteFeature(@Param('id') id: string) {
    return this.featuresService.deleteFeature(id);
  }

  @Get('variants/:variantId/features')
  getVariantFeatures(@Param('variantId') variantId: string) {
    return this.featuresService.getVariantFeatures(variantId);
  }

  @Put('variants/:variantId/features')
  setVariantFeatures(@Param('variantId') variantId: string, @Body() data: SetVariantFeaturesDto) {
    return this.featuresService.setVariantFeatures(variantId, data.items || []);
  }
}
