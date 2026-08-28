import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { AddFollowUpDto, AssignLeadDto, CreateLeadDto, UpdateFinanceStatusDto, UpdateLeadDto, UpdateSalesStatusDto } from './leads.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { STAFF_ROLES } from '../auth/role-groups';

@ApiTags('leads')
@Controller('leads')
export class LeadsController {
  constructor(private leadsService: LeadsService) {}

  // Public — this is the website's enquiry form submission.
  @Post()
  createLead(@Body() data: CreateLeadDto) {
    return this.leadsService.createLead(data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...STAFF_ROLES)
  @Get()
  listLeads(
    @Query('dealerExecutiveId') dealerExecutiveId?: string,
    @Query('financeExecutiveId') financeExecutiveId?: string,
    @Query('salesStatus') salesStatus?: string,
  ) {
    return this.leadsService.listLeads({ dealerExecutiveId, financeExecutiveId, salesStatus });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...STAFF_ROLES)
  @Get(':id')
  getLead(@Param('id') id: string) {
    return this.leadsService.getLead(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...STAFF_ROLES)
  @Put(':id')
  updateLead(@Param('id') id: string, @Body() data: UpdateLeadDto) {
    return this.leadsService.updateLead(id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'SALES_ADMIN')
  @Delete(':id')
  deleteLead(@Param('id') id: string) {
    return this.leadsService.deleteLead(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'SALES_ADMIN', 'DEALER_MANAGER')
  @Put(':id/assign')
  assignLead(@Param('id') id: string, @Body() data: AssignLeadDto) {
    return this.leadsService.assignLead(id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...STAFF_ROLES)
  @Put(':id/sales-status')
  updateSalesStatus(@Param('id') id: string, @Body() data: UpdateSalesStatusDto) {
    return this.leadsService.updateSalesStatus(id, data.status, data.userId, data.lostReasonId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...STAFF_ROLES)
  @Put(':id/finance-status')
  updateFinanceStatus(@Param('id') id: string, @Body() data: UpdateFinanceStatusDto) {
    return this.leadsService.updateFinanceStatus(id, data.status, data.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...STAFF_ROLES)
  @Post(':id/follow-ups')
  addFollowUp(@Param('id') id: string, @Body() data: AddFollowUpDto) {
    return this.leadsService.addFollowUp(id, data.userId, data);
  }
}
