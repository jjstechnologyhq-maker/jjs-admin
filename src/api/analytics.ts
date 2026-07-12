/**
 * Analytics API — overview metrics, time-series, KYC funnel, VASP monitoring,
 * PDF reports, and the admin audit log.
 * See openapi-admin.yaml › Analytics.
 */

import { apiClient } from "./client";
import { cleanParams, type Paginated } from "./types";
import type {
  AnalyticsOverview,
  DataPoint,
  VolumeDataPoint,
  RevenueDataPoint,
  KycFunnelData,
  VaspMonitoringData,
  PdfReportStatusResponse,
  EnqueueReportRequest,
  AuditLogEntry,
  PaginatedAuditLog,
  AnalyticsPeriodEnum,
} from "./schema";

export interface RangeParams {
  period: AnalyticsPeriodEnum;
  from: string;
  to: string;
}

export interface AuditLogParams {
  adminId?: string;
  action?: string;
  entityType?: string;
  dateFrom?: string;
  dateTo?: string;
  cursor?: string;
  limit?: number;
}

export const analyticsApi = {
  overview: async (): Promise<AnalyticsOverview> => {
    const res = await apiClient.get<AnalyticsOverview>("/analytics/overview");
    return res.data;
  },

  users: async (params: RangeParams): Promise<DataPoint[]> => {
    const res = await apiClient.get<{ data: DataPoint[] }>("/analytics/users", { params });
    return res.data.data;
  },
  volumes: async (params: RangeParams): Promise<VolumeDataPoint[]> => {
    const res = await apiClient.get<{ data: VolumeDataPoint[] }>("/analytics/volumes", { params });
    return res.data.data;
  },
  revenue: async (params: RangeParams): Promise<RevenueDataPoint[]> => {
    const res = await apiClient.get<{ data: RevenueDataPoint[] }>("/analytics/revenue", { params });
    return res.data.data;
  },

  kycFunnel: async (params: { from: string; to: string }): Promise<KycFunnelData> => {
    const res = await apiClient.get<KycFunnelData>("/analytics/kyc-funnel", { params });
    return res.data;
  },
  vasp: async (): Promise<VaspMonitoringData> => {
    const res = await apiClient.get<VaspMonitoringData>("/analytics/vasp");
    return res.data;
  },

  // ── PDF reports (async job) ──────────────────────────────────────────────
  enqueueReport: async (body: EnqueueReportRequest): Promise<{ jobId: string }> => {
    const res = await apiClient.post<{ jobId: string }>("/analytics/reports", body);
    return res.data;
  },
  reportStatus: async (jobId: string): Promise<PdfReportStatusResponse> => {
    const res = await apiClient.get<PdfReportStatusResponse>(`/analytics/reports/${jobId}`);
    return res.data;
  },

  // ── Audit log (SUPER_ADMIN) ──────────────────────────────────────────────
  auditLog: async (params: AuditLogParams = {}): Promise<Paginated<AuditLogEntry>> => {
    const res = await apiClient.get<PaginatedAuditLog>("/analytics/audit-log", {
      params: cleanParams(params),
    });
    return res.data as Paginated<AuditLogEntry>;
  },
};
