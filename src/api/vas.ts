/**
 * VAS Management API module
 * PRD §6.6 — Value Added Services Management
 */

import { apiClient } from "./client";
import type { VasProductStatus } from "./types";

// ── Types ────────────────────────────────────────────────────────────────────

export interface VasProvider {
  id: string;
  name: string;
  status: "ONLINE" | "OFFLINE" | "DEGRADED";
  balance: number;
  currency: string;
  lastChecked: string;
  uptimePercent: number;
}

export interface VasProduct {
  id: string;
  name: string;
  providerId: string;
  providerName: string;
  category: string;
  status: VasProductStatus;
  transactionCount: number;
  lastUsed: string;
}

export interface VasTransaction {
  id: string;
  productName: string;
  userId: string;
  userName: string;
  amount: number;
  status: "SUCCESS" | "FAILED" | "PENDING" | "REFUNDED";
  providerRef: string;
  createdAt: string;
  retryable: boolean;
}

// ── API methods ──────────────────────────────────────────────────────────────

export const vasApi = {
  /** Fetch all VAS providers with status */
  getProviders: async (): Promise<VasProvider[]> => {
    const response = await apiClient.get<VasProvider[]>("/vas/providers");
    return response.data;
  },

  /** Fetch all VAS products */
  getProducts: async (): Promise<VasProduct[]> => {
    const response = await apiClient.get<VasProduct[]>("/vas/products");
    return response.data;
  },

  /** Toggle a VAS product on/off */
  toggleProduct: async (
    id: string,
    status: VasProductStatus
  ): Promise<{ success: boolean }> => {
    const response = await apiClient.patch(`/vas/products/${id}/toggle`, {
      status,
    });
    return response.data;
  },

  /** Retry a failed VAS transaction */
  retryTransaction: async (id: string): Promise<{ success: boolean }> => {
    const response = await apiClient.post(`/vas/transactions/${id}/retry`);
    return response.data;
  },

  /** Refund a failed VAS transaction */
  refundTransaction: async (id: string): Promise<{ success: boolean }> => {
    const response = await apiClient.post(`/vas/transactions/${id}/refund`);
    return response.data;
  },
};
