import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuditLogsService } from './auditlogs.service';

@ApiTags('audit-logs')
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private auditLogsService: AuditLogsService) {}

  @Get()
  listAuditLogs(
    @Query('entity') entity?: string,
    @Query('entityId') entityId?: string,
    @Query('userId') userId?: string,
  ) {
    return this.auditLogsService.listAuditLogs({ entity, entityId, userId });
  }
}
