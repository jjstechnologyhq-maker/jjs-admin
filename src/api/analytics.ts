/**
 * Analytics & Reporting API module
 * PRD §7 — Analytics & Reporting
 */

import { apiClient } from "./client";

// ── Types ────────────────────────────────────────────────────────────────────

export interface DauMetrics {
  date: string;
  count: number;
}

export interface VolumeMetrics {
  period: string;
  totalSwapped: number;
  totalWithdrawn: number;
  totalFunded: number;
  currency: string;
}

export interface RevenueMetrics {
  period: string;
  swapFees: number;
  withdrawalFees: number;
  vasFees: number;
  totalRevenue: number;
  currency: string;
}

export interface KycConversionMetrics {
  totalRegistered: number;
  kycStarted: number;
  kycCompleted: number;
  kycApproved: number;
  conversionRate: number;
}

export interface DashboardSummary {
  totalUsers: number;
  activeUsers24h: number;
  pendingKyc: number;
  pendingWithdrawals: number;
  totalVolume24h: number;
  totalRevenue24h: number;
  systemHealth: "HEALTHY" | "DEGRADED" | "DOWN";
}

export type TimeRange = "24h" | "7d" | "30d" | "90d" | "1y";

// ── API methods ──────────────────────────────────────────────────────────────

export const analyticsApi = {
  /** Fetch dashboard summary KPIs */
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const response = await apiClient.get<DashboardSummary>(
      "/analytics/dashboard"
    );
    return response.data;
  },

  /** Fetch DAU metrics over a time range */
  getDau: async (range: TimeRange): Promise<DauMetrics[]> => {
    const response = await apiClient.get<DauMetrics[]>("/analytics/dau", {
      params: { range },
    });
    return response.data;
  },

  /** Fetch volume metrics */
  getVolume: async (range: TimeRange): Promise<VolumeMetrics[]> => {
    const response = await apiClient.get<VolumeMetrics[]>(
      "/analytics/volume",
      { params: { range } }
    );
    return response.data;
  },

  /** Fetch revenue metrics */
  getRevenue: async (range: TimeRange): Promise<RevenueMetrics[]> => {
    const response = await apiClient.get<RevenueMetrics[]>(
      "/analytics/revenue",
      { params: { range } }
    );
    return response.data;
  },

  /** Fetch KYC funnel conversion */
  getKycConversion: async (): Promise<KycConversionMetrics> => {
    const response = await apiClient.get<KycConversionMetrics>(
      "/analytics/kyc-conversion"
    );
    return response.data;
  },

  /** Trigger server-side PDF report generation */
  generateReport: async (
    type: string,
    range: TimeRange
  ): Promise<{ downloadUrl: string }> => {
    const response = await apiClient.post<{ downloadUrl: string }>(
      "/analytics/reports",
      { type, range }
    );
    return response.data;
  },
};
