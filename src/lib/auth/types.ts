/**
 * Role-Based Access Control types
 * Mirrors PRD §2 — Target Audience & RBAC
 *
 * Uses a permissions array — a single admin can hold multiple roles.
 */

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  COMPLIANCE_OFFICER: "COMPLIANCE_OFFICER",
  FINANCE_MANAGER: "FINANCE_MANAGER",
  CUSTOMER_SUPPORT: "CUSTOMER_SUPPORT",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export interface AdminSession {
  id: string;
  email: string;
  permissions: Role[];
  exp: number;
}

export interface JWTPayload {
  sub: string;
  email: string;
  permissions: Role[];
  exp: number;
  iat: number;
}
