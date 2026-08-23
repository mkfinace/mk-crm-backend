import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CatalogueService } from './catalogue.service';
import { CreateBrandDto, CreateModelDto, CreateVariantDto } from './catalogue.dto';

@ApiTags('catalogue')
@Controller('catalogue')
export class CatalogueController {
  constructor(private catalogueService: CatalogueService) {}

  @Get('full')
  fullCatalogue() {
    return this.catalogueService.fullCatalogue();
  }

  @Get('brands')
  listBrands() {
    return this.catalogueService.listBrands();
  }

  @Post('brands')
  createBrand(@Body() data: CreateBrandDto) {
    return this.catalogueService.createBrand(data);
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

  @Delete('variants/:id')
  deleteVariant(@Param('id') id: string) {
    return this.catalogueService.deleteVariant(id);
  }
}
