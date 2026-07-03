/**
 * Users API — read-only lookup, status management, and internal notes.
 * See openapi-admin.yaml › Users.
 */

import { apiClient } from "./client";
import { cleanParams, type Paginated } from "./types";
import type {
  UserSummary,
  UserDetail,
  UserNoteView,
  PaginatedUsers,
  PaginatedNotes,
  UpdateUserStatusRequest,
  CreateNoteRequest,
  UserAccountStatus,
  KycStatus,
} from "./schema";

export interface UserListParams {
  q?: string;
  name?: string;
  email?: string;
  phone?: string;
  walletAddress?: string;
  kyc_status?: KycStatus;
  account_status?: UserAccountStatus;
  cursor?: string;
  limit?: number;
}

export const usersApi = {
  /** GET /users — cursor-paginated, filterable user directory. */
  list: async (params: UserListParams = {}): Promise<Paginated<UserSummary>> => {
    const res = await apiClient.get<PaginatedUsers>("/users", {
      params: cleanParams(params),
    });
    return res.data as Paginated<UserSummary>;
  },

  /** GET /users/{userId} — full profile with balances, devices, notes. */
  get: async (userId: string): Promise<UserDetail> => {
    const res = await apiClient.get<UserDetail>(`/users/${userId}`);
    return res.data;
  },

  /** PATCH /users/{userId}/status — ACTIVE | FROZEN | SHADOW_BANNED (+ reason). */
  updateStatus: async (
    userId: string,
    body: UpdateUserStatusRequest,
  ): Promise<UserSummary> => {
    const res = await apiClient.patch<UserSummary>(`/users/${userId}/status`, body);
    return res.data;
  },

  /** GET /users/{userId}/notes — cursor-paginated admin notes, newest first. */
  listNotes: async (
    userId: string,
    params: { cursor?: string; limit?: number } = {},
  ): Promise<Paginated<UserNoteView>> => {
    const res = await apiClient.get<PaginatedNotes>(`/users/${userId}/notes`, {
      params: cleanParams(params),
    });
    return res.data as Paginated<UserNoteView>;
  },

  /** POST /users/{userId}/notes — add an internal admin note (max 2000 chars). */
  createNote: async (
    userId: string,
    body: CreateNoteRequest,
  ): Promise<UserNoteView> => {
    const res = await apiClient.post<UserNoteView>(`/users/${userId}/notes`, body);
    return res.data;
  },

  /** DELETE /users/{userId}/notes/{noteId} — soft-delete a note. */
  deleteNote: async (userId: string, noteId: string): Promise<void> => {
    await apiClient.delete(`/users/${userId}/notes/${noteId}`);
  },
};
