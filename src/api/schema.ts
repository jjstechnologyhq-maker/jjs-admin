/**
 * Friendly type aliases over the generated OpenAPI types.
 *
 * The source of truth is `openapi-admin.yaml` → `generated/openapi.d.ts`
 * (regenerate with `npm run gen:api`). Import spec types from here, never
 * reach into the generated file directly.
 */

import type { components, paths } from "./generated/openapi";

export type Schemas = components["schemas"];
export type Paths = paths;

// ── Auth ───────────────────────────────────────────────────────────────────
export type LoginRequest = Schemas["LoginRequest"];
export type LoginResult = Schemas["LoginResult"];
export type TotpVerifyRequest = Schemas["TotpVerifyRequest"];
export type TokenResponse = Schemas["TokenResponse"];
export type ForcePasswordChangeResponse = Schemas["ForcePasswordChangeResponse"];
export type TotpSetupResult = Schemas["TotpSetupResult"];
export type TotpConfirmRequest = Schemas["TotpConfirmRequest"];
export type RefreshTokenRequest = Schemas["RefreshTokenRequest"];
export type ChangePasswordRequest = Schemas["ChangePasswordRequest"];

// ── Admins ─────────────────────────────────────────────────────────────────
export type AdminRole = Schemas["AdminRole"];
export type AdminStatus = Schemas["AdminStatus"];
export type AdminProfile = Schemas["AdminProfile"];
export type AdminDetail = Schemas["AdminDetail"];
export type ListAdminsResult = Schemas["ListAdminsResult"];
export type InviteAdminRequest = Schemas["InviteAdminRequest"];
export type InviteAdminResult = Schemas["InviteAdminResult"];
export type ActivateAdminRequest = Schemas["ActivateAdminRequest"];
export type UpdateAdminRequest = Schemas["UpdateAdminRequest"];
export type MfaResetRequest = Schemas["MfaResetRequest"];

// ── Users ──────────────────────────────────────────────────────────────────
export type UserAccountStatus = Schemas["UserAccountStatus"];
export type KycStatus = Schemas["KycStatus"];
export type UserSummary = Schemas["UserSummary"];
export type UserDetail = Schemas["UserDetail"];
export type UserNoteView = Schemas["UserNoteView"];
export type PaginatedUsers = Schemas["PaginatedUsers"];
export type PaginatedNotes = Schemas["PaginatedNotes"];
export type UpdateUserStatusRequest = Schemas["UpdateUserStatusRequest"];
export type CreateNoteRequest = Schemas["CreateNoteRequest"];
export type FiatBalance = Schemas["FiatBalance"];
export type CryptoBalance = Schemas["CryptoBalance"];
export type DeviceFingerprint = Schemas["DeviceFingerprint"];

// ── KYC ────────────────────────────────────────────────────────────────────
export type KycQueueStatusFilter = Schemas["KycQueueStatusFilter"];
export type KycRejectionReason = Schemas["KycRejectionReason"];
export type KycQueueItem = Schemas["KycQueueItem"];
export type KycDetail = Schemas["KycDetail"];
export type PaginatedKycQueue = Schemas["PaginatedKycQueue"];
export type UpdateKycStatusRequest = Schemas["UpdateKycStatusRequest"];

// ── Transactions ───────────────────────────────────────────────────────────
export type TransactionType = Schemas["TransactionType"];
export type TransactionStatus = Schemas["TransactionStatus"];
export type TransactionResponse = Schemas["TransactionResponse"];
export type PaginatedTransactions = Schemas["PaginatedTransactions"];
export type VasActionRequest = Schemas["VasActionRequest"];

// ── Finance ────────────────────────────────────────────────────────────────
export type WalletType = Schemas["WalletType"];
export type AdjustmentDirection = Schemas["AdjustmentDirection"];
export type AdjustmentStatus = Schemas["AdjustmentStatus"];
export type WithdrawalStatus = Schemas["WithdrawalStatus"];
export type WalletBalanceResponse = Schemas["WalletBalanceResponse"];
export type CreateWalletRequest = Schemas["CreateWalletRequest"];
export type WalletThresholdRequest = Schemas["WalletThresholdRequest"];
export type ImmediateAdjustmentResponse = Schemas["ImmediateAdjustmentResponse"];
export type PendingAdjustmentResponse = Schemas["PendingAdjustmentResponse"];
export type AdjustmentResponse = Schemas["AdjustmentResponse"];
export type WithdrawalItem = Schemas["WithdrawalItem"];
export type PaginatedWithdrawals = Schemas["PaginatedWithdrawals"];
export type CreateAdjustmentRequest = Schemas["CreateAdjustmentRequest"];
export type BulkApproveWithdrawalRequest = Schemas["BulkApproveWithdrawalRequest"];
export type BulkRejectWithdrawalRequest = Schemas["BulkRejectWithdrawalRequest"];
export type BulkApproveResult = Schemas["BulkApproveResult"];
export type BulkRejectResult = Schemas["BulkRejectResult"];

