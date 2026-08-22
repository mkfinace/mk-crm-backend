import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CatalogueService } from './catalogue.service';

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
  createBrand(@Body() data: { name: string; logoUrl?: string }) {
    return this.catalogueService.createBrand(data);
  }

  @Get('models')
  listModels(@Query('brandId') brandId?: string) {
    return this.catalogueService.listModels(brandId);
  }
  @Post('models')
  createModel(@Body() data: { brandId: string; name: string }) {
    return this.catalogueService.createModel(data);
  }

  @Get('variants')
  listVariants(@Query('modelId') modelId?: string) {
    return this.catalogueService.listVariants(modelId);
  }
  @Post('variants')
  createVariant(@Body() data: any) {
    return this.catalogueService.createVariant(data);
  }
}
