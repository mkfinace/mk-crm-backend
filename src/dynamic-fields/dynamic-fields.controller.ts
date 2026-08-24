import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DynamicFieldsService } from './dynamic-fields.service';
import {
  CreateFieldCategoryDto, UpdateFieldCategoryDto,
  CreateFieldDefinitionDto, UpdateFieldDefinitionDto,
  SetFieldValueDto,
} from './dynamic-fields.dto';

@ApiTags('dynamic-fields')
@Controller()
export class DynamicFieldsController {
  constructor(private service: DynamicFieldsService) {}

  @Post('field-categories')
  createCategory(@Body() data: CreateFieldCategoryDto) {
    return this.service.createCategory(data);
  }

  @Get('field-categories')
  listCategories() {
    return this.service.listCategories();
  }

  @Put('field-categories/:id')
  updateCategory(@Param('id') id: string, @Body() data: UpdateFieldCategoryDto) {
    return this.service.updateCategory(id, data);
  }

  @Post('field-definitions')
  createField(@Body() data: CreateFieldDefinitionDto) {
    return this.service.createField(data);
  }

  @Get('field-definitions')
  listFields(@Query('categoryId') categoryId?: string) {
    return this.service.listFields(categoryId);
  }

  @Get('field-definitions/archived')
  listArchivedFields() {
    return this.service.listArchivedFields();
  }

  @Put('field-definitions/:id')
  updateField(@Param('id') id: string, @Body() data: UpdateFieldDefinitionDto) {
    return this.service.updateField(id, data);
  }

  @Put('field-definitions/:id/archive')
  archiveField(@Param('id') id: string) {
    return this.service.archiveField(id);
  }

  @Put('field-definitions/:id/restore')
  restoreField(@Param('id') id: string) {
    return this.service.restoreField(id);
  }

  @Delete('field-definitions/:id')
  deleteField(@Param('id') id: string) {
    return this.service.deleteField(id);
  }

  @Post('field-values')
  setValue(@Body() data: SetFieldValueDto) {
    return this.service.setValue(data);
  }

  @Get('field-values')
  listValuesForVariant(@Query('variantId') variantId: string) {
    return this.service.listValuesForVariant(variantId);
  }
}
