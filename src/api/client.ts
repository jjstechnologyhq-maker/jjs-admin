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
  if (error instanceof AxiosError) {
    const data = error.response?.data as ErrorResponse | undefined;
    return data?.details?.errorCode ?? undefined;
  }
  return undefined;
}

/** Extract a human-readable message from an API error, with a fallback. */
export function getErrorMessage(error: unknown, fallback = "Something went wrong"): string {
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
  if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
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
    if (isRefreshCall || original._retry) {
      redirectToLogin();
      return Promise.reject(error);
    }

    // Access token likely expired — attempt a single refresh + replay.
    try {
      original._retry = true;
      const newToken = await refreshAccessToken();
      original.headers = { ...original.headers, Authorization: `Bearer ${newToken}` };
      return apiClient(original);
    } catch (refreshError) {
      redirectToLogin();
      return Promise.reject(refreshError);
    }
  },
);
