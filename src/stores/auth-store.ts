/**
 * Auth store — Zustand RBAC context + token storage
 * PRD §4.1 — Permissions stored in Zustand, drives sidebar nav and ProtectedAction wrapper
 *
 * Aligned with openapi.yaml: stores accessToken and refreshToken from /user/signin.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AdminSession, Role } from "@/lib/auth/types";

interface AuthState {
  session: AdminSession | null;
  /** JWT access token from /user/signin */
  accessToken: string | null;
  /** Refresh token from /user/signin */
  refreshToken: string | null;
  isAuthenticated: boolean;

  // Actions
  setSession: (session: AdminSession, accessToken: string, refreshToken: string) => void;
  /** Update tokens only (e.g. after a refresh) */
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearSession: () => void;
  /** Check if the current admin holds at least one of the allowed roles */
  hasRole: (allowedRoles: Role[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setSession: (session, accessToken, refreshToken) =>
        set({ session, accessToken, refreshToken, isAuthenticated: true }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      clearSession: () =>
        set({
          session: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),

      hasRole: (allowedRoles) => {
        const { session } = get();
        if (!session) return false;
        // Check if at least one of the admin's permissions matches the allowed roles
        return session.permissions.some((perm) => allowedRoles.includes(perm));
      },
    }),
    {
      name: "auth-storage",
    }
  )
);
