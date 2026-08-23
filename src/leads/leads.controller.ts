import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { AddFollowUpDto, AssignLeadDto, CreateLeadDto, UpdateFinanceStatusDto, UpdateSalesStatusDto } from './leads.dto';

@ApiTags('leads')
@Controller('leads')
export class LeadsController {
  constructor(private leadsService: LeadsService) {}

  @Post()
  createLead(@Body() data: CreateLeadDto) {
    return this.leadsService.createLead(data);
  }

  @Get()
  listLeads(
    @Query('dealerExecutiveId') dealerExecutiveId?: string,
    @Query('financeExecutiveId') financeExecutiveId?: string,
    @Query('salesStatus') salesStatus?: string,
  ) {
    return this.leadsService.listLeads({ dealerExecutiveId, financeExecutiveId, salesStatus });
  }

  @Get(':id')
  getLead(@Param('id') id: string) {
    return this.leadsService.getLead(id);
  }

  @Put(':id/assign')
  assignLead(@Param('id') id: string, @Body() data: AssignLeadDto) {
    return this.leadsService.assignLead(id, data);
  }

  @Put(':id/sales-status')
  updateSalesStatus(@Param('id') id: string, @Body() data: UpdateSalesStatusDto) {
    return this.leadsService.updateSalesStatus(id, data.status, data.userId, data.lostReasonId);
  }

  @Put(':id/finance-status')
  updateFinanceStatus(@Param('id') id: string, @Body() data: UpdateFinanceStatusDto) {
    return this.leadsService.updateFinanceStatus(id, data.status, data.userId);
  }

  @Post(':id/follow-ups')
  addFollowUp(@Param('id') id: string, @Body() data: AddFollowUpDto) {
    return this.leadsService.addFollowUp(id, data.userId, data);
  }
}
