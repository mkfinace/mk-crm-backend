import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LeadsService } from './leads.service';

@ApiTags('leads')
@Controller('leads')
export class LeadsController {
  constructor(private leadsService: LeadsService) {}

  @Post()
  createLead(@Body() data: any) {
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
  assignLead(@Param('id') id: string, @Body() data: { dealerExecutiveId?: string; financeExecutiveId?: string; assignedBy: string }) {
    return this.leadsService.assignLead(id, data);
  }

  @Put(':id/sales-status')
  updateSalesStatus(@Param('id') id: string, @Body() data: { status: string; userId: string; lostReasonId?: string }) {
    return this.leadsService.updateSalesStatus(id, data.status, data.userId, data.lostReasonId);
  }

  @Put(':id/finance-status')
  updateFinanceStatus(@Param('id') id: string, @Body() data: { status: string; userId: string }) {
    return this.leadsService.updateFinanceStatus(id, data.status, data.userId);
  }

  @Post(':id/follow-ups')
  addFollowUp(@Param('id') id: string, @Body() data: { userId: string; type: string; result: string; notes?: string; nextFollowUpAt: string }) {
    return this.leadsService.addFollowUp(id, data.userId, data);
  }
}
