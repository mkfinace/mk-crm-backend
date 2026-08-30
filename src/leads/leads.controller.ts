import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
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

  // ---- Customer Portal (self-service, own leads only) ----
  // Registered before the ':id' routes below so "my" doesn't get swallowed
  // as an :id parameter.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CUSTOMER')
  @Get('my')
  listMyLeads(@Req() req: any) {
    return this.leadsService.listMyLeads(req.user.sub);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CUSTOMER')
  @Get('my/:id')
  getMyLead(@Req() req: any, @Param('id') id: string) {
    return this.leadsService.getMyLead(req.user.sub, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CUSTOMER')
  @Post('my/:id/messages')
  addMyMessage(@Req() req: any, @Param('id') id: string, @Body('body') body: string) {
    return this.leadsService.addMyMessage(req.user.sub, id, body);
  }

  // Registered before ':id' for the same reason as the 'my' routes above.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...STAFF_ROLES)
  // Configurable SLA rules (e.g. First Contact hours, Same-Day Deal
  // target) — any staff can read (needed to render the Deal Command
  // Bar); only admins can change the thresholds.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...STAFF_ROLES)
  @Get('sla-config')
  getSlaConfig() {
    return this.leadsService.getSlaConfig();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'SALES_ADMIN', 'FINANCE_ADMIN')
  @Put('sla-config/:key')
  updateSlaConfig(@Param('key') key: string, @Body('hours') hours: number, @Req() req: any) {
    return this.leadsService.updateSlaConfig(key, Number(hours), req.user.sub);
  }

  @Get('follow-ups/dashboard')
  getFollowUpDashboard(
    @Query('dealerExecutiveId') dealerExecutiveId?: string,
    @Query('financeExecutiveId') financeExecutiveId?: string,
  ) {
    return this.leadsService.getFollowUpDashboard({ dealerExecutiveId, financeExecutiveId });
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

  // Deal Command Bar — both Sales and Finance can set/clear these; who did
  // it and when is captured via the activity log, not a role restriction.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...STAFF_ROLES)
  @Put(':id/next-action')
  updateNextAction(
    @Param('id') id: string,
    @Body() data: { nextAction?: string; nextActionOwner?: string; nextActionDueAt?: string },
    @Req() req: any,
  ) {
    return this.leadsService.updateNextAction(id, data, req.user.sub);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...STAFF_ROLES)
  @Put(':id/blocker')
  updateBlocker(@Param('id') id: string, @Body() data: { blocker: string | null; blockerCategory?: string | null }, @Req() req: any) {
    return this.leadsService.updateBlocker(id, data.blocker, data.blockerCategory ?? null, req.user.sub);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...STAFF_ROLES)
  @Put(':id/same-day-deal')
  setSameDayDeal(@Param('id') id: string, @Body('sameDayDeal') sameDayDeal: boolean, @Req() req: any) {
    return this.leadsService.setSameDayDeal(id, !!sameDayDeal, req.user.sub);
  }
}
