"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Info,
  User,
  Mail,
  Phone,
  RefreshCw,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  StatusBadge,
  KYC_STATUS,
  USER_ACCOUNT_STATUS,
} from "@/components/status-badge";
import { kycApi, KYC_REJECTION_REASONS } from "@/api/kyc";
import type { KycRejectionReason } from "@/api/schema";
import { useAuditedMutation } from "@/hooks/use-audited-mutation";

export default function KycDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = use(params);
  const router = useRouter();
  const [rejectionReason, setRejectionReason] = useState<KycRejectionReason | "">("");

  const {
    data: detail,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["kyc", "detail", userId],
    queryFn: () => kycApi.getDetail(userId),
    // Pre-signed doc URLs live 60s — don't serve stale ones from cache.
    staleTime: 0,
    gcTime: 0,
  });

  const invalidate = [["kyc", "queue"], ["kyc", "detail", userId]] as const;

  const approve = useAuditedMutation({
    action: "approve_kyc",
    mutationFn: () => kycApi.updateStatus(userId, { status: "APPROVED" }),
    invalidateKeys: [...invalidate],
    successMessage: "KYC approved",
  });
  const requestInfo = useAuditedMutation({
    action: "request_kyc_info",
    mutationFn: () => kycApi.updateStatus(userId, { status: "INFO_REQUIRED" }),
    invalidateKeys: [...invalidate],
    successMessage: "Information requested from user",
  });
  const reject = useAuditedMutation({
    action: "reject_kyc",
    mutationFn: () =>
      kycApi.updateStatus(userId, {
        status: "REJECTED",
        rejectionReason: rejectionReason as KycRejectionReason,
      }),
    invalidateKeys: [...invalidate],
    successMessage: "KYC rejected",
  });

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <Skeleton className="h-8 w-64" />
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

  const canAct = detail.status === "PENDING" || detail.status === "INFO_REQUIRED";
  const busy = approve.isPending || reject.isPending || requestInfo.isPending;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/kyc")}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">
                {detail.user?.fullName ?? "KYC submission"}
              </h1>
              <StatusBadge value={detail.status} config={KYC_STATUS} />
            </div>
            <p className="font-mono text-xs text-muted-foreground">{detail.userId}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`mr-2 size-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh documents
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Identity Document</CardTitle>
              <CardDescription>Pre-signed URL — expires 60s after load</CardDescription>
            </CardHeader>
            <CardContent>
              <DocImage url={detail.idDocumentUrl} alt="ID document" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Liveness Selfie</CardTitle>
            </CardHeader>
            <CardContent>
              <DocImage url={detail.selfieUrl} alt="Selfie" />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Applicant</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {detail.user ? (
                <>
                  <InfoRow icon={User} label="Full name" value={detail.user.fullName} />
                  <InfoRow icon={Mail} label="Email" value={detail.user.email} />
                  <InfoRow icon={Phone} label="Phone" value={detail.user.phone} />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Account</span>
                    <StatusBadge
                      value={detail.user.accountStatus}
                      config={USER_ACCOUNT_STATUS}
                    />
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  User platform is temporarily unavailable.
                </p>
              )}
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Submitted</span>
                <span>{new Date(detail.createdAt).toLocaleString("en-GB")}</span>
              </div>
              {detail.rejectionReason && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rejection reason</span>
                  <span className="font-medium">
                    {KYC_REJECTION_REASONS.find((r) => r.code === detail.rejectionReason)?.label ??
                      detail.rejectionReason}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {canAct && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Review actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Rejection reason (if rejecting)</label>
                  <Select
                    value={rejectionReason}
                    onValueChange={(v) => setRejectionReason(v as KycRejectionReason)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a reason…" />
                    </SelectTrigger>
                    <SelectContent>
                      {KYC_REJECTION_REASONS.map((r) => (
                        <SelectItem key={r.code} value={r.code}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    className="flex-1 gap-2"
                    onClick={() => approve.mutate()}
                    disabled={busy}
                  >
                    {approve.isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 gap-2"
                    onClick={() => reject.mutate()}
                    disabled={busy || !rejectionReason}
                  >
                    {reject.isPending ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />}
                    Reject
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => requestInfo.mutate()}
                    disabled={busy}
                  >
                    {requestInfo.isPending ? <Loader2 className="size-4 animate-spin" /> : <Info className="size-4" />}
                    Request info
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

function DocImage({ url, alt }: { url?: string | null; alt: string }) {
  if (!url) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border bg-muted/30 text-sm text-muted-foreground">
        No document available
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-lg border bg-muted/30">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={alt} className="mx-auto h-auto max-h-[320px] object-contain" />
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
