/**
 * KYC API module
 * PRD §6.2 — KYC Verification Queue, User Detail View
 */

import { apiClient } from "./client";
import type {
  PaginatedResponse,
  PaginationParams,
  KycStatus,
  AccountStatus,
  RiskLevel,
} from "./types";

// ── Types ────────────────────────────────────────────────────────────────────

export interface KycSubmission {
  id: string;
  userId: string;
  userName: string;
  email: string;
  status: KycStatus;
  documentType: string;
  documentUrl: string;
  selfieUrl: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  riskLevel: RiskLevel;
}

export interface KycDetail extends KycSubmission {
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    accountStatus: AccountStatus;
    createdAt: string;
    country: string;
    dateOfBirth: string;
  };
  documents: {
    id: string;
    type: string;
    url: string;
    uploadedAt: string;
  }[];
}

export interface KycStatusUpdate {
  status: KycStatus;
  rejectionReason?: string;
}

export type KycQueueParams = PaginationParams & {
  status?: KycStatus;
  riskLevel?: RiskLevel;
};

// ── Rejection reason codes ───────────────────────────────────────────────────

export const KYC_REJECTION_REASONS = [
  { code: "BLURRY_DOCUMENT", label: "Blurry Document" },
  { code: "EXPIRED_ID", label: "Expired ID" },
  { code: "MISMATCH", label: "Name/Photo Mismatch" },
  { code: "INCOMPLETE", label: "Incomplete Documentation" },
  { code: "SUSPECTED_FRAUD", label: "Suspected Fraud" },
  { code: "UNDERAGE", label: "Under Minimum Age" },
  { code: "OTHER", label: "Other" },
] as const;

// ── API methods ──────────────────────────────────────────────────────────────

export const kycApi = {
  /** Fetch the KYC verification queue with filters */
  getQueue: async (
    params?: KycQueueParams
  ): Promise<PaginatedResponse<KycSubmission>> => {
    const response = await apiClient.get<PaginatedResponse<KycSubmission>>(
      "/kyc/queue",
      { params }
    );
    return response.data;
  },

  /** Fetch detailed KYC submission with user info and all documents */
  getDetail: async (userId: string): Promise<KycDetail> => {
    const response = await apiClient.get<KycDetail>(`/kyc/${userId}`);
    return response.data;
  },

  /** Update KYC verification status (approve/reject) */
  updateStatus: async (
    userId: string,
    update: KycStatusUpdate
  ): Promise<{ success: boolean }> => {
    const response = await apiClient.patch(`/kyc/${userId}/status`, update);
    return response.data;
  },
};
