/**
 * Transaction Limits API — platform-wide and per-user min/max bounds on swaps,
 * transfers, and withdrawals.
 *
 * Two tiers: a *general* config applies to everyone; per-user entries override
 * it one bound at a time. `swap` is keyed by a directed pair (`ngn_usdt`),
 * `transfer`/`withdrawal` by a currency ticker.
 *
 * Requires SUPER_ADMIN or FINANCE_MANAGER.
 * See openapi-admin.yaml › Transaction Limits.
 */

import { apiClient } from "./client";
import type {
  EffectiveTransactionLimits,
  LimitKind,
  SetTransactionLimitsRequest,
  TransactionLimitsView,
} from "./schema";

export const transactionLimitsApi = {
  // ── General (platform-wide) ────────────────────────────────────────────────
  /** GET /transaction-limits/general — the bounds every user inherits. */
  getGeneral: async (): Promise<TransactionLimitsView> => {
    const res = await apiClient.get<TransactionLimitsView>("/transaction-limits/general");
    return res.data;
  },

  /** PUT /transaction-limits/general — merge (default) or replace the document. */
  setGeneral: async (
    body: SetTransactionLimitsRequest,
  ): Promise<TransactionLimitsView> => {
    const res = await apiClient.put<TransactionLimitsView>(
      "/transaction-limits/general",
      body,
    );
    return res.data;
  },

  /** DELETE /transaction-limits/general/{kind}/{key} — remove one general entry. */
  removeGeneralEntry: async (
    kind: LimitKind,
    key: string,
  ): Promise<TransactionLimitsView> => {
    const res = await apiClient.delete<TransactionLimitsView>(
      `/transaction-limits/general/${kind}/${encodeURIComponent(key)}`,
    );
    return res.data;
  },

  // ── Per user ───────────────────────────────────────────────────────────────
  /** GET /transaction-limits/users/{appUserId} — this user's overrides only. */
  getUser: async (appUserId: string): Promise<TransactionLimitsView> => {
    const res = await apiClient.get<TransactionLimitsView>(
      `/transaction-limits/users/${appUserId}`,
    );
    return res.data;
  },

  /** PUT /transaction-limits/users/{appUserId} — set this user's overrides. */
  setUser: async (
    appUserId: string,
    body: SetTransactionLimitsRequest,
  ): Promise<TransactionLimitsView> => {
    const res = await apiClient.put<TransactionLimitsView>(
      `/transaction-limits/users/${appUserId}`,
      body,
    );
    return res.data;
  },

  /** DELETE /transaction-limits/users/{appUserId} — drop all overrides. */
  clearUser: async (appUserId: string): Promise<TransactionLimitsView> => {
    const res = await apiClient.delete<TransactionLimitsView>(
      `/transaction-limits/users/${appUserId}`,
    );
    return res.data;
  },

  /** GET /transaction-limits/users/{appUserId}/effective — merged result + inputs. */
  getEffective: async (appUserId: string): Promise<EffectiveTransactionLimits> => {
    const res = await apiClient.get<EffectiveTransactionLimits>(
      `/transaction-limits/users/${appUserId}/effective`,
    );
    return res.data;
  },

  /** DELETE /transaction-limits/users/{appUserId}/{kind} — drop a whole kind. */
  clearUserKind: async (
    appUserId: string,
    kind: LimitKind,
  ): Promise<TransactionLimitsView> => {
    const res = await apiClient.delete<TransactionLimitsView>(
      `/transaction-limits/users/${appUserId}/${kind}`,
    );
    return res.data;
  },

  /** DELETE /transaction-limits/users/{appUserId}/{kind}/{key} — drop one entry. */
  clearUserEntry: async (
    appUserId: string,
    kind: LimitKind,
    key: string,
  ): Promise<TransactionLimitsView> => {
    const res = await apiClient.delete<TransactionLimitsView>(
      `/transaction-limits/users/${appUserId}/${kind}/${encodeURIComponent(key)}`,
    );
    return res.data;
  },
};
