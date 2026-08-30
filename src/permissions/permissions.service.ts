import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// ============================================================================
// RBAC MIGRATION STRATEGY:
// This is an incremental replacement for the hardcoded @Roles(...) arrays.
// Modules migrate one at a time — a migrated controller uses PermissionsGuard
// + @RequirePermission('some.code') instead of RolesGuard + @Roles(...).
// Everything not yet migrated keeps working exactly as before, untouched.
//
// SUPER_ADMIN always has every permission implicitly (see PermissionsGuard)
// so a misconfigured grant can never lock every admin out of the system.
//
// When migrating a new module: add its permission codes + default grants to
// DEFAULT_PERMISSIONS below, matching that module's *current* @Roles()
// behavior exactly — the seed only fills in what's missing, so this is safe
// to extend repeatedly without disturbing grants an admin has since edited.
// ============================================================================
const STAFF = ['SUPER_ADMIN', 'SALES_ADMIN', 'FINANCE_ADMIN', 'DEALER_MANAGER', 'DEALER_EXECUTIVE', 'FINANCE_EXECUTIVE'];
const SALES_QUOTE = ['SUPER_ADMIN', 'SALES_ADMIN', 'DEALER_MANAGER', 'DEALER_EXECUTIVE'];
const APPROVERS = ['SUPER_ADMIN', 'SALES_ADMIN', 'DEALER_MANAGER'];
const FINANCE = ['SUPER_ADMIN', 'FINANCE_ADMIN', 'FINANCE_EXECUTIVE'];
const FINANCE_ADMINS = ['SUPER_ADMIN', 'FINANCE_ADMIN'];
const ADMIN = ['SUPER_ADMIN', 'SALES_ADMIN', 'FINANCE_ADMIN'];
const REPORT = ['SUPER_ADMIN', 'SALES_ADMIN', 'FINANCE_ADMIN', 'DEALER_MANAGER'];

