/**
 * Admin API module — aligned with openapi.yaml
 * GET /user/admin/stats — platform-wide statistics
 *
 * Admin management endpoints (invite, suspend, etc.) are NOT in the
 * current openapi.yaml, so those methods are kept as provisional stubs
 * that will be updated when the spec evolves.
 */

import { apiClient } from "./client";
import type {
  PaginatedResponse,
  PaginationParams,
  ApiResponse,
  AdminStats,
  InvitationStatus,
} from "./types";
import type { Role } from "@/lib/auth/types";

// ── Types ────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  permissions: Role[];
  status: InvitationStatus;
  mfaEnabled: boolean;
  createdAt: string;
  lastActive: string;
  loginCount: number;
}

export interface AdminDetail extends AdminUser {
  loginHistory: {
    timestamp: string;
    ip: string;
    userAgent: string;
    success: boolean;
  }[];
  actionSummary: {
    totalActions: number;
    lastAction: string;
    lastActionTimestamp: string;
  };
}

export interface AuditLog {
  id: string;
  timestamp: string;
  adminId: string;
  adminEmail: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  ipAddress: string;
  details?: Record<string, any>;
}

export interface AdminInviteRequest {
  email: string;
  permissions: Role[];
  fullName: string;
}

export type AdminListParams = PaginationParams & {
  status?: InvitationStatus;
  role?: Role;
};

// ── API methods ──────────────────────────────────────────────────────────────

export const adminApi = {
  /**
   * Get platform-wide statistics (admin only)
   * GET /user/admin/stats
   * This IS in the openapi.yaml spec.
   */
  getStats: async (): Promise<ApiResponse<AdminStats>> => {
    const response = await apiClient.get<ApiResponse<AdminStats>>(
      "/user/admin/stats",
    );
    return response.data;
  },

  // ── Below are provisional endpoints NOT yet in openapi.yaml ──────────────
  // They use best-guess paths and will be updated as the spec evolves.

  /** Fetch paginated system audit logs */
  getAuditLogs: async (
    params?: PaginationParams,
  ): Promise<PaginatedResponse<AuditLog>> => {
    const response = await apiClient.get<PaginatedResponse<AuditLog>>(
      "/audit-logs",
      { params },
    );
    return response.data;
  },

  /** Fetch all admin users with filters */
  getAdmins: async (
    params?: AdminListParams,
  ): Promise<PaginatedResponse<AdminUser>> => {
    const response = await apiClient.get<PaginatedResponse<AdminUser>>(
      "/admins",
      { params },
    );
    return response.data;
  },

  /** Get detailed admin profile */
  getAdmin: async (id: string): Promise<AdminDetail> => {
    const response = await apiClient.get<AdminDetail>(`/admins/${id}`);
    return response.data;
  },

  /** Invite a new admin by email and assign role */
  invite: async (
    data: AdminInviteRequest,
  ): Promise<{ success: boolean; adminId: string }> => {
    const response = await apiClient.post("/admins/invite", data);
    return response.data;
  },

  /** Update an admin's permissions */
  updatePermissions: async (
    id: string,
    permissions: Role[],
  ): Promise<{ success: boolean }> => {
    const response = await apiClient.patch(`/admins/${id}/permissions`, {
      permissions,
    });
    return response.data;
  },

  /** Suspend an admin (revokes sessions instantly) */
  suspend: async (id: string): Promise<{ success: boolean }> => {
    const response = await apiClient.post(`/admins/${id}/suspend`);
    return response.data;
  },

  /** Deactivate/delete an admin (permanent) */
  deactivate: async (id: string): Promise<{ success: boolean }> => {
    const response = await apiClient.post(`/admins/${id}/deactivate`);
    return response.data;
  },

  /** Force MFA reset for an admin */
  resetMfa: async (id: string): Promise<{ success: boolean }> => {
    const response = await apiClient.post(`/admins/${id}/reset-mfa`);
    return response.data;
  },

  /** Force password change on next login */
  forcePasswordChange: async (id: string): Promise<{ success: boolean }> => {
    const response = await apiClient.post(
      `/admins/${id}/force-password-change`,
    );
    return response.data;
  },
};
