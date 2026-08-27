import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    await this.runStartupMigrations();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Self-healing schema patch — runs on every boot, safe to repeat
  // (IF NOT EXISTS). Exists so a small additive column doesn't require
  // Render Shell access (not available on the free plan).
  private async runStartupMigrations() {
    try {
      await this.$executeRawUnsafe(
        `ALTER TABLE "Model" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'CAR';`
      );
      this.logger.log('Startup migration check complete (Model.category ensured).');
    } catch (e) {
      this.logger.error('Startup migration failed — check DB permissions.', e as Error);
    }
  }
}
