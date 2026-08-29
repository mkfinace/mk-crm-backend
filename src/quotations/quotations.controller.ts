import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { QuotationsService } from './quotations.service';
import { CreateQuotationDto } from './quotations.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { STAFF_ROLES } from '../auth/role-groups';

const SALES_QUOTE_ROLES = ['SUPER_ADMIN', 'SALES_ADMIN', 'DEALER_MANAGER', 'DEALER_EXECUTIVE'];

@ApiTags('quotations')
@Controller('quotations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...STAFF_ROLES)
export class QuotationsController {
  constructor(private quotationsService: QuotationsService) {}

  @Roles(...SALES_QUOTE_ROLES)
  @Post()
  createQuotation(@Body() data: CreateQuotationDto, @Req() req: any) {
    return this.quotationsService.createQuotation({ ...data, createdBy: data.createdBy || req.user.sub });
  }

  @Get()
  listQuotations(@Query('leadId') leadId?: string) {
    return this.quotationsService.listQuotations(leadId);
  }

  @Roles(...SALES_QUOTE_ROLES)
  @Delete(':id')
  deleteQuotation(@Param('id') id: string) {
    return this.quotationsService.deleteQuotation(id);
  }
}
