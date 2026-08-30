import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OffersService } from './offers.service';
import { CreateOfferDto, UpdateOfferDto } from './offers.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequirePermission } from '../permissions/permissions.decorator';

@ApiTags('offers')
@Controller('offers')
export class OffersController {
  constructor(private offersService: OffersService) {}

  // Public — the website shows currently-running offers on car pages.
  @Get()
  listOffers(
    @Query('brandId') brandId?: string,
    @Query('modelId') modelId?: string,
    @Query('variantId') variantId?: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.offersService.listOffers({ brandId, modelId, variantId, activeOnly: activeOnly !== 'false' });
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('offers.manage')
  @Get('admin/all')
  listAllForAdmin() {
    return this.offersService.listOffers();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('offers.manage')
  @Post()
  createOffer(@Body() data: CreateOfferDto, @Req() req: any) {
    return this.offersService.createOffer(data, req.user.sub);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('offers.manage')
  @Put(':id')
  updateOffer(@Param('id') id: string, @Body() data: UpdateOfferDto) {
    return this.offersService.updateOffer(id, data);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('offers.manage')
  @Delete(':id')
  deleteOffer(@Param('id') id: string) {
    return this.offersService.deleteOffer(id);
  }
}
