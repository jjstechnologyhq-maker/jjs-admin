/**
 * Admins API — account management (mostly SUPER_ADMIN).
 * See openapi-admin.yaml › Admins.
 */

import { apiClient } from "./client";
import { cleanParams, type Paginated } from "./types";
import type {
  AdminProfile,
  AdminDetail,
  ListAdminsResult,
  InviteAdminRequest,
  InviteAdminResult,
  UpdateAdminRequest,
  MfaResetRequest,
  AdminStatus,
} from "./schema";

export interface AdminListParams {
  status?: AdminStatus;
  cursor?: string;
  limit?: number;
}

export const adminApi = {
  /** GET /admins — cursor-paginated admin list (non-standard envelope, normalised here). */
  list: async (params: AdminListParams = {}): Promise<Paginated<AdminProfile>> => {
    const res = await apiClient.get<ListAdminsResult>("/admins", {
      params: cleanParams(params),
    });
    const { data, nextCursor, hasNextPage } = res.data;
    return { data, meta: { nextCursor, hasMore: hasNextPage } };
  },

  /** GET /admins/me — the current admin's profile. */
  me: async (): Promise<AdminProfile> => {
    const res = await apiClient.get<AdminProfile>("/admins/me");
    return res.data;
  },

  /** GET /admins/{adminId} — full detail incl. recent activity + action summary. */
  get: async (adminId: string): Promise<AdminDetail> => {
    const res = await apiClient.get<AdminDetail>(`/admins/${adminId}`);
    return res.data;
  },

  /** POST /admins — invite a new admin (PENDING + invite email). */
  invite: async (body: InviteAdminRequest): Promise<InviteAdminResult> => {
    const res = await apiClient.post<InviteAdminResult>("/admins", body);
    return res.data;
  },

  /** PATCH /admins/{adminId} — update status/role/flags. */
  update: async (adminId: string, body: UpdateAdminRequest): Promise<AdminProfile> => {
    const res = await apiClient.patch<AdminProfile>(`/admins/${adminId}`, body);
    return res.data;
  },

  /** POST /admins/{adminId}/mfa/reset — force TOTP re-enrollment. */
  resetMfa: async (adminId: string, body: MfaResetRequest): Promise<void> => {
    await apiClient.post(`/admins/${adminId}/mfa/reset`, body);
  },

  /** POST /admins/{adminId}/invite/resend — resend invite to a PENDING admin (204; 409 INVITE_NOT_PENDING). */
  resendInvite: async (adminId: string): Promise<void> => {
    await apiClient.post(`/admins/${adminId}/invite/resend`);
  },

  /**
   * Find a PENDING admin by email. The 409 INVITE_ALREADY_PENDING response carries no
   * admin ID, so walk the PENDING list. Emails are stored lowercase — compare case-insensitively.
   */
  findPendingByEmail: async (email: string): Promise<AdminProfile | null> => {
    const target = email.trim().toLowerCase();
    let cursor: string | undefined;
    for (let page = 0; page < 20; page++) {
      const res = await adminApi.list({ status: "PENDING", cursor, limit: 100 });
      const hit = res.data.find((a) => a.email.toLowerCase() === target);
      if (hit) return hit;
      if (!res.meta.hasMore || !res.meta.nextCursor) return null;
      cursor = res.meta.nextCursor;
    }
    return null;
  },
};
