/**
 * auditedMutation — passthrough wrapper for data-changing API calls.
 *
 * The JJS Admin Service records an audit-log entry server-side for every
 * mutating admin action (surfaced read-only via GET /analytics/audit-log).
 * The client therefore does NOT write audit entries; this wrapper stays as a
 * thin passthrough so `useAuditedMutation`'s invalidation/toast ergonomics work
 * without a nonexistent client-side audit endpoint.
 *
 * @param _action - Human-readable action name (kept for call-site clarity).
 * @param fn - The async mutation to execute.
 * @param _details - Optional context (unused client-side).
 */
export async function auditedMutation<T>(
  _action: string,
  fn: () => Promise<T>,
  _details?: Record<string, unknown>,
): Promise<T> {
  return fn();
}
