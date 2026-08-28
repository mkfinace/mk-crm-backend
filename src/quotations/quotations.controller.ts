import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { QuotationsService } from './quotations.service';
import { CreateQuotationDto } from './quotations.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { STAFF_ROLES } from '../auth/role-groups';

@ApiTags('quotations')
@Controller('quotations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...STAFF_ROLES)
export class QuotationsController {
  constructor(private quotationsService: QuotationsService) {}

  @Post()
  createQuotation(@Body() data: CreateQuotationDto) {
    return this.quotationsService.createQuotation(data);
  }

  @Get()
  listQuotations(@Query('leadId') leadId?: string) {
    return this.quotationsService.listQuotations(leadId);
  }

  @Delete(':id')
  deleteQuotation(@Param('id') id: string) {
    return this.quotationsService.deleteQuotation(id);
  }
}
