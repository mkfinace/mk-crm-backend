import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogsService {
  constructor(private prisma: PrismaService) {}

  listAuditLogs(filters: { entity?: string; entityId?: string; userId?: string }) {
    return this.prisma.auditLog.findMany({
      where: {
        ...(filters.entity ? { entity: filters.entity } : {}),
        ...(filters.entityId ? { entityId: filters.entityId } : {}),
        ...(filters.userId ? { userId: filters.userId } : {}),
      },
      include: { user: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  // Called by other services to record a change. Never throws — a failed
  // audit write should not block the actual business operation.
  async logAction(userId: string, entity: string, entityId: string, action: string, before?: any, after?: any) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId,
          entity,
          entityId,
          action,
          beforeJson: before !== undefined ? JSON.stringify(before) : undefined,
          afterJson: after !== undefined ? JSON.stringify(after) : undefined,
        },
      });
    } catch (e) {
      // Swallow — audit logging is best-effort, not a request blocker.
    }
  }
}
