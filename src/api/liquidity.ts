/**
 * Liquidity API module
 * PRD §6.3 — Financial Operations: Wallets & Liquidity
 */

import { apiClient } from "./client";
import type { MakerCheckerStatus } from "./types";

// ── Types ────────────────────────────────────────────────────────────────────

export interface WalletBalance {
  asset: string;
  name: string;
  hotWallet: number;
  coldWallet: number;
  totalUsdValue: number;
  lowBalanceThreshold: number;
  isLowBalance: boolean;
  lastUpdated: string;
}

export interface LiquidityAdjustment {
  id: string;
  type: "CREDIT" | "DEBIT";
  asset: string;
  amount: number;
  reason: string;
  initiatedBy: string;
  initiatedAt: string;
  status: MakerCheckerStatus;
  approvedBy?: string;
  approvedAt?: string;
}

export interface LiquidityAdjustmentRequest {
  type: "CREDIT" | "DEBIT";
  asset: string;
  amount: number;
  reason: string;
}

// ── API methods ──────────────────────────────────────────────────────────────

export const liquidityApi = {
  /** Fetch all wallet balances (hot + cold) */
  getWallets: async (): Promise<WalletBalance[]> => {
    const response = await apiClient.get<WalletBalance[]>(
      "/liquidity/wallets"
    );
    return response.data;
  },

  /** Initiate a manual credit/debit adjustment (triggers Maker-Checker) */
  initiateAdjustment: async (
    req: LiquidityAdjustmentRequest
  ): Promise<LiquidityAdjustment> => {
    const response = await apiClient.post<LiquidityAdjustment>(
      "/liquidity/adjust",
      req
    );
    return response.data;
  },

  /** Fetch pending adjustments (for Maker-Checker approval queue) */
  getPendingAdjustments: async (): Promise<LiquidityAdjustment[]> => {
    const response = await apiClient.get<LiquidityAdjustment[]>(
      "/liquidity/adjustments/pending"
    );
    return response.data;
  },

  /** Approve or reject a pending adjustment */
  resolveAdjustment: async (
    id: string,
    action: "APPROVED" | "REJECTED"
  ): Promise<{ success: boolean }> => {
    const response = await apiClient.patch(`/liquidity/adjustments/${id}`, {
      status: action,
    });
    return response.data;
  },

  /** Update low-balance alert threshold for an asset */
  updateThreshold: async (
    asset: string,
    threshold: number
  ): Promise<{ success: boolean }> => {
    const response = await apiClient.patch(`/liquidity/thresholds/${asset}`, {
      threshold,
    });
    return response.data;
  },
};
