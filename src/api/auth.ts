/**
 * Auth API module — aligned with openapi.yaml
 * Uses /user/signin and /user/refresh endpoints
 */

import { apiClient } from "./client";
import type { ApiResponse } from "./types";

// ── Types ────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email?: string;
  phone?: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export type LoginResponse = ApiResponse<AuthTokens>;

// ── API methods ──────────────────────────────────────────────────────────────

export const authApi = {
  /**
   * Admin login — email/phone + password
   * POST /user/signin
   *
   * On success the response body contains accessToken + refreshToken.
   * Store the tokens client-side and pass accessToken as a Bearer header.
   */
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>(
      "/user/signin",
      data,
    );
    return response.data;
  },

  /**
   * Refresh access token
   * POST /user/refresh
   *
   * Exchange a valid refreshToken for a new accessToken + refreshToken pair.
   * The old refresh token is invalidated immediately.
   */
  refreshSession: async (refreshToken: string): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>(
      "/user/refresh",
      { refreshToken },
    );
    return response.data;
  },

  /**
   * Admin logout — clears client-side state.
   * The openapi.yaml doesn't define a dedicated logout endpoint,
   * so we just discard tokens on the client side.
   */
  logout: async () => {
    // No server-side logout endpoint in the spec — client-side cleanup only
    return Promise.resolve();
  },
};
