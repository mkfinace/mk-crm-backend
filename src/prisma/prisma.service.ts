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
  { name: 'quotation_tcs_field', sql: `ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "tcs" DOUBLE PRECISION;` },
  { name: 'quotation_extra_warranty_field', sql: `ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "extraWarranty" DOUBLE PRECISION;` },
  { name: 'quotation_fastag_field', sql: `ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "fastag" DOUBLE PRECISION;` },
  { name: 'quotation_crtm_charges_field', sql: `ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "crtmCharges" DOUBLE PRECISION;` },
  { name: 'document_person_type_field', sql: `ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "personType" TEXT NOT NULL DEFAULT 'APPLICANT';` },
  { name: 'document_person_name_field', sql: `ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "personName" TEXT;` },
  { name: 'quotation_rsa_field', sql: `ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "rsa" DOUBLE PRECISION;` },
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
  // ---- Phase D: Deal Closure metadata ----
  { name: 'lead_closed_at_field', sql: `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "closedAt" TIMESTAMP(3);` },
  { name: 'lead_closed_by_field', sql: `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "closedBy" TEXT;` },
  { name: 'lead_next_action_field', sql: `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "nextAction" TEXT;` },
  { name: 'lead_next_action_owner_field', sql: `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "nextActionOwner" TEXT;` },
  { name: 'lead_next_action_due_field', sql: `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "nextActionDueAt" TIMESTAMP(3);` },
  { name: 'lead_blocker_field', sql: `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "blocker" TEXT;` },
  { name: 'lead_same_day_deal_field', sql: `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "sameDayDeal" BOOLEAN NOT NULL DEFAULT false;` },
  { name: 'lead_same_day_deal_started_field', sql: `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "sameDayDealStartedAt" TIMESTAMP(3);` },
  {
    name: 'finance_application_table',
    sql: `CREATE TABLE IF NOT EXISTS "FinanceApplication" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "leadId" TEXT NOT NULL,
      "bankId" TEXT NOT NULL,
      "applicationNumber" TEXT,
      "loginDate" TIMESTAMP(3),
      "loanAmount" DOUBLE PRECISION,
      "tenureMonths" INTEGER,
      "status" TEXT NOT NULL DEFAULT 'LOGIN_PENDING',
      "executiveId" TEXT,
      "notes" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
  },
  // ---- Blocker taxonomy + configurable SLA ----
  { name: 'lead_blocker_category_field', sql: `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "blockerCategory" TEXT;` },
  {
    name: 'sla_config_table',
    sql: `CREATE TABLE IF NOT EXISTS "SlaConfig" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "key" TEXT NOT NULL,
      "label" TEXT NOT NULL,
      "hours" INTEGER NOT NULL,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
  },
  {
    name: 'sla_config_key_unique_index',
    sql: `CREATE UNIQUE INDEX IF NOT EXISTS "SlaConfig_key_key" ON "SlaConfig"("key");`,
  },
  // ---- OTP brute-force protection ----
  { name: 'otp_code_attempts_field', sql: `ALTER TABLE "OtpCode" ADD COLUMN IF NOT EXISTS "attempts" INTEGER NOT NULL DEFAULT 0;` },
  // ---- Staff password login brute-force protection ----
  { name: 'user_failed_login_attempts_field', sql: `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0;` },
  { name: 'user_locked_until_field', sql: `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP(3);` },
  { name: 'lead_enquiry_type_field', sql: `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "enquiryType" TEXT;` },
  { name: 'model_meta_title_field', sql: `ALTER TABLE "Model" ADD COLUMN IF NOT EXISTS "metaTitle" TEXT;` },
  { name: 'model_meta_description_field', sql: `ALTER TABLE "Model" ADD COLUMN IF NOT EXISTS "metaDescription" TEXT;` },
  // ---- RBAC: database-driven permissions ----
  {
    name: 'permission_table',
    sql: `CREATE TABLE IF NOT EXISTS "Permission" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "code" TEXT NOT NULL,
      "label" TEXT NOT NULL,
      "module" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
  },
  { name: 'permission_code_unique_index', sql: `CREATE UNIQUE INDEX IF NOT EXISTS "Permission_code_key" ON "Permission"("code");` },
  {
    name: 'role_permission_table',
    sql: `CREATE TABLE IF NOT EXISTS "RolePermission" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "role" TEXT NOT NULL,
      "permissionCode" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
  },
  { name: 'role_permission_role_code_unique_index', sql: `CREATE UNIQUE INDEX IF NOT EXISTS "RolePermission_role_permissionCode_key" ON "RolePermission"("role", "permissionCode");` },
  // ---- Feature & Colour libraries ----
  {
    name: 'feature_table',
    sql: `CREATE TABLE IF NOT EXISTS "Feature" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "category" TEXT,
      "icon" TEXT,
      "status" TEXT NOT NULL DEFAULT 'ACTIVE',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
  },
  { name: 'feature_name_unique_index', sql: `CREATE UNIQUE INDEX IF NOT EXISTS "Feature_name_key" ON "Feature"("name");` },
  {
    name: 'variant_feature_table',
    sql: `CREATE TABLE IF NOT EXISTS "VariantFeature" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "variantId" TEXT NOT NULL,
      "featureId" TEXT NOT NULL,
      "applicability" TEXT NOT NULL DEFAULT 'STANDARD',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
  },
  { name: 'variant_feature_unique_index', sql: `CREATE UNIQUE INDEX IF NOT EXISTS "VariantFeature_variantId_featureId_key" ON "VariantFeature"("variantId", "featureId");` },
  {
    name: 'colour_table',
    sql: `CREATE TABLE IF NOT EXISTS "Colour" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "hexCode" TEXT NOT NULL,
      "type" TEXT NOT NULL DEFAULT 'EXTERIOR',
      "status" TEXT NOT NULL DEFAULT 'ACTIVE',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
  },
  { name: 'colour_name_unique_index', sql: `CREATE UNIQUE INDEX IF NOT EXISTS "Colour_name_key" ON "Colour"("name");` },
  {
    name: 'vehicle_colour_table',
    sql: `CREATE TABLE IF NOT EXISTS "VehicleColour" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "vehicleId" TEXT NOT NULL,
      "colourId" TEXT NOT NULL,
      "imageUrl" TEXT,
      "isDefault" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
  },
  { name: 'vehicle_colour_unique_index', sql: `CREATE UNIQUE INDEX IF NOT EXISTS "VehicleColour_vehicleId_colourId_key" ON "VehicleColour"("vehicleId", "colourId");` },
  // ---- City / Dealer-wise pricing ----
  {
    name: 'variant_price_table',
    sql: `CREATE TABLE IF NOT EXISTS "VariantPrice" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "variantId" TEXT NOT NULL,
      "dealerId" TEXT,
      "city" TEXT,
      "exShowroomPrice" DOUBLE PRECISION NOT NULL,
      "rtoCharges" DOUBLE PRECISION,
      "insuranceCharges" DOUBLE PRECISION,
      "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdBy" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
  },
  { name: 'variant_price_variant_index', sql: `CREATE INDEX IF NOT EXISTS "VariantPrice_variantId_idx" ON "VariantPrice"("variantId");` },
  // ---- Offers & Warranty ----
  {
    name: 'offer_table',
    sql: `CREATE TABLE IF NOT EXISTS "Offer" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "title" TEXT NOT NULL,
      "description" TEXT,
      "discountType" TEXT NOT NULL,
      "discountValue" DOUBLE PRECISION NOT NULL,
      "brandId" TEXT,
      "modelId" TEXT,
      "variantId" TEXT,
      "validFrom" TIMESTAMP(3) NOT NULL,
      "validTo" TIMESTAMP(3) NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'ACTIVE',
      "createdBy" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
  },
  {
    name: 'warranty_table',
    sql: `CREATE TABLE IF NOT EXISTS "Warranty" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "variantId" TEXT NOT NULL,
      "standardYears" INTEGER NOT NULL,
      "standardKm" INTEGER NOT NULL,
      "extendedOptionsJson" TEXT,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
  },
  { name: 'warranty_variant_unique_index', sql: `CREATE UNIQUE INDEX IF NOT EXISTS "Warranty_variantId_key" ON "Warranty"("variantId");` },
  // ---- Draft -> Approve -> Publish workflow ----
  {
    name: 'car_data_submission_table',
    sql: `CREATE TABLE IF NOT EXISTS "CarDataSubmission" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "variantId" TEXT NOT NULL,
      "changeType" TEXT NOT NULL,
      "payloadJson" TEXT NOT NULL,
      "summary" TEXT,
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "submittedBy" TEXT NOT NULL,
      "reviewedBy" TEXT,
      "reviewNotes" TEXT,
      "reviewedAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
  },
  { name: 'car_data_submission_status_index', sql: `CREATE INDEX IF NOT EXISTS "CarDataSubmission_status_idx" ON "CarDataSubmission"("status");` },
  { name: 'message_read_at_column', sql: `ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "readAt" TIMESTAMP(3);` },
  { name: 'delivery_registration_insurance_columns', sql: `ALTER TABLE "Delivery" ADD COLUMN IF NOT EXISTS "registrationNumber" TEXT, ADD COLUMN IF NOT EXISTS "insurancePolicyNumber" TEXT;` },
  { name: 'delivery_photos_json_column', sql: `ALTER TABLE "Delivery" ADD COLUMN IF NOT EXISTS "photosJson" TEXT;` },
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
