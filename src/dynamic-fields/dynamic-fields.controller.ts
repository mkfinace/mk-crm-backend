import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DynamicFieldsService } from './dynamic-fields.service';
import {
  CreateFieldCategoryDto, UpdateFieldCategoryDto,
  CreateFieldDefinitionDto, UpdateFieldDefinitionDto,
  SetFieldValueDto,
} from './dynamic-fields.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequirePermission } from '../permissions/permissions.decorator';

@ApiTags('dynamic-fields')
@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DynamicFieldsController {
  constructor(private service: DynamicFieldsService) {}

  @RequirePermission('dynamic_fields.manage')
  @Post('field-categories')
  createCategory(@Body() data: CreateFieldCategoryDto) {
    return this.service.createCategory(data);
  }

  @RequirePermission('dynamic_fields.view')
  @Get('field-categories')
  listCategories() {
    return this.service.listCategories();
  }

  @RequirePermission('dynamic_fields.manage')
  @Put('field-categories/:id')
  updateCategory(@Param('id') id: string, @Body() data: UpdateFieldCategoryDto) {
    return this.service.updateCategory(id, data);
  }

  @RequirePermission('dynamic_fields.manage')
  @Post('field-definitions')
  createField(@Body() data: CreateFieldDefinitionDto) {
    return this.service.createField(data);
  }

  @RequirePermission('dynamic_fields.view')
  @Get('field-definitions')
  listFields(@Query('categoryId') categoryId?: string) {
    return this.service.listFields(categoryId);
  }

  @RequirePermission('dynamic_fields.manage')
  @Get('field-definitions/archived')
  listArchivedFields() {
    return this.service.listArchivedFields();
  }

  @RequirePermission('dynamic_fields.manage')
  @Put('field-definitions/:id')
  updateField(@Param('id') id: string, @Body() data: UpdateFieldDefinitionDto) {
    return this.service.updateField(id, data);
  }

  @RequirePermission('dynamic_fields.manage')
  @Put('field-definitions/:id/archive')
  archiveField(@Param('id') id: string) {
    return this.service.archiveField(id);
  }

  @RequirePermission('dynamic_fields.manage')
  @Put('field-definitions/:id/restore')
  restoreField(@Param('id') id: string) {
    return this.service.restoreField(id);
  }

  @RequirePermission('dynamic_fields.manage')
  @Delete('field-definitions/:id')
  deleteField(@Param('id') id: string) {
    return this.service.deleteField(id);
  }

  @RequirePermission('dynamic_fields.manage')
  @Post('field-values')
  setValue(@Body() data: SetFieldValueDto) {
    return this.service.setValue(data);
  }

  @RequirePermission('dynamic_fields.view')
  @Get('field-values')
  listValuesForVariant(@Query('variantId') variantId: string) {
    return this.service.listValuesForVariant(variantId);
  }
}
