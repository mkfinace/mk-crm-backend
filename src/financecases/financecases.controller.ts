import { Body, Controller, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FinanceCasesService } from './financecases.service';
import { CreateFinanceCaseDto, UpdateFinanceCaseStageDto } from './financecases.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { STAFF_ROLES } from '../auth/role-groups';

@ApiTags('finance-cases')
@Controller('finance-cases')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...STAFF_ROLES)
export class FinanceCasesController {
  constructor(private financeCasesService: FinanceCasesService) {}

  @Post()
  createFinanceCase(@Body() data: CreateFinanceCaseDto, @Req() req: any) {
    return this.financeCasesService.createFinanceCase(data, req.user.role);
  }

  @Get()
  listFinanceCases(@Query('leadId') leadId?: string) {
    return this.financeCasesService.listFinanceCases(leadId);
  }

  @Get(':id')
  getFinanceCase(@Param('id') id: string) {
    return this.financeCasesService.getFinanceCase(id);
  }

  @Put(':id/stage')
  updateStage(@Param('id') id: string, @Body() data: UpdateFinanceCaseStageDto) {
    return this.financeCasesService.updateStage(id, data.stage, data.changedBy, data.notes);
  }

  // Editing the numbers themselves (not just stage) — finance-side only,
  // and only while the case is still open (service enforces the lock).
  @Roles('SUPER_ADMIN', 'FINANCE_ADMIN', 'FINANCE_EXECUTIVE')
  @Put(':id/details')
  updateDetails(@Param('id') id: string, @Body() data: any, @Req() req: any) {
    return this.financeCasesService.updateDetails(id, data, req.user.sub);
  }

  // Admin sign-off on a Dealer-submitted finance case before it becomes active.
  @Roles('SUPER_ADMIN', 'FINANCE_ADMIN')
  @Put(':id/approve')
  approve(@Param('id') id: string, @Req() req: any) {
    return this.financeCasesService.approveFinanceCase(id, req.user.sub);
  }
}
