/**
 * Pricing API — asset pair spreads, fee rules, and asset enable/disable.
 * See openapi-admin.yaml › Pricing.
 */

import { apiClient } from "./client";
import type {
  AssetSpreadResponse,
  FeeRuleResponse,
  AssetResponse,
  CreateSpreadRequest,
  UpdateSpreadRequest,
  CreateFeeRuleRequest,
  UpdateFeeRuleRequest,
  CreateAssetRequest,
  ToggleAssetRequest,
} from "./schema";

export const pricingApi = {
  // ── Spreads ──────────────────────────────────────────────────────────────
  listSpreads: async (): Promise<AssetSpreadResponse[]> => {
    const res = await apiClient.get<AssetSpreadResponse[]>("/pricing/spreads");
    return res.data;
  },
  createSpread: async (body: CreateSpreadRequest): Promise<AssetSpreadResponse> => {
    const res = await apiClient.post<AssetSpreadResponse>("/pricing/spreads", body);
    return res.data;
  },
  updateSpread: async (
    assetPair: string,
    body: UpdateSpreadRequest,
  ): Promise<AssetSpreadResponse> => {
    const res = await apiClient.patch<AssetSpreadResponse>(
      `/pricing/spreads/${encodeURIComponent(assetPair)}`,
      body,
    );
    return res.data;
  },

  // ── Fee rules ────────────────────────────────────────────────────────────
  listFees: async (): Promise<FeeRuleResponse[]> => {
    const res = await apiClient.get<FeeRuleResponse[]>("/pricing/fees");
    return res.data;
  },
  createFee: async (body: CreateFeeRuleRequest): Promise<FeeRuleResponse> => {
    const res = await apiClient.post<FeeRuleResponse>("/pricing/fees", body);
    return res.data;
  },
  updateFee: async (feeId: string, body: UpdateFeeRuleRequest): Promise<FeeRuleResponse> => {
    const res = await apiClient.patch<FeeRuleResponse>(`/pricing/fees/${feeId}`, body);
    return res.data;
  },
  deactivateFee: async (feeId: string): Promise<void> => {
    await apiClient.delete(`/pricing/fees/${feeId}`);
  },

  // ── Assets ───────────────────────────────────────────────────────────────
  listAssets: async (): Promise<AssetResponse[]> => {
    const res = await apiClient.get<AssetResponse[]>("/pricing/assets");
    return res.data;
  },
  createAsset: async (body: CreateAssetRequest): Promise<AssetResponse> => {
    const res = await apiClient.post<AssetResponse>("/pricing/assets", body);
    return res.data;
  },
  toggleAsset: async (asset: string, body: ToggleAssetRequest): Promise<AssetResponse> => {
    const res = await apiClient.patch<AssetResponse>(
      `/pricing/assets/${encodeURIComponent(asset)}/toggle`,
      body,
    );
    return res.data;
  },
};
