/**
 * Auth API — JJS Admin Service multi-step login + TOTP MFA.
 *
 * Flow (first-time seeded admin):
 *   POST /auth/login          → sessionToken
 *   POST /auth/totp/setup     → otpauthUrl, secret, debugTotpToken
 *   POST /auth/totp/confirm   → success, debugTotpToken (fresh)
 *   POST /auth/totp/verify    → JWT pair OR { forcePasswordChange: true }
 *   POST /auth/force-password-change → JWT pair (login complete)
 *
 * Subsequent logins (MFA enrolled, password already changed):
 *   POST /auth/login          → sessionToken
 *   POST /auth/totp/verify    → JWT pair
 *
 * IMPORTANT: `sessionToken` is carried in the **request body**, never as a
 * Bearer header. It is a 5-minute opaque proof that the password was correct.
 *
 * See openapi-admin.yaml › Auth for the full contract.
 */

import { apiClient } from "./client";
import type {
  LoginRequest,
  LoginResult,
  TotpVerifyRequest,
  TokenResponse,
  ForcePasswordChangeResponse,
  ChangePasswordRequest,
} from "./schema";

// ── Extended types (augment generated spec with runtime fields) ─────────

/**
 * TOTP setup response. Extends the spec's `TotpSetupResult` with the
 * dev-only `debugTotpToken` field that's present in non-production envs.
 */
export interface TotpSetupResponse {
  otpauthUrl: string;
  secret: string;
  /** Only present when NODE_ENV !== 'production'. */
  debugTotpToken?: string;
}

/**
 * Body for POST /auth/totp/confirm.
 * The generated spec only has `totpToken`, but the real endpoint also
 * requires `sessionToken` during the login flow.
 */
export interface TotpConfirmBody {
  sessionToken: string;
  totpToken: string;
}

/** Result from POST /auth/totp/confirm. */
export interface TotpConfirmResult {
  success: boolean;
  /** Fresh 6-digit TOTP code. Only present in non-production environments. */
  debugTotpToken?: string;
}

// ── Discriminated union helpers ─────────────────────────────────────────

/** Discriminated result of TOTP verification. */
export type TotpVerifyResult = TokenResponse | ForcePasswordChangeResponse;

export function isForcePasswordChange(
  result: TotpVerifyResult,
): result is ForcePasswordChangeResponse {
  return (result as ForcePasswordChangeResponse).forcePasswordChange === true;
}

// ── API methods ─────────────────────────────────────────────────────────

export const authApi = {
  /** Step 1 — password auth. Returns a 5-minute session token. */
  login: async (data: LoginRequest): Promise<LoginResult> => {
    const res = await apiClient.post<LoginResult>("/auth/login", data);
    return res.data;
  },

  /**
   * Step 2 (first-time only) — Generate a TOTP secret + otpauth URL.
   * Requires the sessionToken in the body (NOT as a Bearer header).
   */
  setupTotp: async (sessionToken: string): Promise<TotpSetupResponse> => {
    const res = await apiClient.post<TotpSetupResponse>("/auth/totp/setup", {
      sessionToken,
    });
    return res.data;
  },

  /**
   * Step 3 (first-time only) — Confirm TOTP enrollment with a code from the
   * authenticator app (or debugTotpToken in dev).
   * Returns `{ success: true, debugTotpToken?: "..." }`.
   */
  confirmTotp: async (data: TotpConfirmBody): Promise<TotpConfirmResult> => {
    const res = await apiClient.post<TotpConfirmResult>(
      "/auth/totp/confirm",
      data,
    );
    return res.data;
  },

  /**
   * Step 4 — TOTP verification. This is where every login converges.
   * Returns a JWT pair (login complete) or { forcePasswordChange: true }.
   */
  verifyTotp: async (data: TotpVerifyRequest): Promise<TotpVerifyResult> => {
    const res = await apiClient.post<TotpVerifyResult>(
      "/auth/totp/verify",
      data,
    );
    return res.data;
  },

  /**
   * Step 5 (first-time only) — Force password change.
   * Called when Step 4 returns { forcePasswordChange: true }.
   * Returns a real JWT pair (login complete).
   */
  forcePasswordChange: async (
    sessionToken: string,
    newPassword: string,
  ): Promise<TokenResponse> => {
    const res = await apiClient.post<TokenResponse>(
      "/auth/force-password-change",
      { sessionToken, newPassword },
    );
    return res.data;
  },

  /** Change password for an already-authenticated admin (Bearer auth). */
  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    await apiClient.post("/auth/change-password", data);
  },

  /** Revoke the current session and blocklist the JWT. */
  logout: async (): Promise<void> => {
    await apiClient.post("/auth/logout");
  },
};
