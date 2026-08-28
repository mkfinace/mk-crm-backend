// Shared role groups for @Roles() — keeps controllers consistent instead of
// re-typing the same role lists everywhere.
export const STAFF_ROLES = [
  'SUPER_ADMIN',
  'SALES_ADMIN',
  'FINANCE_ADMIN',
  'DEALER_MANAGER',
  'DEALER_EXECUTIVE',
  'FINANCE_EXECUTIVE',
];

export const ADMIN_ROLES = ['SUPER_ADMIN', 'SALES_ADMIN', 'FINANCE_ADMIN'];

export const SALES_ROLES = ['SUPER_ADMIN', 'SALES_ADMIN', 'DEALER_MANAGER', 'DEALER_EXECUTIVE'];

export const FINANCE_ROLES = ['SUPER_ADMIN', 'FINANCE_ADMIN', 'FINANCE_EXECUTIVE'];
