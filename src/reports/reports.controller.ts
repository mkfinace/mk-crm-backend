import { Controller, Get, Header, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

const REPORT_ROLES = ['SUPER_ADMIN', 'SALES_ADMIN', 'FINANCE_ADMIN', 'DEALER_MANAGER'];

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...REPORT_ROLES)
export class ReportsController {
  constructor(private reports: ReportsService) {}

  @Get('sales')
  sales(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reports.salesReport(from, to);
  }

  @Get('finance')
  finance(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reports.financeReport(from, to);
  }

  @Get('dealer-performance')
  dealerPerformance(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reports.dealerPerformanceReport(from, to);
  }

  @Get('export')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="leads-export.csv"')
  export(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reports.exportLeadsCsv(from, to);
  }
}
