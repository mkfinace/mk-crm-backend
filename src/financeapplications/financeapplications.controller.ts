import { Body, Controller, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FinanceApplicationsService } from './financeapplications.service';
import { CreateFinanceApplicationDto, UpdateFinanceApplicationStatusDto } from './financeapplications.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { STAFF_ROLES } from '../auth/role-groups';

const FINANCE_ROLES = ['SUPER_ADMIN', 'FINANCE_ADMIN', 'FINANCE_EXECUTIVE'];

@ApiTags('finance-applications')
@Controller('finance-applications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...STAFF_ROLES)
export class FinanceApplicationsController {
  constructor(private financeApplicationsService: FinanceApplicationsService) {}

  @Roles(...FINANCE_ROLES)
  @Post()
  createApplication(@Body() data: CreateFinanceApplicationDto, @Req() req: any) {
    return this.financeApplicationsService.createApplication(data, req.user.sub);
  }

  @Get()
  listApplications(@Query('leadId') leadId: string) {
    return this.financeApplicationsService.listApplications(leadId);
  }

  @Roles(...FINANCE_ROLES)
  @Put(':id/status')
  updateStatus(@Param('id') id: string, @Body() data: UpdateFinanceApplicationStatusDto, @Req() req: any) {
    return this.financeApplicationsService.updateStatus(id, data.status, data.notes, req.user.sub);
  }
}
