"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Info,
  AlertTriangle,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Loader2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { kycApi, KYC_REJECTION_REASONS } from "@/api/kyc";
import type { KycStatus, RiskLevel } from "@/api/types";
import { useAuditedMutation } from "@/hooks/use-audited-mutation";
import { useState } from "react";

// ── Badge configs ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<KycStatus, { label: string; icon: React.ComponentType<{ className?: string }>; className: string }> = {
  PENDING: { label: "Pending Review", icon: Clock, className: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400" },
  APPROVED: { label: "Approved", icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400" },
  REJECTED: { label: "Rejected", icon: XCircle, className: "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400" },
  INFO_REQUIRED: { label: "Info Required", icon: Info, className: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400" },
};

const RISK_CONFIG: Record<RiskLevel, { label: string; className: string }> = {
  LOW: { label: "Low Risk", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  MEDIUM: { label: "Medium Risk", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  HIGH: { label: "High Risk", className: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  CRITICAL: { label: "Critical Risk", className: "bg-red-500/10 text-red-600 border-red-500/20" },
};

// ── Component ────────────────────────────────────────────────────────────────

export default function KycDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = use(params);
  const router = useRouter();
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: detail, isLoading } = useQuery({
    queryKey: ["kyc", "detail", userId],
    queryFn: () => kycApi.getDetail(userId),
  });

  const approveMutation = useAuditedMutation({
    action: "approve_kyc",
    mutationFn: () => kycApi.updateStatus(userId, { status: "APPROVED" }),
    invalidateKeys: [["kyc", "queue"], ["kyc", "detail", userId]],
    successMessage: "KYC approved successfully",
    auditDetails: () => ({ userId }),
  });

  const rejectMutation = useAuditedMutation({
    action: "reject_kyc",
    mutationFn: () =>
      kycApi.updateStatus(userId, {
        status: "REJECTED",
        rejectionReason: rejectionReason || undefined,
      }),
    invalidateKeys: [["kyc", "queue"], ["kyc", "detail", userId]],
    successMessage: "KYC rejected",
    auditDetails: () => ({ userId, rejectionReason }),
  });

  const requestInfoMutation = useAuditedMutation({
    action: "request_kyc_info",
    mutationFn: () => kycApi.updateStatus(userId, { status: "INFO_REQUIRED" }),
    invalidateKeys: [["kyc", "queue"], ["kyc", "detail", userId]],
    successMessage: "Information requested from user",
    auditDetails: () => ({ userId }),
  });

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[400px] rounded-lg" />
          <Skeleton className="h-[400px] rounded-lg" />
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Submission not found</p>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[detail.status];
  const StatusIcon = statusConfig.icon;
  const riskConfig = RISK_CONFIG[detail.riskLevel];
  const isPending = detail.status === "PENDING";

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Back + Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/kyc")}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{detail.userName}</h1>
              <Badge variant="outline" className={`gap-1 ${statusConfig.className}`}>
                <StatusIcon className="size-3" />
                {statusConfig.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{detail.email}</p>
          </div>
        </div>

        {/* Risk badge */}
        <Badge variant="outline" className={`${riskConfig.className} gap-1`}>
          {(detail.riskLevel === "HIGH" || detail.riskLevel === "CRITICAL") && (
            <AlertTriangle className="size-3" />
          )}
          {riskConfig.label}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Document Viewer */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Identity Document</CardTitle>
              <CardDescription>{detail.documentType}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border bg-muted/30">
                <img
                  src={detail.documentUrl}
                  alt={`${detail.documentType} for ${detail.userName}`}
                  className="h-auto w-full object-contain"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Liveness Selfie</CardTitle>
              <CardDescription>Photo verification</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border bg-muted/30">
                <img
                  src={detail.selfieUrl}
                  alt={`Selfie for ${detail.userName}`}
                  className="mx-auto h-auto max-h-[300px] object-contain"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: User Info + Actions */}
        <div className="flex flex-col gap-4">
          {/* User info card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Applicant Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <InfoRow icon={User} label="Full Name" value={detail.user.fullName} />
              <InfoRow icon={Mail} label="Email" value={detail.user.email} />
              <InfoRow icon={Phone} label="Phone" value={detail.user.phone} />
              <InfoRow icon={MapPin} label="Country" value={detail.user.country} />
              <InfoRow
                icon={Calendar}
                label="Date of Birth"
                value={new Date(detail.user.dateOfBirth).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              />
              <InfoRow
                icon={Shield}
                label="Account Status"
                value={detail.user.accountStatus}
              />
              <InfoRow
                icon={Calendar}
                label="Member Since"
                value={new Date(detail.user.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              />
            </CardContent>
          </Card>

          {/* Submission info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Submission Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Submitted</span>
                <span>
                  {new Date(detail.submittedAt).toLocaleString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              {detail.reviewedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reviewed</span>
                  <span>
                    {new Date(detail.reviewedAt).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}
              {detail.reviewedBy && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reviewed By</span>
                  <span>{detail.reviewedBy}</span>
                </div>
              )}
              {detail.rejectionReason && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rejection Reason</span>
                  <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
                    {KYC_REJECTION_REASONS.find((r) => r.code === detail.rejectionReason)?.label ??
                      detail.rejectionReason}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          {isPending && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Verification Actions</CardTitle>
                <CardDescription>
                  Review the documents above and take action
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {/* Rejection reason selector */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">
                    Rejection Reason (if rejecting)
                  </label>
                  <Select
                    value={rejectionReason}
                    onValueChange={(v) => setRejectionReason(v ?? "")}
                    items={KYC_REJECTION_REASONS.map((r) => ({
                      label: r.label,
                      value: r.code,
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a reason..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {KYC_REJECTION_REASONS.map((reason) => (
                          <SelectItem key={reason.code} value={reason.code}>
                            {reason.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    className="flex-1 gap-2"
                    onClick={() => approveMutation.mutate()}
                    disabled={approveMutation.isPending}
                  >
                    {approveMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="size-4" />
                    )}
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 gap-2"
                    onClick={() => rejectMutation.mutate()}
                    disabled={rejectMutation.isPending || !rejectionReason}
                  >
                    {rejectMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <XCircle className="size-4" />
                    )}
                    Reject
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => requestInfoMutation.mutate()}
                    disabled={requestInfoMutation.isPending}
                  >
                    {requestInfoMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Info className="size-4" />
                    )}
                    Request Info
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-auto font-medium">{value}</span>
    </div>
  );
}
