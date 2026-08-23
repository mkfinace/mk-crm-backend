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
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }
}
