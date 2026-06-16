/**
 * Users API module — aligned with openapi.yaml admin endpoints
 * GET  /user/admin/users       — list all users (paginated)
 * GET  /user/admin/users/{id}  — get single user
 * PATCH /user/admin/users/{id} — update user account status
 */

import { apiClient } from "./client";
import type {
  PaginatedResponse,
  PaginationParams,
  ApiResponse,
  AccountStatus,
  KycLevel,
  UserRole,
} from "./types";

// ── Types — matches UserProfile schema in openapi.yaml ───────────────────────

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  phone: string;
  kycLevel: KycLevel;
  role: UserRole;
  status: AccountStatus;
  pin?: string | null;
  jjsTag?: string | null;
  image?: string | null;
  bvn?: string | null;
  youCandidateId?: string | null;
  lastLogin?: string | null;
  createdAt: string;
}

/** Sort options accepted by the API */
export type UserSortOption =
  | "createdAt:asc"
  | "createdAt:desc"
  | "lastName:asc"
  | "lastName:desc";

export type UserListParams = PaginationParams & {
  status?: AccountStatus;
  sort?: UserSortOption;
};

// ── Derived helpers ──────────────────────────────────────────────────────────

/** Build display-friendly full name from the UserProfile fields */
export function getFullName(user: UserProfile): string {
  return [user.firstName, user.middleName, user.lastName]
    .filter(Boolean)
    .join(" ");
}

/** Human-readable KYC level label */
export const KYC_LEVEL_LABELS: Record<KycLevel, string> = {
  "0": "Unverified",
  "1": "Phone Verified",
  "2": "BVN Verified",
  "3": "Fully Verified",
};

// ── API methods ──────────────────────────────────────────────────────────────

export const usersApi = {
  /**
   * Fetch paginated user directory
   * GET /user/admin/users
   */
  getUsers: async (
    params?: UserListParams,
  ): Promise<PaginatedResponse<UserProfile>> => {
    const response = await apiClient.get<PaginatedResponse<UserProfile>>(
      "/user/admin/users",
      { params },
    );
    return response.data;
  },

  /**
   * Fetch single user by ID
   * GET /user/admin/users/{id}
   */
  getUser: async (id: string): Promise<ApiResponse<UserProfile>> => {
    const response = await apiClient.get<ApiResponse<UserProfile>>(
      `/user/admin/users/${id}`,
    );
    return response.data;
  },

  /**
   * Update a user's account status (admin only)
   * PATCH /user/admin/users/{id}
   */
  updateStatus: async (
    id: string,
    status: AccountStatus,
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.patch(`/user/admin/users/${id}`, {
      status,
    });
    return response.data;
  },
};
