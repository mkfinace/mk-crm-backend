import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// ============================================================================
// SCHEMA SYNC STRATEGY (read this before adding to the list below):
// This app deploys to Render's free plan, which has no Shell access — so the
// textbook `prisma migrate deploy` (which needs a one-time bootstrap against
// the live DB to reconcile with tables that already exist) isn't safely
// doable remotely without risking a broken deploy with no way to fix it.
//
// Instead: every schema change ships as one idempotent, safe-to-repeat SQL
// statement below. On every boot, each statement runs in order; already-
// applied ones are no-ops (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS). This
// is the ONE place schema changes belong — don't add raw SQL anywhere else.
//
// When adding a new schema change: append a new { name, sql } entry at the
// end of MIGRATIONS. Never edit or remove a past entry (even years later),
// since removing one just means it silently stops being checked on old
// databases that never got that column/table for some reason.
// ============================================================================

const MIGRATIONS: { name: string; sql: string }[] = [
  {
    name: 'model_category_column',
    sql: `ALTER TABLE "Model" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'CAR';`,
  },
  {
    name: 'site_setting_table',
    sql: `CREATE TABLE IF NOT EXISTS "SiteSetting" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "key" TEXT NOT NULL,
      "label" TEXT NOT NULL,
      "group" TEXT NOT NULL DEFAULT 'general',
      "valueJson" TEXT NOT NULL,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
  },
  {
    name: 'site_setting_key_unique_index',
    sql: `CREATE UNIQUE INDEX IF NOT EXISTS "SiteSetting_key_key" ON "SiteSetting"("key");`,
  },
];

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

  private async runStartupMigrations() {
    for (const m of MIGRATIONS) {
      try {
        await this.$executeRawUnsafe(m.sql);
      } catch (e) {
        // One bad statement shouldn't block the rest from applying, or stop
        // the app from booting — log it and keep going.
        this.logger.error(`Startup migration "${m.name}" failed — check DB permissions/syntax.`, e as Error);
      }
    }
    this.logger.log(`Startup migration check complete (${MIGRATIONS.length} statement(s) checked).`);
  }
}
