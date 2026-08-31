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

// IMPORTANT: no class-level guard — listFilterableFields() below is
// deliberately public (the website's listing page uses it to build its
// filter sidebar) and must never pick up a controller-wide guard.
@ApiTags('dynamic-fields')
@Controller()
export class DynamicFieldsController {
  constructor(private service: DynamicFieldsService) {}

  // Public — no guard.
  @Get('field-definitions/filterable')
  listFilterableFields() {
    return this.service.listFilterableFields();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('dynamic_fields.manage')
  @Post('field-categories')
  createCategory(@Body() data: CreateFieldCategoryDto) {
    return this.service.createCategory(data);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('dynamic_fields.view')
  @Get('field-categories')
  listCategories() {
    return this.service.listCategories();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('dynamic_fields.manage')
  @Put('field-categories/:id')
  updateCategory(@Param('id') id: string, @Body() data: UpdateFieldCategoryDto) {
    return this.service.updateCategory(id, data);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('dynamic_fields.manage')
  @Post('field-definitions')
  createField(@Body() data: CreateFieldDefinitionDto) {
    return this.service.createField(data);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('dynamic_fields.view')
  @Get('field-definitions')
  listFields(@Query('categoryId') categoryId?: string) {
    return this.service.listFields(categoryId);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('dynamic_fields.manage')
  @Get('field-definitions/archived')
  listArchivedFields() {
    return this.service.listArchivedFields();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('dynamic_fields.manage')
  @Put('field-definitions/:id')
  updateField(@Param('id') id: string, @Body() data: UpdateFieldDefinitionDto) {
    return this.service.updateField(id, data);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('dynamic_fields.manage')
  @Put('field-definitions/:id/archive')
  archiveField(@Param('id') id: string) {
    return this.service.archiveField(id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('dynamic_fields.manage')
  @Put('field-definitions/:id/restore')
  restoreField(@Param('id') id: string) {
    return this.service.restoreField(id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('dynamic_fields.manage')
  @Delete('field-definitions/:id')
  deleteField(@Param('id') id: string) {
    return this.service.deleteField(id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('dynamic_fields.manage')
  @Post('field-values')
  setValue(@Body() data: SetFieldValueDto) {
    return this.service.setValue(data);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('dynamic_fields.view')
  @Get('field-values')
  listValuesForVariant(@Query('variantId') variantId: string) {
    return this.service.listValuesForVariant(variantId);
  }
}
