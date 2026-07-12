/**
 * KYC API — review queue and submission status changes.
 * See openapi-admin.yaml › KYC.
 *
 * Document URLs (idDocumentUrl, selfieUrl) are pre-signed S3 URLs with a
 * 60-second TTL — never cache them; fetch fresh on every render.
 */

import { apiClient } from "./client";
import { cleanParams, type Paginated } from "./types";
import type {
  KycQueueItem,
  KycDetail,
  PaginatedKycQueue,
  UpdateKycStatusRequest,
  KycQueueStatusFilter,
  KycRejectionReason,
} from "./schema";

export const KYC_REJECTION_REASONS: { code: KycRejectionReason; label: string }[] = [
  { code: "BLURRY_DOCUMENT", label: "Blurry document" },
  { code: "EXPIRED_ID", label: "Expired ID" },
  { code: "FACE_MISMATCH", label: "Face mismatch" },
  { code: "INCOMPLETE_INFO", label: "Incomplete info" },
  { code: "SUSPECTED_FRAUD", label: "Suspected fraud" },
];

export interface KycQueueParams {
  status?: KycQueueStatusFilter[];
  cursor?: string;
  limit?: number;
}

export const kycApi = {
  /** GET /kyc/queue — cursor-paginated queue (defaults to PENDING + INFO_REQUIRED). */
  getQueue: async (params: KycQueueParams = {}): Promise<Paginated<KycQueueItem>> => {
    const res = await apiClient.get<PaginatedKycQueue>("/kyc/queue", {
      params: cleanParams(params),
      // Serialise `status` as repeated keys (style: form, explode: true).
      paramsSerializer: { indexes: null },
    });
    return res.data as Paginated<KycQueueItem>;
  },

  /** GET /kyc/{userId} — full submission detail + user summary. */
  getDetail: async (userId: string): Promise<KycDetail> => {
    const res = await apiClient.get<KycDetail>(`/kyc/${userId}`);
    return res.data;
  },

  /**
   * PATCH /kyc/{userId} — APPROVED | REJECTED | INFO_REQUIRED.
   * `rejectionReason` is required iff status = REJECTED.
   */
  updateStatus: async (
    userId: string,
    body: UpdateKycStatusRequest,
  ): Promise<KycQueueItem> => {
    const res = await apiClient.patch<KycQueueItem>(`/kyc/${userId}`, body);
    return res.data;
  },
};
