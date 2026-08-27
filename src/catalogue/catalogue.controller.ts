import { Body, Controller, Delete, Get, Param, Post, Put, Query, UnauthorizedException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CatalogueService } from './catalogue.service';
import { CreateBrandDto, CreateModelDto, CreateVariantDto, UpdateBrandDto, UpdateModelDto, UpdateVariantDto } from './catalogue.dto';

@ApiTags('catalogue')
@Controller('catalogue')
export class CatalogueController {
  constructor(private catalogueService: CatalogueService) {}

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

  @Get('brands')
  listBrands() {
    return this.catalogueService.listBrands();
  }

  @Post('brands')
  createBrand(@Body() data: CreateBrandDto) {
    return this.catalogueService.createBrand(data);
  }

  @Put('brands/:id')
  updateBrand(@Param('id') id: string, @Body() data: UpdateBrandDto) {
    return this.catalogueService.updateBrand(id, data);
  }

  @Delete('brands/:id')
  deleteBrand(@Param('id') id: string) {
    return this.catalogueService.deleteBrand(id);
  }

  @Get('models')
  listModels(@Query('brandId') brandId?: string) {
    return this.catalogueService.listModels(brandId);
  }

  @Post('models')
  createModel(@Body() data: CreateModelDto) {
    return this.catalogueService.createModel(data);
  }

  @Put('models/:id')
  updateModel(@Param('id') id: string, @Body() data: UpdateModelDto) {
    return this.catalogueService.updateModel(id, data);
  }

  @Delete('models/:id')
  deleteModel(@Param('id') id: string) {
    return this.catalogueService.deleteModel(id);
  }

  @Get('variants')
  listVariants(@Query('modelId') modelId?: string) {
    return this.catalogueService.listVariants(modelId);
  }

  @Post('variants')
  createVariant(@Body() data: CreateVariantDto) {
    return this.catalogueService.createVariant(data);
  }

  @Put('variants/:id')
  updateVariant(@Param('id') id: string, @Body() data: UpdateVariantDto) {
    return this.catalogueService.updateVariant(id, data);
  }

  @Delete('variants/:id')
  deleteVariant(@Param('id') id: string) {
    return this.catalogueService.deleteVariant(id);
  }
}
