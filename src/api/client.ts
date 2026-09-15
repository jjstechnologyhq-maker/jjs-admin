/**
 * Axios API client — central instance for the JJS Admin Service API.
 *
 * - Base URL: `NEXT_PUBLIC_API_BASE_URL` (Kong gateway, `.../admin`).
 * - Auth: `Authorization: Bearer <accessToken>` from the Zustand auth store.
 * - Token refresh: single-flight rotation against POST /auth/refresh on 401.
 * - Errors follow `{ code, message, details: { errorCode } }`; read via `getErrorCode`.
 */

import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { useAuthStore } from "@/stores/auth-store";
import type { ErrorResponse, TokenResponse } from "./schema";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://api.jjscurrency.exchange/admin";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// ── Error helpers ────────────────────────────────────────────────────────────

/** Extract the machine-readable `details.errorCode` from an API error, if any. */
export function getErrorCode(error: unknown): string | undefined {
  // Prefer axios.isAxiosError because the runtime value check is more reliable
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ErrorResponse | undefined;
    // Primary source: explicit machine-readable code in details
    const explicit = data?.details?.errorCode;
    if (explicit) return explicit;

    // Heuristic mappings for servers that return `details: null` but a useful message
    const msg = typeof data?.message === "string" ? data!.message : undefined;
    if (msg) {
      const normal = msg.toLowerCase();
      if (/mfa.*enroll/i.test(msg) || /already enrolled/i.test(msg)) return "MFA_ALREADY_ENROLLED";
      if (/mfa.*not enrolled/i.test(msg) || /not set up/i.test(msg)) return "MFA_NOT_ENROLLED";
      if (/invalid email|invalid password|invalid credentials/i.test(normal)) return "INVALID_CREDENTIALS";
      if (/too many failed attempts|too many attempts/i.test(normal)) return "TOO_MANY_ATTEMPTS";
      if (/suspend/i.test(normal)) return "ACCOUNT_SUSPENDED";
      if (/session expired/i.test(normal)) return "SESSION_EXPIRED";
      if (/refresh token/i.test(normal)) return "REFRESH_TOKEN_INVALID";
      if (/password.*same/i.test(normal)) return "PASSWORD_SAME_AS_CURRENT";
    }

    // Fallback: if the API returned a numeric code, expose it as a string so callers
    // can still branch on it if they expect e.g. "409" etc.
    if (data?.code !== undefined && data?.code !== null) return String(data.code);
  }
  return undefined;
}

/** Extract a human-readable message from an API error, with a fallback. */
export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong",
): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ErrorResponse | undefined;
    return data?.message || error.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

/** Error codes that mean the session is dead — a refresh cannot recover it. */
const TERMINAL_AUTH_CODES = new Set([
  "SESSION_EXPIRED",
  "TOKEN_REVOKED",
  "REFRESH_TOKEN_INVALID",
  "REFRESH_TOKEN_EXPIRED",
  "REFRESH_TOKEN_REUSED",
]);

function redirectToLogin() {
  useAuthStore.getState().clearSession();
  if (
    typeof window !== "undefined" &&
    !window.location.pathname.startsWith("/login")
  ) {
    window.location.href = "/login";
  }
}

// ── Request interceptor: attach Bearer token ─────────────────────────────────

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Token refresh (single-flight) ────────────────────────────────────────────

let refreshPromise: Promise<string> | null = null;

/**
 * Rotate the refresh token for a fresh access token. Concurrent callers share
 * one in-flight request. Uses a bare axios call (not `apiClient`) to avoid the
 * interceptors recursing. Throws if refresh is impossible/rejected.
 */
export function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  const { refreshToken } = useAuthStore.getState();
  if (!refreshToken) return Promise.reject(new Error("No refresh token"));

  refreshPromise = axios
    .post<TokenResponse>(`${API_BASE_URL}/auth/refresh`, { refreshToken })
    .then((res) => {
      const { accessToken, refreshToken: newRefresh } = res.data;
      useAuthStore.getState().setTokens(accessToken, newRefresh);
      return accessToken;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

// ── Response interceptor: reactive refresh + auth handling ───────────────────

interface RetriableConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const original = error.config as RetriableConfig | undefined;

    if (status !== 401 || !original) {
      return Promise.reject(error);
    }

    const errorCode = getErrorCode(error);

    // Session is unrecoverable — go straight to login.
    if (errorCode && TERMINAL_AUTH_CODES.has(errorCode)) {
      redirectToLogin();
      return Promise.reject(error);
    }

    // Never try to refresh the refresh call itself, and only retry once.
    const isRefreshCall = original.url?.includes("/auth/refresh");
    // If there's no saved refresh token (e.g. we're performing the initial /auth/login
    // as part of sign-in), don't attempt a token rotation — surface the original
    // API error so the UI can show the server-provided message instead of a
    // refresh failure like "No refresh token".
    const { refreshToken: _currentRefresh } = useAuthStore.getState();
    const canAttemptRefresh = Boolean(_currentRefresh);
    if (isRefreshCall || original._retry) {
      redirectToLogin();
      return Promise.reject(error);
    }

    // Access token likely expired — attempt a single refresh + replay.
    // If we cannot attempt refresh (no stored refresh token), surface original error
    if (!canAttemptRefresh) {
      return Promise.reject(error);
    }

    try {
      original._retry = true;
      const newToken = await refreshAccessToken();
      original.headers = {
        ...original.headers,
        Authorization: `Bearer ${newToken}`,
      };
      return apiClient(original);
    } catch (refreshError) {
      redirectToLogin();
      return Promise.reject(refreshError);
    }
  },
);
