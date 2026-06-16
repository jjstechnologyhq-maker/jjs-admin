/**
 * auditedMutation — single wrapper for all data-changing API calls
 * PRD §4.5 — Build once on day one, never retrofit into 20 places.
 *
 * Every mutation that changes data passes through this wrapper,
 * which automatically posts to the audit log endpoint.
 */

import { auditApi } from "@/api/audit";

/**
 * Wrap any data-changing operation with automatic audit logging.
 *
 * @param action - Human-readable action description (e.g. "approve_kyc", "adjust_fee")
 * @param fn - The async mutation function to execute
 * @param details - Optional additional context for the audit log
 * @returns The result of the mutation function
 *
 * @example
 * ```ts
 * const result = await auditedMutation(
 *   'approve_withdrawal',
 *   () => withdrawalApi.approve(id),
 *   { withdrawalId: id, amount }
 * );
 * ```
 */
export async function auditedMutation<T>(
  action: string,
  fn: () => Promise<T>,
  details?: Record<string, unknown>
): Promise<T> {
  const result = await fn();

  // Fire-and-forget audit log — don't block the user on audit writes
  auditApi
    .log({
      action,
      timestamp: Date.now(),
      details,
    })
    .catch((err) => {
      // Log audit failure but don't fail the operation
      console.error("[Audit] Failed to log action:", action, err);
    });

  return result;
}
