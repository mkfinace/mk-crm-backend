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
@RequirePermission('colours.manage')
export class ColoursController {
  constructor(private coloursService: ColoursService) {}

  @Post('colours')
  createColour(@Body() data: CreateColourDto) {
    return this.coloursService.createColour(data);
  }

  @Get('colours')
  listColours(@Query('includeArchived') includeArchived?: string, @Query('type') type?: string) {
    return this.coloursService.listColours(includeArchived === 'true', type);
  }

  @Put('colours/:id')
  updateColour(@Param('id') id: string, @Body() data: UpdateColourDto) {
    return this.coloursService.updateColour(id, data);
  }

  @Delete('colours/:id')
  deleteColour(@Param('id') id: string) {
    return this.coloursService.deleteColour(id);
  }

  @Get('variants/:variantId/colours')
  getVehicleColoursByVariant(@Param('variantId') variantId: string) {
    return this.coloursService.getVehicleColoursByVariant(variantId);
  }

  @Put('variants/:variantId/colours')
  setVehicleColoursByVariant(@Param('variantId') variantId: string, @Body() data: SetVehicleColoursDto) {
    return this.coloursService.setVehicleColoursByVariant(variantId, data.items || []);
  }
}
