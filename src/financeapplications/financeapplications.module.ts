import { Module } from '@nestjs/common';
import { FinanceApplicationsController } from './financeapplications.controller';
import { FinanceApplicationsService } from './financeapplications.service';
import { AuditLogsModule } from '../auditlogs/auditlogs.module';

@Module({
  imports: [AuditLogsModule],
  controllers: [FinanceApplicationsController],
  providers: [FinanceApplicationsService],
})
export class FinanceApplicationsModule {}
