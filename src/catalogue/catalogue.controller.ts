import { Body, Controller, Delete, Get, Param, Post, Put, Query, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CatalogueService } from './catalogue.service';
import { CreateBrandDto, CreateModelDto, CreateVariantDto, UpdateBrandDto, UpdateModelDto, UpdateVariantDto } from './catalogue.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequirePermission } from '../permissions/permissions.decorator';

// IMPORTANT: no class-level guard — the first three routes below are
// deliberately public (website catalogue pages + a one-off seed script)
// and must never pick up a controller-wide guard.
@ApiTags('catalogue')
@Controller('catalogue')
export class CatalogueController {
  constructor(private catalogueService: CatalogueService) {}

  // Public — used by the website's homepage/listing pages.
  @Get('full')
  fullCatalogue() {
    return this.catalogueService.fullCatalogue();
  }

  // One-off demo-data loader — open this URL once in a browser (no shell
  // needed). Safe to open more than once (idempotent upserts). Remove this
  // route once you no longer need it.
  @Get('admin/seed-commercial')
  seedCommercial(@Query('key') key: string) {
    if (key !== (process.env.SEED_KEY || 'mkfinance-seed-2026')) {
      throw new UnauthorizedException('Invalid or missing key.');
    }
    return this.catalogueService.seedCommercialDemo();
  }

  // Public detail page data for /[brand]/[model] on mk-crm-frontend
  @Get('model/:brandSlug/:modelSlug')
  getModelBySlug(@Param('brandSlug') brandSlug: string, @Param('modelSlug') modelSlug: string) {
    return this.catalogueService.getModelBySlug(brandSlug, modelSlug);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('catalogue.manage')
  @Get('brands')
  listBrands() {
    return this.catalogueService.listBrands();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('catalogue.manage')
  @Post('brands')
  createBrand(@Body() data: CreateBrandDto) {
    return this.catalogueService.createBrand(data);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('catalogue.manage')
  @Put('brands/:id')
  updateBrand(@Param('id') id: string, @Body() data: UpdateBrandDto) {
    return this.catalogueService.updateBrand(id, data);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('catalogue.manage')
  @Delete('brands/:id')
  deleteBrand(@Param('id') id: string) {
    return this.catalogueService.deleteBrand(id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('catalogue.manage')
  @Get('models')
  listModels(@Query('brandId') brandId?: string) {
    return this.catalogueService.listModels(brandId);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('catalogue.manage')
  @Post('models')
  createModel(@Body() data: CreateModelDto) {
    return this.catalogueService.createModel(data);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('catalogue.manage')
  @Put('models/:id')
  updateModel(@Param('id') id: string, @Body() data: UpdateModelDto) {
    return this.catalogueService.updateModel(id, data);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('catalogue.manage')
  @Delete('models/:id')
  deleteModel(@Param('id') id: string) {
    return this.catalogueService.deleteModel(id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('catalogue.manage')
  @Get('variants')
  listVariants(@Query('modelId') modelId?: string) {
    return this.catalogueService.listVariants(modelId);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('catalogue.manage')
  @Post('variants')
  createVariant(@Body() data: CreateVariantDto) {
    return this.catalogueService.createVariant(data);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('catalogue.manage')
  @Post('models/:modelId/variants/bulk-import')
  bulkImportVariants(@Param('modelId') modelId: string, @Body('rows') rows: { name: string; fuelType: string; transmission: string; exShowroomPrice: number }[]) {
    return this.catalogueService.bulkImportVariants(modelId, rows || []);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('catalogue.manage')
  @Put('variants/:id')
  updateVariant(@Param('id') id: string, @Body() data: UpdateVariantDto) {
    return this.catalogueService.updateVariant(id, data);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('catalogue.manage')
  @Delete('variants/:id')
  deleteVariant(@Param('id') id: string) {
    return this.catalogueService.deleteVariant(id);
  }
}
