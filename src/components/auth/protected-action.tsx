/**
 * ProtectedAction — RBAC wrapper for sensitive UI elements
 * PRD §4.3 — Build this on day one. Every sensitive button or form wraps it.
 *
 * Usage:
 *   <ProtectedAction roles={['SUPER_ADMIN', 'FINANCE_MANAGER']}>
 *     <ApproveWithdrawalButton />
 *   </ProtectedAction>
 */

"use client";

import type { Role } from "@/lib/auth/types";
import { useAuthStore } from "@/stores/auth-store";

interface ProtectedActionProps {
  /** Roles permitted to see/interact with the wrapped content */
  roles: Role[];
  /** Content to render when the user has the required role */
  children: React.ReactNode;
  /** Optional fallback to render when access is denied (defaults to nothing) */
  fallback?: React.ReactNode;
}

export function ProtectedAction({
  roles,
  children,
  fallback = null,
}: ProtectedActionProps) {
  const hasRole = useAuthStore((state) => state.hasRole);

  if (!hasRole(roles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
