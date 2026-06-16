/**
 * Transactions API module
 * PRD §6.5 — Transaction Oversight & Risk Management
 */

import { apiClient } from "./client";
import type {
  PaginatedResponse,
  PaginationParams,
  TransactionType,
  RiskLevel,
} from "./types";

// ── Types ────────────────────────────────────────────────────────────────────

export interface Transaction {
  id: string;
  type: TransactionType;
  userId: string;
  userName: string;
  asset: string;
  amount: number;
  usdValue: number;
  fee: number;
  status: string;
  riskLevel: RiskLevel;
  riskScore: number;
  riskFlags: string[];
  fromAddress?: string;
  toAddress?: string;
  network?: string;
  txHash?: string;
  createdAt: string;
  completedAt?: string;
}

export interface TransactionDetail extends Transaction {
  user: {
    id: string;
    fullName: string;
    email: string;
    accountAge: number; // days
    kycStatus: string;
  };
  relatedTransactions: Transaction[];
}

export type TransactionListParams = PaginationParams & {
  type?: TransactionType;
  riskLevel?: RiskLevel;
  userId?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
};

// ── API methods ──────────────────────────────────────────────────────────────

export const transactionsApi = {
  /** Fetch paginated transaction ledger */
  getTransactions: async (
    params?: TransactionListParams
  ): Promise<PaginatedResponse<Transaction>> => {
    const response = await apiClient.get<PaginatedResponse<Transaction>>(
      "/transactions",
      { params }
    );
    return response.data;
  },

  /** Fetch single transaction with related data */
  getTransaction: async (id: string): Promise<TransactionDetail> => {
    const response = await apiClient.get<TransactionDetail>(
      `/transactions/${id}`
    );
    return response.data;
  },

  /** Manually flag a transaction for review */
  flagTransaction: async (
    id: string,
    reason: string
  ): Promise<{ success: boolean }> => {
    const response = await apiClient.post(`/transactions/${id}/flag`, {
      reason,
    });
    return response.data;
  },
};
