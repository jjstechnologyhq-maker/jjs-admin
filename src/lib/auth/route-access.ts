/**
 * Route-level RBAC access map
 * PRD §2 — maps route prefixes to allowed roles
 * PRD §4.2 — no page renders before auth is confirmed
 */

import type { Role } from "./types";
import { ROLES } from "./types";

const ALL_ROLES: Role[] = Object.values(ROLES);

/**
 * Route access map — keyed by path prefix.
 * Order matters: more specific prefixes should appear first.
 */
export const ROUTE_ACCESS_MAP: { prefix: string; roles: Role[] }[] = [
  // Super Admin only
  { prefix: "/admin-management", roles: [ROLES.SUPER_ADMIN] },
  { prefix: "/system-config", roles: [ROLES.SUPER_ADMIN] },

  // Compliance
  { prefix: "/kyc", roles: [ROLES.SUPER_ADMIN, ROLES.COMPLIANCE_OFFICER] },
  {
    prefix: "/users",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.COMPLIANCE_OFFICER,
      ROLES.CUSTOMER_SUPPORT,
    ],
  },

  // Finance
  {
    prefix: "/withdrawals",
    roles: [ROLES.SUPER_ADMIN, ROLES.FINANCE_MANAGER],
  },
  { prefix: "/liquidity", roles: [ROLES.SUPER_ADMIN, ROLES.FINANCE_MANAGER] },
  { prefix: "/pricing", roles: [ROLES.SUPER_ADMIN, ROLES.FINANCE_MANAGER] },
  { prefix: "/fees", roles: [ROLES.SUPER_ADMIN, ROLES.FINANCE_MANAGER] },

  // Transaction monitoring — Compliance + Finance
  {
    prefix: "/transactions",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.COMPLIANCE_OFFICER,
      ROLES.FINANCE_MANAGER,
    ],
  },

  // VAS
  {
    prefix: "/vas",
    roles: [ROLES.SUPER_ADMIN, ROLES.FINANCE_MANAGER],
  },

  // Support — view-only for CS, full for admin
  {
    prefix: "/support",
    roles: [ROLES.SUPER_ADMIN, ROLES.CUSTOMER_SUPPORT],
  },

  // Analytics — read access for all
  { prefix: "/analytics", roles: ALL_ROLES },

  // Audit logs — compliance + super admin
  {
    prefix: "/audit",
    roles: [ROLES.SUPER_ADMIN, ROLES.COMPLIANCE_OFFICER],
  },

  // Dashboard — accessible to all authenticated roles
  { prefix: "/", roles: ALL_ROLES },
];

/**
 * Public routes that don't require authentication
 */
export const PUBLIC_ROUTES = ["/login", "/unauthorised", "/forgot-password"];

/**
 * Check if any of the admin's permissions grant access to a given pathname
 */
export function hasAccess(permissions: Role[], pathname: string): boolean {
  // Find the first matching route prefix
  const match = ROUTE_ACCESS_MAP.find((route) =>
    pathname.startsWith(route.prefix)
  );

  // If no match found, deny access by default
  if (!match) return false;

  // Check if at least one permission matches
  return permissions.some((perm) => match.roles.includes(perm));
}

/**
 * Check if a route is public (no auth required)
 */
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}
