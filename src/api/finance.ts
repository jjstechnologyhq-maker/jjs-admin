/**
 * Finance API — wallet balances, manual adjustments (Maker-Checker), withdrawals.
 * See openapi-admin.yaml › Finance.
 *
 * Note: the spec exposes no "list adjustments" endpoint — adjustments are created
 * and then approved/rejected by id (id comes from the create response).
 */

import { apiClient } from "./client";
import { cleanParams, type Paginated } from "./types";
import type {
  WalletBalanceResponse,
  CreateWalletRequest,
  WalletThresholdRequest,
  CreateAdjustmentRequest,
  ImmediateAdjustmentResponse,
  PendingAdjustmentResponse,
  AdjustmentResponse,
  WithdrawalItem,
  PaginatedWithdrawals,
  BulkApproveWithdrawalRequest,
  BulkRejectWithdrawalRequest,
  BulkApproveResult,
  BulkRejectResult,
  WithdrawalStatus,
} from "./schema";

export type CreateAdjustmentResult =
  | ImmediateAdjustmentResponse
  | PendingAdjustmentResponse;

/** True when the adjustment was above threshold and needs a second approver. */
export function isPendingAdjustment(
  r: CreateAdjustmentResult,
): r is PendingAdjustmentResponse {
  return "approvalId" in r;
}

export interface WithdrawalListParams {
  status?: WithdrawalStatus;
  asset?: string;
  isHighRisk?: boolean;
  cursor?: string;
  limit?: number;
}

export const financeApi = {
  // ── Wallets ────────────────────────────────────────────────────────────────
  listWallets: async (): Promise<WalletBalanceResponse[]> => {
    const res = await apiClient.get<WalletBalanceResponse[]>("/finance/wallets");
    return res.data;
  },
  createWallet: async (body: CreateWalletRequest): Promise<WalletBalanceResponse> => {
    const res = await apiClient.post<WalletBalanceResponse>("/finance/wallets", body);
    return res.data;
  },
  setThreshold: async (
    asset: string,
    body: WalletThresholdRequest,
  ): Promise<WalletBalanceResponse> => {
    const res = await apiClient.patch<WalletBalanceResponse>(
      `/finance/wallets/${encodeURIComponent(asset)}/threshold`,
      body,
    );
    return res.data;
  },

  // ── Adjustments (Maker-Checker) ──────────────────────────────────────────────
  createAdjustment: async (
    body: CreateAdjustmentRequest,
  ): Promise<CreateAdjustmentResult> => {
    const res = await apiClient.post<CreateAdjustmentResult>("/finance/adjustments", body);
    return res.data;
  },
  approveAdjustment: async (id: string): Promise<AdjustmentResponse> => {
    const res = await apiClient.post<AdjustmentResponse>(`/finance/adjustments/${id}/approve`);
    return res.data;
  },
  rejectAdjustment: async (id: string): Promise<AdjustmentResponse> => {
    const res = await apiClient.post<AdjustmentResponse>(`/finance/adjustments/${id}/reject`);
    return res.data;
  },

  // ── Withdrawals ──────────────────────────────────────────────────────────────
  listWithdrawals: async (
    params: WithdrawalListParams = {},
  ): Promise<Paginated<WithdrawalItem>> => {
    const res = await apiClient.get<PaginatedWithdrawals>("/finance/withdrawals", {
      params: cleanParams(params),
    });
    return res.data as Paginated<WithdrawalItem>;
  },
  bulkApprove: async (
    body: BulkApproveWithdrawalRequest,
  ): Promise<BulkApproveResult> => {
    const res = await apiClient.post<BulkApproveResult>("/finance/withdrawals/approve", body);
    return res.data;
  },
  bulkReject: async (
    body: BulkRejectWithdrawalRequest,
  ): Promise<BulkRejectResult> => {
    const res = await apiClient.post<BulkRejectResult>("/finance/withdrawals/reject", body);
    return res.data;
  },
};
