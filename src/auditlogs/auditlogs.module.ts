import { Module } from '@nestjs/common';
import { AuditLogsController } from './auditlogs.controller';
import { AuditLogsService } from './auditlogs.service';

@Module({
  controllers: [AuditLogsController],
  providers: [AuditLogsService],
})
export class AuditLogsModule {}
