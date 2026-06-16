/**
 * Audit API module
 * PRD §6.1 — Every action logged with timestamp, IP, actor, and specific changes made
 */

import { apiClient } from "./client";

export interface AuditLogEntry {
  action: string;
  timestamp: number;
  ip?: string;
  details?: Record<string, unknown>;
}

export const auditApi = {
  /**
   * Log an admin action to the audit trail
   */
  log: async (entry: AuditLogEntry) => {
    return apiClient.post("/audit/log", entry);
  },

  /**
   * Fetch audit log entries with optional filters
   */
  getEntries: async (params?: {
    page?: number;
    limit?: number;
    action?: string;
    actor?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    return apiClient.get("/audit/entries", { params });
  },
};