const DEFAULT_PERMISSIONS: { code: string; label: string; module: string; defaultRoles: string[] }[] = [
  { code: 'leads.view', label: 'View leads', module: 'Leads', defaultRoles: STAFF },
  { code: 'leads.manage', label: 'Edit lead details & status', module: 'Leads', defaultRoles: STAFF },
  { code: 'leads.assign', label: 'Assign dealer/finance executive', module: 'Leads', defaultRoles: APPROVERS },
  { code: 'leads.delete', label: 'Delete a lead', module: 'Leads', defaultRoles: ['SUPER_ADMIN', 'SALES_ADMIN'] },
  { code: 'leads.sla_config.manage', label: 'Change SLA thresholds', module: 'Leads', defaultRoles: ['SUPER_ADMIN', 'SALES_ADMIN', 'FINANCE_ADMIN'] },
  { code: 'portal.access', label: 'Customer portal (own leads only)', module: 'Portal', defaultRoles: ['CUSTOMER'] },

  { code: 'quotations.view', label: 'View quotations', module: 'Quotations', defaultRoles: STAFF },
  { code: 'quotations.manage', label: 'Create / delete quotations', module: 'Quotations', defaultRoles: SALES_QUOTE },

  { code: 'negotiations.view', label: 'View negotiations', module: 'Negotiations', defaultRoles: STAFF },
  { code: 'negotiations.manage', label: 'Record a negotiation', module: 'Negotiations', defaultRoles: SALES_QUOTE },
  { code: 'negotiations.approve', label: 'Approve/reject a discount', module: 'Negotiations', defaultRoles: APPROVERS },

  { code: 'documents.view', label: 'View documents', module: 'Documents', defaultRoles: STAFF },
  { code: 'documents.manage', label: 'Upload / verify / delete documents', module: 'Documents', defaultRoles: STAFF },

  { code: 'finance_cases.view', label: 'View finance cases', module: 'Finance Cases', defaultRoles: STAFF },
  { code: 'finance_cases.manage', label: 'Create case / update stage', module: 'Finance Cases', defaultRoles: STAFF },
  { code: 'finance_cases.manage_details', label: 'Edit loan numbers', module: 'Finance Cases', defaultRoles: FINANCE },
  { code: 'finance_cases.approve', label: 'Approve a submitted finance case', module: 'Finance Cases', defaultRoles: FINANCE_ADMINS },
  { code: 'finance_cases.bank_query.manage', label: 'Raise / resolve bank queries', module: 'Finance Cases', defaultRoles: FINANCE },

  { code: 'finance_applications.view', label: 'View finance applications', module: 'Finance Applications', defaultRoles: STAFF },
  { code: 'finance_applications.manage', label: 'Create / update finance applications', module: 'Finance Applications', defaultRoles: FINANCE },

  { code: 'test_drives.view', label: 'View test drives', module: 'Test Drives', defaultRoles: STAFF },
  { code: 'test_drives.manage', label: 'Schedule / update / delete test drives', module: 'Test Drives', defaultRoles: STAFF },

  { code: 'bookings.view', label: 'View bookings', module: 'Bookings', defaultRoles: STAFF },
  { code: 'bookings.manage', label: 'Create a booking', module: 'Bookings', defaultRoles: STAFF },

  { code: 'deliveries.view', label: 'View deliveries', module: 'Deliveries', defaultRoles: STAFF },
  { code: 'deliveries.manage', label: 'Schedule / update deliveries', module: 'Deliveries', defaultRoles: STAFF },

  { code: 'dealers.view', label: 'View dealers', module: 'Dealers', defaultRoles: STAFF },
  { code: 'dealers.manage', label: 'Create / edit dealers, branches, staff assignment', module: 'Dealers', defaultRoles: STAFF },
  { code: 'dealers.banks_manage', label: 'Set which banks a dealer works with', module: 'Dealers', defaultRoles: FINANCE_ADMINS },

  { code: 'banks.view', label: 'View banks', module: 'Banks', defaultRoles: STAFF },
  { code: 'banks.manage', label: 'Create / edit banks, branches, staff assignment', module: 'Banks', defaultRoles: STAFF },

  { code: 'catalogue.manage', label: 'Manage brands / models / variants', module: 'Catalogue', defaultRoles: ADMIN },

  { code: 'features.manage', label: 'Manage the Feature Library & assign features to variants', module: 'Catalogue', defaultRoles: ADMIN },
  { code: 'colours.manage', label: 'Manage the Colour Library & assign colours to vehicles', module: 'Catalogue', defaultRoles: ADMIN },

  { code: 'pricing.view', label: 'View current & historical pricing', module: 'Pricing', defaultRoles: STAFF },
  { code: 'pricing.manage', label: 'Set city/dealer-wise pricing', module: 'Pricing', defaultRoles: ['SUPER_ADMIN', 'SALES_ADMIN'] },

  { code: 'offers.manage', label: 'Create / edit promotional offers', module: 'Offers', defaultRoles: ['SUPER_ADMIN', 'SALES_ADMIN'] },
  { code: 'warranty.manage', label: 'Edit warranty coverage per variant', module: 'Warranty', defaultRoles: ADMIN },

  { code: 'dynamic_fields.manage', label: 'Manage dynamic field categories & definitions', module: 'Dynamic Fields', defaultRoles: ADMIN },

  { code: 'messages.manage', label: 'Send / view team messages on a lead', module: 'Messages', defaultRoles: STAFF },

  { code: 'notifications.manage', label: 'View / send / mark notifications read', module: 'Notifications', defaultRoles: STAFF },

  { code: 'reports.view', label: 'View sales / finance / dealer reports', module: 'Reports', defaultRoles: REPORT },

  { code: 'site_settings.manage', label: 'Edit website content settings', module: 'Site Settings', defaultRoles: ADMIN },

  { code: 'users.manage', label: 'Create / edit / deactivate staff accounts', module: 'Users', defaultRoles: ['SUPER_ADMIN'] },

  { code: 'vehicles.manage', label: 'Edit vehicle spec data', module: 'Vehicles', defaultRoles: ADMIN },

  { code: 'audit_logs.view', label: 'View the audit log', module: 'Audit Log', defaultRoles: ADMIN },
];

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  // Idempotent — only fills in permissions/grants that don't already exist,
  // so it never overwrites an admin's edit. Safe to call on every read.
  async seedDefaults() {
    for (const def of DEFAULT_PERMISSIONS) {
      await this.prisma.permission.upsert({
        where: { code: def.code },
        update: {},
        create: { code: def.code, label: def.label, module: def.module },
      });
      for (const role of def.defaultRoles) {
        const existing = await this.prisma.rolePermission.findUnique({
          where: { role_permissionCode: { role, permissionCode: def.code } },
        });
        if (!existing) {
          await this.prisma.rolePermission.create({ data: { role, permissionCode: def.code } });
        }
      }
    }
  }

  async listPermissions() {
    await this.seedDefaults();
    return this.prisma.permission.findMany({ orderBy: [{ module: 'asc' }, { code: 'asc' }] });
  }

  // Full role × permission grid for the admin UI — one row per permission,
  // with which roles currently have it.
  async getMatrix() {
    await this.seedDefaults();
    const permissions = await this.prisma.permission.findMany({ orderBy: [{ module: 'asc' }, { code: 'asc' }] });
    const grants = await this.prisma.rolePermission.findMany();
    const grantSet = new Set(grants.map((g) => `${g.role}:${g.permissionCode}`));
    return permissions.map((p) => ({
      code: p.code,
      label: p.label,
      module: p.module,
      roles: ALL_ROLES.reduce((acc, role) => ({ ...acc, [role]: grantSet.has(`${role}:${p.code}`) }), {} as Record<string, boolean>),
    }));
  }

  async grant(role: string, code: string) {
    await this.prisma.rolePermission.upsert({
      where: { role_permissionCode: { role, permissionCode: code } },
      update: {},
      create: { role, permissionCode: code },
    });
    return { success: true };
  }

  async revoke(role: string, code: string) {
    await this.prisma.rolePermission.deleteMany({ where: { role, permissionCode: code } });
    return { success: true };
  }

  // Used by PermissionsGuard on every guarded request — one indexed lookup.
  async hasPermission(role: string, code: string): Promise<boolean> {
    if (role === 'SUPER_ADMIN') return true; // always-on safety net
    const grant = await this.prisma.rolePermission.findUnique({
      where: { role_permissionCode: { role, permissionCode: code } },
    });
    return !!grant;
  }
}

const ALL_ROLES = ['SUPER_ADMIN', 'SALES_ADMIN', 'FINANCE_ADMIN', 'DEALER_MANAGER', 'DEALER_EXECUTIVE', 'FINANCE_EXECUTIVE', 'CUSTOMER'];
