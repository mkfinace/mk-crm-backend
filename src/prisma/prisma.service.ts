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
  {
    name: 'message_sender_nullable_and_customer_sender',
    sql: `ALTER TABLE "Message" ALTER COLUMN "senderUserId" DROP NOT NULL;`,
  },
  {
    name: 'message_sender_customer_id_column',
    sql: `ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "senderCustomerId" TEXT;`,
  },
  {
    name: 'dealer_bank_tie_up_table',
    sql: `CREATE TABLE IF NOT EXISTS "DealerBank" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "dealerId" TEXT NOT NULL,
      "bankId" TEXT NOT NULL
    );`,
  },
  {
    name: 'dealer_bank_unique_index',
    sql: `CREATE UNIQUE INDEX IF NOT EXISTS "DealerBank_dealerId_bankId_key" ON "DealerBank"("dealerId", "bankId");`,
  },
  {
    name: 'lead_qualification_fields',
    sql: `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "temperature" TEXT NOT NULL DEFAULT 'WARM';`,
  },
  {
    name: 'lead_purpose_field',
    sql: `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "purpose" TEXT;`,
  },
  {
    name: 'lead_decision_maker_field',
    sql: `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "decisionMaker" TEXT;`,
  },
  {
    name: 'lead_current_car_field',
    sql: `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "currentCar" TEXT;`,
  },
  {
    name: 'lead_exchange_value_field',
    sql: `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "exchangeValue" DOUBLE PRECISION;`,
  },
  {
    name: 'lead_customer_priority_field',
    sql: `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "customerPriority" TEXT;`,
  },
  {
    name: 'lead_fuel_preference_field',
    sql: `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "fuelPreference" TEXT;`,
  },
  {
    name: 'lead_transmission_preference_field',
    sql: `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "transmissionPreference" TEXT;`,
  },
  {
    name: 'lead_colour_preference_field',
    sql: `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "colourPreference" TEXT;`,
  },
  {
    name: 'lead_special_requirements_field',
    sql: `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "specialRequirements" TEXT;`,
  },
  {
    name: 'lead_customer_notes_field',
    sql: `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "customerNotes" TEXT;`,
  },
  // ---- Phase B: Quotation breakdown + versioning ----
  { name: 'quotation_version_field', sql: `ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;` },
  { name: 'quotation_created_by_field', sql: `ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;` },
  { name: 'quotation_ex_showroom_field', sql: `ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "exShowroomPrice" DOUBLE PRECISION;` },
  { name: 'quotation_rto_field', sql: `ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "rto" DOUBLE PRECISION;` },
  { name: 'quotation_insurance_field', sql: `ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "insurance" DOUBLE PRECISION;` },
  { name: 'quotation_accessories_field', sql: `ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "accessories" DOUBLE PRECISION;` },
  { name: 'quotation_other_charges_field', sql: `ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "otherCharges" DOUBLE PRECISION;` },
  { name: 'quotation_discount_field', sql: `ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "discount" DOUBLE PRECISION;` },
  { name: 'quotation_exchange_bonus_field', sql: `ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "exchangeBonus" DOUBLE PRECISION;` },
  { name: 'quotation_dealer_offer_field', sql: `ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "dealerOffer" DOUBLE PRECISION;` },
  { name: 'quotation_manufacturer_offer_field', sql: `ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "manufacturerOffer" DOUBLE PRECISION;` },
  // ---- Phase B: Negotiation table ----
  {
    name: 'negotiation_table',
    sql: `CREATE TABLE IF NOT EXISTS "Negotiation" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "leadId" TEXT NOT NULL,
      "customerExpectedPrice" DOUBLE PRECISION,
      "dealerOfferedPrice" DOUBLE PRECISION,
      "discountRequested" DOUBLE PRECISION,
      "discountApproved" DOUBLE PRECISION,
      "exchangeValueOffered" DOUBLE PRECISION,
      "accessoriesOffered" TEXT,
      "specialOffer" TEXT,
      "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
      "approvalStatus" TEXT NOT NULL DEFAULT 'NOT_REQUIRED',
      "approvedBy" TEXT,
      "notes" TEXT,
      "createdBy" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
  },
  // ---- Phase B: BankQuery table ----
  {
    name: 'bank_query_table',
    sql: `CREATE TABLE IF NOT EXISTS "BankQuery" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "financeCaseId" TEXT NOT NULL,
      "query" TEXT NOT NULL,
      "requestedDocument" TEXT,
      "dueDate" TIMESTAMP(3),
      "status" TEXT NOT NULL DEFAULT 'OPEN',
      "createdBy" TEXT NOT NULL,
      "resolvedBy" TEXT,
      "resolutionNotes" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "resolvedAt" TIMESTAMP(3)
    );`,
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
