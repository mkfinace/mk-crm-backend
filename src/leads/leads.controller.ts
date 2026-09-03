import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { AddFollowUpDto, AssignLeadDto, CreateLeadDto, UpdateFinanceStatusDto, UpdateLeadDto, UpdateSalesStatusDto } from './leads.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequirePermission } from '../permissions/permissions.decorator';

// First module migrated from the hardcoded @Roles() system to database-
// driven permissions (see src/permissions/) — every protected endpoint
// below uses PermissionsGuard + @RequirePermission instead of RolesGuard +
// @Roles. Default grants reproduce this module's exact prior behavior; an
// admin can now change who can do what from Settings → Permissions without
// a redeploy. Other modules still use the old RolesGuard system for now.
// IMPORTANT: guards stay per-method (not class-level) — createLead below
// is a deliberately public, unauthenticated endpoint (website enquiry
// form) and must never pick up a controller-wide guard.
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
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('portal.access')
  @Get('my')
  listMyLeads(@Req() req: any) {
    return this.leadsService.listMyLeads(req.user.sub);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('portal.access')
  @Get('my/:id')
  getMyLead(@Req() req: any, @Param('id') id: string) {
    return this.leadsService.getMyLead(req.user.sub, id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('portal.access')
  @Post('my/:id/messages')
  addMyMessage(@Req() req: any, @Param('id') id: string, @Body('body') body: string) {
    return this.leadsService.addMyMessage(req.user.sub, id, body);
  }

  // Registered before ':id' for the same reason as the 'my' routes above.
  // Configurable SLA rules (e.g. First Contact hours, Same-Day Deal
  // target) — any staff can read (needed to render the Deal Command
  // Bar); only admins can change the thresholds.
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('leads.view')
  @Get('sla-config')
  getSlaConfig() {
    return this.leadsService.getSlaConfig();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('leads.sla_config.manage')
  @Put('sla-config/:key')
  updateSlaConfig(@Param('key') key: string, @Body('hours') hours: number, @Req() req: any) {
    return this.leadsService.updateSlaConfig(key, Number(hours), req.user.sub);
  }

  // Was previously missing any guard at all — any unauthenticated caller
  // could hit this and see lead/customer data. Fixed as part of this
  // module's permission migration.
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('leads.view')
  @Get('follow-ups/dashboard')
  getFollowUpDashboard(
    @Query('dealerExecutiveId') dealerExecutiveId?: string,
    @Query('financeExecutiveId') financeExecutiveId?: string,
  ) {
    return this.leadsService.getFollowUpDashboard({ dealerExecutiveId, financeExecutiveId });
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('leads.view')
  @Get()
  listLeads(
    @Query('dealerExecutiveId') dealerExecutiveId?: string,
    @Query('financeExecutiveId') financeExecutiveId?: string,
    @Query('salesStatus') salesStatus?: string,
    @Query('enquiryType') enquiryType?: string,
  ) {
    return this.leadsService.listLeads({ dealerExecutiveId, financeExecutiveId, salesStatus, enquiryType });
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('leads.view')
  @Get(':id')
  getLead(@Param('id') id: string) {
    return this.leadsService.getLead(id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('leads.manage')
  @Put(':id')
  updateLead(@Param('id') id: string, @Body() data: UpdateLeadDto, @Req() req: any) {
    return this.leadsService.updateLead(id, data, req.user.sub);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('leads.delete')
  @Delete(':id')
  deleteLead(@Param('id') id: string, @Req() req: any) {
    return this.leadsService.deleteLead(id, req.user.sub);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('leads.assign')
  @Put(':id/assign')
  assignLead(@Param('id') id: string, @Body() data: AssignLeadDto) {
    return this.leadsService.assignLead(id, data);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('leads.manage')
  @Put(':id/sales-status')
  updateSalesStatus(@Param('id') id: string, @Body() data: UpdateSalesStatusDto) {
    return this.leadsService.updateSalesStatus(id, data.status, data.userId, data.lostReasonId);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('leads.manage')
  @Put(':id/finance-status')
  updateFinanceStatus(@Param('id') id: string, @Body() data: UpdateFinanceStatusDto) {
    return this.leadsService.updateFinanceStatus(id, data.status, data.userId);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('leads.manage')
  @Post(':id/follow-ups')
  addFollowUp(@Param('id') id: string, @Body() data: AddFollowUpDto) {
    return this.leadsService.addFollowUp(id, data.userId, data);
  }

  // Deal Command Bar — both Sales and Finance can set/clear these; who did
  // it and when is captured via the activity log, not a role restriction.
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('leads.manage')
  @Put(':id/next-action')
  updateNextAction(
    @Param('id') id: string,
    @Body() data: { nextAction?: string; nextActionOwner?: string; nextActionDueAt?: string },
    @Req() req: any,
  ) {
    return this.leadsService.updateNextAction(id, data, req.user.sub);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('leads.manage')
  @Put(':id/blocker')
  updateBlocker(@Param('id') id: string, @Body() data: { blocker: string | null; blockerCategory?: string | null }, @Req() req: any) {
    return this.leadsService.updateBlocker(id, data.blocker, data.blockerCategory ?? null, req.user.sub);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('leads.manage')
  @Put(':id/same-day-deal')
  setSameDayDeal(@Param('id') id: string, @Body('sameDayDeal') sameDayDeal: boolean, @Req() req: any) {
    return this.leadsService.setSameDayDeal(id, !!sameDayDeal, req.user.sub);
  }
}
