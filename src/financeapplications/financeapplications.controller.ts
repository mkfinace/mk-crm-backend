import { Body, Controller, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FinanceApplicationsService } from './financeapplications.service';
import { CreateFinanceApplicationDto, UpdateFinanceApplicationStatusDto } from './financeapplications.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequirePermission } from '../permissions/permissions.decorator';

@ApiTags('finance-applications')
@Controller('finance-applications')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FinanceApplicationsController {
  constructor(private financeApplicationsService: FinanceApplicationsService) {}

  @RequirePermission('finance_applications.manage')
  @Post()
  createApplication(@Body() data: CreateFinanceApplicationDto, @Req() req: any) {
    return this.financeApplicationsService.createApplication(data, req.user.sub);
  }

  @RequirePermission('finance_applications.view')
  @Get()
  listApplications(@Query('leadId') leadId: string) {
    return this.financeApplicationsService.listApplications(leadId);
  }

  @RequirePermission('finance_applications.manage')
  @Put(':id/status')
  updateStatus(@Param('id') id: string, @Body() data: UpdateFinanceApplicationStatusDto, @Req() req: any) {
    return this.financeApplicationsService.updateStatus(id, data.status, data.notes, req.user.sub);
  }
}
