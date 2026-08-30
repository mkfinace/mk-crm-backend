import { Body, Controller, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FinanceCasesService } from './financecases.service';
import { CreateFinanceCaseDto, UpdateFinanceCaseStageDto } from './financecases.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequirePermission } from '../permissions/permissions.decorator';

@ApiTags('finance-cases')
@Controller('finance-cases')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FinanceCasesController {
  constructor(private financeCasesService: FinanceCasesService) {}

  @RequirePermission('finance_cases.manage')
  @Post()
  createFinanceCase(@Body() data: CreateFinanceCaseDto, @Req() req: any) {
    return this.financeCasesService.createFinanceCase(data, req.user.role);
  }

  @RequirePermission('finance_cases.view')
  @Get()
  listFinanceCases(@Query('leadId') leadId?: string) {
    return this.financeCasesService.listFinanceCases(leadId);
  }

  @RequirePermission('finance_cases.view')
  @Get(':id')
  getFinanceCase(@Param('id') id: string) {
    return this.financeCasesService.getFinanceCase(id);
  }

  @RequirePermission('finance_cases.manage')
  @Put(':id/stage')
  updateStage(@Param('id') id: string, @Body() data: UpdateFinanceCaseStageDto) {
    return this.financeCasesService.updateStage(id, data.stage, data.changedBy, data.notes);
  }

  // Editing the numbers themselves (not just stage) — finance-side only,
  // and only while the case is still open (service enforces the lock).
  @RequirePermission('finance_cases.manage_details')
  @Put(':id/details')
  updateDetails(@Param('id') id: string, @Body() data: any, @Req() req: any) {
    return this.financeCasesService.updateDetails(id, data, req.user.sub);
  }

  // Admin sign-off on a Dealer-submitted finance case before it becomes active.
  @RequirePermission('finance_cases.approve')
  @Put(':id/approve')
  approve(@Param('id') id: string, @Req() req: any) {
    return this.financeCasesService.approveFinanceCase(id, req.user.sub);
  }

  // ---- Phase B: structured Bank Query ----
  @RequirePermission('finance_cases.bank_query.manage')
  @Post(':id/bank-queries')
  createBankQuery(@Param('id') id: string, @Body() data: { query: string; requestedDocument?: string; dueDate?: string }, @Req() req: any) {
    return this.financeCasesService.createBankQuery(id, data, req.user.sub);
  }

  @RequirePermission('finance_cases.view')
  @Get(':id/bank-queries')
  listBankQueries(@Param('id') id: string) {
    return this.financeCasesService.listBankQueries(id);
  }

  @RequirePermission('finance_cases.bank_query.manage')
  @Put(':id/bank-queries/:queryId/resolve')
  resolveBankQuery(@Param('queryId') queryId: string, @Body('resolutionNotes') resolutionNotes: string, @Req() req: any) {
    return this.financeCasesService.resolveBankQuery(queryId, resolutionNotes, req.user.sub);
  }
}
