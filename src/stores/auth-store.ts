/**
 * Auth store — Zustand session + token storage
 *
 * Aligned with the JJS Admin Service API (openapi-admin.yaml):
 * - `session` mirrors the spec's AdminProfile (single `role`).
 * - `accessToken` is a 15-minute JWT; `refreshToken` is a 7-day rotating token.
 * Tokens are attached as `Authorization: Bearer <accessToken>` by the axios client.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AdminSession, Role } from "@/lib/auth/types";

/** localStorage key used by the persist middleware. */
export const AUTH_STORAGE_KEY = "auth-storage";

interface AuthState {
  session: AdminSession | null;
  /** JWT access token from POST /auth/totp/verify (15 min). */
  accessToken: string | null;
  /** Rotating refresh token from POST /auth/totp/verify (7 days). */
  refreshToken: string | null;
  isAuthenticated: boolean;

  // Actions
  setSession: (
    session: AdminSession,
    accessToken: string,
    refreshToken: string,
  ) => void;
  /** Update tokens only (e.g. after a refresh rotation). */
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearSession: () => void;
  /** True when the current admin's role is one of the allowed roles. */
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
        return allowedRoles.includes(session.role);
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
    },
  ),
);
