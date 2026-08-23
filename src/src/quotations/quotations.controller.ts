import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { QuotationsService } from './quotations.service';
import { CreateQuotationDto } from './quotations.dto';

@ApiTags('quotations')
@Controller('quotations')
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
