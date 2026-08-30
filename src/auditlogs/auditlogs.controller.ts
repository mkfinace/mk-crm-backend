import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuditLogsService } from './auditlogs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequirePermission } from '../permissions/permissions.decorator';

@ApiTags('audit-logs')
@Controller('audit-logs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermission('audit_logs.view')
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