// ── Pricing ────────────────────────────────────────────────────────────────
export type FeeRuleTypeEnum = Schemas["FeeRuleTypeEnum"];
export type FeeCalculationTypeEnum = Schemas["FeeCalculationTypeEnum"];
export type AssetSpreadResponse = Schemas["AssetSpreadResponse"];
export type FeeRuleResponse = Schemas["FeeRuleResponse"];
export type AssetResponse = Schemas["AssetResponse"];
export type CreateSpreadRequest = Schemas["CreateSpreadRequest"];
export type UpdateSpreadRequest = Schemas["UpdateSpreadRequest"];
export type CreateFeeRuleRequest = Schemas["CreateFeeRuleRequest"];
export type UpdateFeeRuleRequest = Schemas["UpdateFeeRuleRequest"];
export type CreateAssetRequest = Schemas["CreateAssetRequest"];
export type ToggleAssetRequest = Schemas["ToggleAssetRequest"];

// ── Risk ───────────────────────────────────────────────────────────────────
export type RiskActionEnum = Schemas["RiskActionEnum"];
export type FlagSourceEnum = Schemas["FlagSourceEnum"];
export type RiskRuleResponse = Schemas["RiskRuleResponse"];
export type FlaggedTransactionResponse = Schemas["FlaggedTransactionResponse"];
export type PaginatedFlaggedTransactions = Schemas["PaginatedFlaggedTransactions"];
export type CreateRiskRuleRequest = Schemas["CreateRiskRuleRequest"];
export type UpdateRiskRuleRequest = Schemas["UpdateRiskRuleRequest"];
export type ManualFlagRequest = Schemas["ManualFlagRequest"];
export type ManualUnflagRequest = Schemas["ManualUnflagRequest"];

// ── VAS ────────────────────────────────────────────────────────────────────
export type VasProviderStatusEnum = Schemas["VasProviderStatusEnum"];
export type VasCategoryEnum = Schemas["VasCategoryEnum"];
export type VasProviderResponse = Schemas["VasProviderResponse"];
export type VasProductResponse = Schemas["VasProductResponse"];
export type CreateVasProviderRequest = Schemas["CreateVasProviderRequest"];
export type CreateVasProductRequest = Schemas["CreateVasProductRequest"];
export type ToggleRequest = Schemas["ToggleRequest"];

// ── Support ────────────────────────────────────────────────────────────────
export type TicketStatusEnum = Schemas["TicketStatusEnum"];
export type BannerTypeEnum = Schemas["BannerTypeEnum"];
export type TicketReplyResponse = Schemas["TicketReplyResponse"];
export type SupportTicketResponse = Schemas["SupportTicketResponse"];
export type PaginatedTickets = Schemas["PaginatedTickets"];
export type BannerResponse = Schemas["BannerResponse"];
export type EmailTemplateResponse = Schemas["EmailTemplateResponse"];
export type CreateTicketRequest = Schemas["CreateTicketRequest"];
export type ReplyTicketRequest = Schemas["ReplyTicketRequest"];
export type UpdateTicketStatusRequest = Schemas["UpdateTicketStatusRequest"];
export type SendNotificationRequest = Schemas["SendNotificationRequest"];
export type CreateBannerRequest = Schemas["CreateBannerRequest"];
export type UpdateBannerRequest = Schemas["UpdateBannerRequest"];
export type CreateTemplateRequest = Schemas["CreateTemplateRequest"];
export type UpdateTemplateRequest = Schemas["UpdateTemplateRequest"];

// ── Analytics ──────────────────────────────────────────────────────────────
export type AnalyticsPeriodEnum = Schemas["AnalyticsPeriodEnum"];
export type ReportTypeEnum = Schemas["ReportTypeEnum"];
export type PdfReportStatusEnum = Schemas["PdfReportStatusEnum"];
export type AnalyticsOverview = Schemas["AnalyticsOverview"];
export type DataPoint = Schemas["DataPoint"];
export type VolumeDataPoint = Schemas["VolumeDataPoint"];
export type RevenueDataPoint = Schemas["RevenueDataPoint"];
export type KycFunnelData = Schemas["KycFunnelData"];
export type VaspMonitoringData = Schemas["VaspMonitoringData"];
export type PdfReportStatusResponse = Schemas["PdfReportStatusResponse"];
export type AuditLogEntry = Schemas["AuditLogEntry"];
export type PaginatedAuditLog = Schemas["PaginatedAuditLog"];
export type EnqueueReportRequest = Schemas["EnqueueReportRequest"];

// ── Shared ─────────────────────────────────────────────────────────────────
export type ErrorResponse = Schemas["ErrorResponse"];
export type PaginatedMeta = Schemas["PaginatedMeta"];
