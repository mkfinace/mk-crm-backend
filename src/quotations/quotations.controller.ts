import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { QuotationsService } from './quotations.service';
import { CreateQuotationDto } from './quotations.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequirePermission } from '../permissions/permissions.decorator';

@ApiTags('quotations')
@Controller('quotations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class QuotationsController {
  constructor(private quotationsService: QuotationsService) {}

  // Customer Portal — read only, own quotations only.
  // Registered before ':id' so it cannot be swallowed as an id.
  @RequirePermission('portal.access')
  @Get('my')
  listMyQuotations(@Req() req: any, @Query('leadId') leadId?: string) {
    return this.quotationsService.listMyQuotations(req.user.sub, leadId);
  }

  @RequirePermission('portal.access')
  @Get('my/:id')
  getMyQuotation(@Req() req: any, @Param('id') id: string) {
    return this.quotationsService.getMyQuotation(req.user.sub, id);
  }

  @RequirePermission('quotations.manage')
  @Post()
  createQuotation(@Body() data: CreateQuotationDto, @Req() req: any) {
    return this.quotationsService.createQuotation({ ...data, createdBy: data.createdBy || req.user.sub });
  }

  @RequirePermission('quotations.view')
  @Get()
  listQuotations(@Query('leadId') leadId?: string) {
    return this.quotationsService.listQuotations(leadId);
  }

  @RequirePermission('quotations.manage')
  @Delete(':id')
  deleteQuotation(@Param('id') id: string, @Req() req: any) {
    return this.quotationsService.deleteQuotation(id, req.user.sub);
  }
}
