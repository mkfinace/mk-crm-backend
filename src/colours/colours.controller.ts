import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ColoursService } from './colours.service';
import { CreateColourDto, SetVehicleColoursDto, UpdateColourDto } from './colours.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequirePermission } from '../permissions/permissions.decorator';

@ApiTags('colours')
@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ColoursController {
  constructor(private coloursService: ColoursService) {}

  @RequirePermission('colours.manage')
  @Post('colours')
  createColour(@Body() data: CreateColourDto) {
    return this.coloursService.createColour(data);
  }

  @RequirePermission('colours.view')
  @Get('colours')
  listColours(@Query('includeArchived') includeArchived?: string, @Query('type') type?: string) {
    return this.coloursService.listColours(includeArchived === 'true', type);
  }

  @RequirePermission('colours.manage')
  @Put('colours/:id')
  updateColour(@Param('id') id: string, @Body() data: UpdateColourDto) {
    return this.coloursService.updateColour(id, data);
  }

  @RequirePermission('colours.manage')
  @Delete('colours/:id')
  deleteColour(@Param('id') id: string) {
    return this.coloursService.deleteColour(id);
  }

  @RequirePermission('colours.view')
  @Get('variants/:variantId/colours')
  getVehicleColoursByVariant(@Param('variantId') variantId: string) {
    return this.coloursService.getVehicleColoursByVariant(variantId);
  }

  @RequirePermission('colours.manage')
  @Put('variants/:variantId/colours')
  setVehicleColoursByVariant(@Param('variantId') variantId: string, @Body() data: SetVehicleColoursDto) {
    return this.coloursService.setVehicleColoursByVariant(variantId, data.items || []);
  }
}
