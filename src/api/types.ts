/**
 * Shared API types — pagination, filtering, common response shapes
 * Aligned with openapi.yaml schemas
 */

// ── Standard response envelope ─────────────────────────────────────────────

/** Standard API response wrapper (success + message + data) */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/** Standard paginated response envelope matching openapi.yaml */
export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: PaginationMeta;
}

/** Pagination metadata — matches PaginationMeta schema in openapi.yaml */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Standard API error shape — matches ErrorResponse schema */
export interface ApiError {
  success: boolean;
  message: string;
  error?: string;
}

// ── Query params ────────────────────────────────────────────────────────────

/** Common query params for paginated list endpoints */
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
}

// ── User / Admin enums (from openapi.yaml) ──────────────────────────────────

/**
 * User account statuses — matches openapi.yaml enum on /user/admin/users
 * Note: "pending kyc" contains a space, matching the backend exactly.
 */
export type AccountStatus =
  | "active"
  | "suspended"
  | "unverified"
  | "pending kyc"
  | "flagged";

/**
 * KYC verification level — matches openapi.yaml kycLevel enum.
 * 0 = unverified, 1 = phone verified, 2 = BVN verified, 3 = fully verified
 */
export type KycLevel = "0" | "1" | "2" | "3";

/** User role — matches openapi.yaml role enum */
export type UserRole = "admin" | "subscriber";

// ── Admin Stats ─────────────────────────────────────────────────────────────

/** Platform-wide user statistics — matches AdminStats schema */
export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  flaggedUsers: number;
  pendingKycUsers: number;
  unverifiedUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
}

// ── Legacy types still used by non-admin modules ────────────────────────────
// These remain for modules (withdrawals, transactions, fees, etc.) that
// haven't been spec-aligned yet. Remove as those modules get updated.

/** KYC submission statuses (for KYC queue — not in current openapi.yaml) */
export type KycStatus = "PENDING" | "APPROVED" | "REJECTED" | "INFO_REQUIRED";

/** Transaction types */
export type TransactionType = "SWAP" | "TRANSFER" | "WITHDRAWAL" | "FUNDING";

/** Withdrawal statuses */
export type WithdrawalStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

/** Risk levels */
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

/** Maker-Checker statuses */
export type MakerCheckerStatus = "PENDING" | "APPROVED" | "REJECTED";

/** Admin invitation statuses */
export type InvitationStatus = "PENDING" | "ACTIVE" | "EXPIRED";

/** VAS product statuses */
export type VasProductStatus = "ACTIVE" | "DISABLED" | "MAINTENANCE";

/** Ticket statuses */
export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

/** Ticket priority */
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
