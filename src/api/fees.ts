/**
 * Pricing & Fees API module
 * PRD §6.4 — Price List & Fee Configuration
 */

import { apiClient } from "./client";

// ── Types ────────────────────────────────────────────────────────────────────

export interface AssetRate {
  asset: string;
  name: string;
  marketRate: number;
  platformRate: number;
  spreadPercent: number;
  enabled: boolean;
  lastUpdated: string;
}

export interface SpreadUpdate {
  asset: string;
  spreadPercent: number;
}

export interface FeeConfig {
  id: string;
  name: string;
  type: "WITHDRAWAL" | "SWAP" | "VAS";
  feeType: "FLAT" | "PERCENTAGE";
  value: number;
  minAmount?: number;
  maxAmount?: number;
  tiers: FeeTier[];
  updatedAt: string;
  updatedBy: string;
}

export interface FeeTier {
  minVolume: number;
  maxVolume: number | null;
  feeType: "FLAT" | "PERCENTAGE";
  value: number;
}

export interface AssetToggle {
  asset: string;
  tradingEnabled: boolean;
  depositsEnabled: boolean;
  withdrawalsEnabled: boolean;
}

// ── API methods ──────────────────────────────────────────────────────────────

export const feesApi = {
  /** Fetch current rates for all assets (market vs. platform) */
  getRates: async (): Promise<AssetRate[]> => {
    const response = await apiClient.get<AssetRate[]>("/pricing/rates");
    return response.data;
  },

  /** Update the spread for a specific asset */
  updateSpread: async (
    update: SpreadUpdate
  ): Promise<{ success: boolean }> => {
    const response = await apiClient.patch("/pricing/spread", update);
    return response.data;
  },

  /** Fetch all fee configurations */
  getFees: async (): Promise<FeeConfig[]> => {
    const response = await apiClient.get<FeeConfig[]>("/fees");
    return response.data;
  },

  /** Update a specific fee configuration */
  updateFee: async (
    id: string,
    update: Partial<FeeConfig>
  ): Promise<{ success: boolean }> => {
    const response = await apiClient.patch(`/fees/${id}`, update);
    return response.data;
  },

  /** Fetch asset toggle states */
  getAssetToggles: async (): Promise<AssetToggle[]> => {
    const response = await apiClient.get<AssetToggle[]>("/pricing/assets");
    return response.data;
  },

  /** Toggle asset trading/deposits/withdrawals */
  updateAssetToggle: async (
    asset: string,
    update: Partial<Omit<AssetToggle, "asset">>
  ): Promise<{ success: boolean }> => {
    const response = await apiClient.patch(`/pricing/assets/${asset}`, update);
    return response.data;
  },
};
