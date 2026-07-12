/**
 * Transactions API — unified ledger, CSV export, and VAS reverse/retry.
 * See openapi-admin.yaml › Transactions.
 */

import { apiClient } from "./client";
import { cleanParams, type Paginated } from "./types";
import type {
  TransactionResponse,
  PaginatedTransactions,
  VasActionRequest,
  TransactionType,
  TransactionStatus,
} from "./schema";

export interface TransactionListParams {
  type?: TransactionType;
  status?: TransactionStatus;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  cursor?: string;
  limit?: number;
}

/** Filters shared between list and export (export takes no cursor/limit). */
export type TransactionFilters = Omit<TransactionListParams, "cursor" | "limit">;

export const transactionsApi = {
  /** GET /transactions — cursor-paginated ledger with filters. */
  list: async (params: TransactionListParams = {}): Promise<Paginated<TransactionResponse>> => {
    const res = await apiClient.get<PaginatedTransactions>("/transactions", {
      params: cleanParams(params),
    });
    return res.data as Paginated<TransactionResponse>;
  },

  /** GET /transactions/{id} — single transaction detail. */
  get: async (id: string): Promise<TransactionResponse> => {
    const res = await apiClient.get<TransactionResponse>(`/transactions/${id}`);
    return res.data;
  },

  /** POST /transactions/{id}/reverse — reverse a confirmed/successful VAS tx. */
  reverse: async (id: string, body?: VasActionRequest): Promise<TransactionResponse> => {
    const res = await apiClient.post<TransactionResponse>(`/transactions/${id}/reverse`, body ?? {});
    return res.data;
  },

  /** POST /transactions/{id}/retry — retry a failed/cancelled VAS tx. */
  retry: async (id: string, body?: VasActionRequest): Promise<TransactionResponse> => {
    const res = await apiClient.post<TransactionResponse>(`/transactions/${id}/retry`, body ?? {});
    return res.data;
  },

  /**
   * GET /transactions/export — stream matching transactions as CSV and trigger
   * a browser download. Uses the authenticated client (Bearer token) and a blob.
   */
  exportCsv: async (filters: TransactionFilters = {}): Promise<void> => {
    const res = await apiClient.get("/transactions/export", {
      params: cleanParams(filters),
      responseType: "blob",
    });
    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};
