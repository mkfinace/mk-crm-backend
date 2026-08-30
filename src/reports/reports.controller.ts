import { Controller, Get, Header, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { DealersService } from '../dealers/dealers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

const REPORT_ROLES = ['SUPER_ADMIN', 'SALES_ADMIN', 'FINANCE_ADMIN', 'DEALER_MANAGER'];

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...REPORT_ROLES)
export class ReportsController {
  constructor(private reports: ReportsService, private dealers: DealersService) {}

  // A Dealer Manager only ever sees their own dealership's numbers — never
  // another dealer's. Everyone else (Admin roles) sees company-wide.
  private async scopeDealerId(req: any): Promise<string | undefined> {
    if (req.user.role !== 'DEALER_MANAGER') return undefined;
    return (await this.dealers.getDealerIdForManager(req.user.sub)) || undefined;
  }

  @Get('sales')
  async sales(@Query('from') from: string | undefined, @Query('to') to: string | undefined, @Req() req: any) {
    return this.reports.salesReport(from, to, await this.scopeDealerId(req));
  }

  @Get('finance')
  async finance(@Query('from') from: string | undefined, @Query('to') to: string | undefined, @Req() req: any) {
    return this.reports.financeReport(from, to, await this.scopeDealerId(req));
  }

  @Get('dealer-performance')
  async dealerPerformance(@Query('from') from: string | undefined, @Query('to') to: string | undefined, @Req() req: any) {
    const dealerId = await this.scopeDealerId(req);
    return this.reports.dealerPerformanceReport(from, to, dealerId ? [dealerId] : undefined);
  }

  @Get('export')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="leads-export.csv"')
  export(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reports.exportLeadsCsv(from, to);
  }
}
