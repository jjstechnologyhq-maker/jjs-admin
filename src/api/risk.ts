/**
 * Risk API — automated rule engine and manual transaction flagging.
 * See openapi-admin.yaml › Risk.
 */

import { apiClient } from "./client";
import { cleanParams, type Paginated } from "./types";
import type {
  RiskRuleResponse,
  CreateRiskRuleRequest,
  UpdateRiskRuleRequest,
  FlaggedTransactionResponse,
  PaginatedFlaggedTransactions,
  ManualFlagRequest,
  ManualUnflagRequest,
  FlagSourceEnum,
} from "./schema";

export interface FlaggedListParams {
  flaggedBy?: FlagSourceEnum;
  dateFrom?: string;
  cursor?: string;
  limit?: number;
}

export const riskApi = {
  // ── Rules ────────────────────────────────────────────────────────────────
  listRules: async (): Promise<RiskRuleResponse[]> => {
    const res = await apiClient.get<RiskRuleResponse[]>("/risk/rules");
    return res.data;
  },
  createRule: async (body: CreateRiskRuleRequest): Promise<RiskRuleResponse> => {
    const res = await apiClient.post<RiskRuleResponse>("/risk/rules", body);
    return res.data;
  },
  updateRule: async (id: string, body: UpdateRiskRuleRequest): Promise<RiskRuleResponse> => {
    const res = await apiClient.patch<RiskRuleResponse>(`/risk/rules/${id}`, body);
    return res.data;
  },
  deactivateRule: async (id: string): Promise<void> => {
    await apiClient.delete(`/risk/rules/${id}`);
  },

  // ── Flagged transactions ─────────────────────────────────────────────────
  listFlagged: async (
    params: FlaggedListParams = {},
  ): Promise<Paginated<FlaggedTransactionResponse>> => {
    const res = await apiClient.get<PaginatedFlaggedTransactions>("/risk/flagged", {
      params: cleanParams(params),
    });
    return res.data as Paginated<FlaggedTransactionResponse>;
  },
  flag: async (txId: string, body: ManualFlagRequest): Promise<FlaggedTransactionResponse> => {
    const res = await apiClient.post<FlaggedTransactionResponse>(`/risk/flagged/${txId}/flag`, body);
    return res.data;
  },
  unflag: async (txId: string, body: ManualUnflagRequest): Promise<FlaggedTransactionResponse> => {
    const res = await apiClient.post<FlaggedTransactionResponse>(`/risk/flagged/${txId}/unflag`, body);
    return res.data;
  },
};
