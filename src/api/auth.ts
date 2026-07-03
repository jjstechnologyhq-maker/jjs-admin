/**
 * Auth API — JJS Admin Service two-step login + TOTP MFA.
 *
 * Flow: POST /auth/login (password) → POST /auth/totp/verify (6-digit code) → JWT pair.
 * See openapi-admin.yaml › Auth for the full contract.
 */

import { apiClient } from "./client";
import type {
  LoginRequest,
  LoginResult,
  TotpVerifyRequest,
  TokenResponse,
  ForcePasswordChangeResponse,
  TotpSetupResult,
  TotpConfirmRequest,
  ChangePasswordRequest,
} from "./schema";

/** Discriminated result of TOTP verification. */
export type TotpVerifyResult = TokenResponse | ForcePasswordChangeResponse;

export function isForcePasswordChange(
  result: TotpVerifyResult,
): result is ForcePasswordChangeResponse {
  return (result as ForcePasswordChangeResponse).forcePasswordChange === true;
}

export const authApi = {
  /** Step 1 — password auth. Returns a 5-minute session token. */
  login: async (data: LoginRequest): Promise<LoginResult> => {
    const res = await apiClient.post<LoginResult>("/auth/login", data);
    return res.data;
  },

  /** Step 2 — TOTP verification. Returns a JWT pair or a force-password-change flag. */
  verifyTotp: async (data: TotpVerifyRequest): Promise<TotpVerifyResult> => {
    const res = await apiClient.post<TotpVerifyResult>("/auth/totp/verify", data);
    return res.data;
  },

  /** Generate a TOTP secret + otpauth URL for the authenticated admin. */
  setupTotp: async (): Promise<TotpSetupResult> => {
    const res = await apiClient.post<TotpSetupResult>("/auth/totp/setup");
    return res.data;
  },

  /** Confirm TOTP enrollment with a code generated from the setup secret. */
  confirmTotp: async (data: TotpConfirmRequest): Promise<void> => {
    await apiClient.post("/auth/totp/confirm", data);
  },

  /** Change the authenticated admin's password (clears forcePasswordChange). */
  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    await apiClient.post("/auth/change-password", data);
  },

  /** Revoke the current session and blocklist the JWT. */
  logout: async (): Promise<void> => {
    await apiClient.post("/auth/logout");
  },
};
