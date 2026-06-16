/**
 * useAuditedMutation — TanStack Query wrapper for auditedMutation
 * PRD §4.5 — Every data-changing API call passes through audit logging.
 *
 * Combines auditedMutation with TanStack Query's useMutation
 * for consistent cache invalidation, toast feedback, and audit logging.
 *
 * @example
 * ```tsx
 * const mutation = useAuditedMutation({
 *   action: "approve_kyc",
 *   mutationFn: (userId: string) => kycApi.updateStatus(userId, { status: "APPROVED" }),
 *   invalidateKeys: [["kyc", "queue"]],
 *   successMessage: "KYC approved successfully",
 * });
 * ```
 */

"use client";

import { useMutation, useQueryClient, type InvalidateQueryFilters } from "@tanstack/react-query";
import { auditedMutation } from "@/lib/api/audited-mutation";
import { toast } from "sonner";

interface UseAuditedMutationOptions<TData, TVariables> {
  /** Human-readable action name for audit log (e.g. "approve_kyc") */
  action: string;
  /** The async function that performs the mutation */
  mutationFn: (variables: TVariables) => Promise<TData>;
  /** Query keys to invalidate on success */
  invalidateKeys?: InvalidateQueryFilters["queryKey"][];
  /** Toast message on success */
  successMessage?: string;
  /** Toast message on error (defaults to generic) */
  errorMessage?: string;
  /** Additional audit log details */
  auditDetails?: (variables: TVariables) => Record<string, unknown>;
  /** Callback after successful mutation */
  onSuccess?: (data: TData, variables: TVariables) => void;
  /** Callback after failed mutation */
  onError?: (error: Error, variables: TVariables) => void;
}

export function useAuditedMutation<TData = unknown, TVariables = void>({
  action,
  mutationFn,
  invalidateKeys,
  successMessage,
  errorMessage,
  auditDetails,
  onSuccess,
  onError,
}: UseAuditedMutationOptions<TData, TVariables>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: TVariables) =>
      auditedMutation(
        action,
        () => mutationFn(variables),
        auditDetails?.(variables)
      ),
    onSuccess: (data, variables) => {
      // Invalidate related queries
      if (invalidateKeys) {
        for (const key of invalidateKeys) {
          queryClient.invalidateQueries({ queryKey: key });
        }
      }

      // Show success toast
      if (successMessage) {
        toast.success(successMessage);
      }

      onSuccess?.(data, variables);
    },
    onError: (error: Error, variables) => {
      toast.error(errorMessage || `Failed to ${action.replace(/_/g, " ")}`);
      onError?.(error, variables);
    },
  });
}
