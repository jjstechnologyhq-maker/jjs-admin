/**
 * Role-Based Access Control types
 *
 * Aligned with the JJS Admin Service API (openapi-admin.yaml): every admin holds
 * exactly **one** role (AdminRole), not a permissions array. The session profile
 * mirrors the spec's `AdminProfile` schema.
 */

import type { AdminProfile, AdminRole } from "@/api/schema";

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  COMPLIANCE_OFFICER: "COMPLIANCE_OFFICER",
  FINANCE_MANAGER: "FINANCE_MANAGER",
  CUSTOMER_SUPPORT: "CUSTOMER_SUPPORT",
} as const;

/** Single admin role, sourced from the generated spec type. */
export type Role = AdminRole;

/** The authenticated admin — identical to the spec's AdminProfile. */
export type AdminSession = AdminProfile;
