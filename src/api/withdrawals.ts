/**
 * Withdrawals API module
 * PRD §6.3 — Withdrawal Approval Engine
 */

import { apiClient } from "./client";
import type {
  PaginatedResponse,
  PaginationParams,
  WithdrawalStatus,
  RiskLevel,
} from "./types";

// ── Types ────────────────────────────────────────────────────────────────────

export interface Withdrawal {
  id: string;
  userId: string;
  userName: string;
  email: string;
  asset: string;
  amount: number;
  usdValue: number;
  destinationAddress: string;
  network: string;
  status: WithdrawalStatus;
  riskLevel: RiskLevel;
  riskFlags: string[];
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
  makerCheckerRequired: boolean;
  makerCheckerStatus?: string;
}

export type WithdrawalQueueParams = PaginationParams & {
  status?: WithdrawalStatus;
  riskLevel?: RiskLevel;
  asset?: string;
};

// ── API methods ──────────────────────────────────────────────────────────────

export const withdrawalsApi = {
  /** Fetch withdrawal queue with filters */
  getQueue: async (
    params?: WithdrawalQueueParams
  ): Promise<PaginatedResponse<Withdrawal>> => {
    const response = await apiClient.get<PaginatedResponse<Withdrawal>>(
      "/withdrawals/queue",
      { params }
    );
    return response.data;
  },

  /** Get single withdrawal details */
  getWithdrawal: async (id: string): Promise<Withdrawal> => {
    const response = await apiClient.get<Withdrawal>(`/withdrawals/${id}`);
    return response.data;
  },

  /** Approve a single withdrawal */
  approve: async (id: string): Promise<{ success: boolean }> => {
    const response = await apiClient.patch(`/withdrawals/${id}/approve`);
    return response.data;
  },

  /** Reject a single withdrawal */
  reject: async (
    id: string,
    reason: string
  ): Promise<{ success: boolean }> => {
    const response = await apiClient.patch(`/withdrawals/${id}/reject`, {
      reason,
    });
    return response.data;
  },

  /** Bulk approve multiple withdrawals */
  bulkApprove: async (ids: string[]): Promise<{ success: boolean; processed: number }> => {
    const response = await apiClient.post("/withdrawals/bulk-approve", { ids });
    return response.data;
  },

  /** Bulk reject multiple withdrawals */
  bulkReject: async (
    ids: string[],
    reason: string
  ): Promise<{ success: boolean; processed: number }> => {
    const response = await apiClient.post("/withdrawals/bulk-reject", {
      ids,
      reason,
    });
    return response.data;
  },
};
