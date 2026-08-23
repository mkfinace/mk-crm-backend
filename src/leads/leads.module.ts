import { Module } from '@nestjs/common';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { AuditLogsModule } from '../auditlogs/auditlogs.module';

@Module({
  imports: [AuditLogsModule],
  controllers: [LeadsController],
  providers: [LeadsService],
})
export class LeadsModule {}
