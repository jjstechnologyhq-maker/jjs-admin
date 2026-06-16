/**
 * Axios API client — central instance with interceptors
 * Aligned with openapi.yaml — Bearer token auth, auto-refresh on 401
 *
 * The openapi.yaml uses bearerAuth (Authorization: Bearer <accessToken>),
 * NOT httpOnly cookies. Tokens are stored client-side in the auth store.
 */

import axios from "axios";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.staging.jjs-admin.com";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request interceptor — attach Bearer token from auth store
 * openapi.yaml security: bearerAuth: []
 */
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("auth-storage");
      if (raw) {
        const parsed = JSON.parse(raw);
        const accessToken = parsed?.state?.session?.accessToken;
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
      }
    } catch {
      // Proceed without token
    }
  }
  return config;
});

/**
 * Response interceptor — auto-logout on 401
 * Clears client-side state and redirects to login
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear client-side state and redirect to login
      if (typeof window !== "undefined") {
        // Dynamic import to avoid circular dependency
        import("@/stores/auth-store").then(({ useAuthStore }) => {
          useAuthStore.getState().clearSession();
        });
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);
