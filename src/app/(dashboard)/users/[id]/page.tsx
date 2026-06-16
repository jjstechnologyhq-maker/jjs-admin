"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Ban,
  Clock,
  Info,
  Activity,
  Shield,
  Tag,
  Hash,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import {
  usersApi,
  type UserProfile,
  getFullName,
  KYC_LEVEL_LABELS,
} from "@/api/users";
import type { AccountStatus, KycLevel } from "@/api/types";
import { useAuditedMutation } from "@/hooks/use-audited-mutation";

// ── Status configs — aligned with openapi.yaml ──────────────────────────────

const ACCOUNT_STATUS_CONFIG: Record<
  AccountStatus,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    className: string;
  }
> = {
  active: {
    label: "Active",
    icon: CheckCircle2,
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  suspended: {
    label: "Suspended",
    icon: Ban,
    className: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  },
  unverified: {
    label: "Unverified",
    icon: AlertCircle,
    className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
  "pending kyc": {
    label: "Pending KYC",
    icon: Clock,
    className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  },
  flagged: {
    label: "Flagged",
    icon: XCircle,
    className: "bg-red-500/10 text-red-600 border-red-500/20",
  },
};

const KYC_LEVEL_CONFIG: Record<
  KycLevel,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    className: string;
  }
> = {
  "0": { label: "Unverified", icon: XCircle, className: "text-red-600" },
  "1": { label: "Phone Verified", icon: Clock, className: "text-amber-600" },
  "2": { label: "BVN Verified", icon: Info, className: "text-blue-600" },
  "3": {
    label: "Fully Verified",
    icon: CheckCircle2,
    className: "text-emerald-600",
  },
};

// ── Component ────────────────────────────────────────────────────────────────

export default function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const { data: response, isLoading } = useQuery({
    queryKey: ["users", "detail", id],
    queryFn: () => usersApi.getUser(id),
  });

  const user = response?.data;

  const updateStatusMutation = useAuditedMutation({
    action: "update_user_status",
    mutationFn: (status: AccountStatus) => usersApi.updateStatus(id, status),
    invalidateKeys: [
      ["users", "detail", id],
      ["users", "list"],
    ],
    successMessage: "Account status updated",
  });

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-[200px] w-full rounded-lg" />
        <Skeleton className="h-[400px] w-full rounded-lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }

  const accountConfig = ACCOUNT_STATUS_CONFIG[user.status];
  const AccountIcon = accountConfig?.icon ?? AlertCircle;
  const kycConfig = KYC_LEVEL_CONFIG[user.kycLevel];
  const KycIcon = kycConfig?.icon ?? Info;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Back + Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/users")}
            className="mt-1"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              {getFullName(user)}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>{user.email}</span>
              <span className="hidden h-1 w-1 rounded-full bg-border sm:inline-block" />
              <span className="font-mono">{user.phone}</span>
              {user.jjsTag && (
                <>
                  <span className="hidden h-1 w-1 rounded-full bg-border sm:inline-block" />
                  <span>@{user.jjsTag}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {accountConfig && (
            <Badge
              variant="outline"
              className={`gap-1 ${accountConfig.className} text-sm px-2.5 py-0.5`}
            >
              <AccountIcon className="size-3.5" />
              {accountConfig.label}
            </Badge>
          )}

          <div className="flex gap-2">
            {user.status === "active" ? (
              <Button
                variant="outline"
                size="sm"
                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/50"
                onClick={() => updateStatusMutation.mutate("suspended")}
                disabled={updateStatusMutation.isPending}
              >
                Suspend
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                onClick={() => updateStatusMutation.mutate("active")}
                disabled={updateStatusMutation.isPending}
              >
                Reactivate
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
              onClick={() => updateStatusMutation.mutate("flagged")}
              disabled={
                user.status === "flagged" ||
                updateStatusMutation.isPending
              }
            >
              Flag
            </Button>
          </div>
        </div>
      </div>

      {/* Profile Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <InfoRow icon={User} label="First Name" value={user.firstName} />
            {user.middleName && (
              <InfoRow icon={User} label="Middle Name" value={user.middleName} />
            )}
            <InfoRow icon={User} label="Last Name" value={user.lastName} />
            <InfoRow icon={Mail} label="Email Address" value={user.email} />
            <InfoRow icon={Phone} label="Phone Number" value={user.phone} />
            {user.jjsTag && (
              <InfoRow icon={Tag} label="JJS Tag" value={`@${user.jjsTag}`} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Shield className="size-4" />
                <span>KYC Level</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                {kycConfig && (
                  <>
                    <KycIcon className={`size-4 ${kycConfig.className}`} />
                    <span className={kycConfig.className}>
                      {kycConfig.label}
                    </span>
                  </>
                )}
              </div>
            </div>
            <InfoRow icon={Hash} label="Role" value={user.role} />
            <InfoRow
              icon={Activity}
              label="PIN Set"
              value={user.pin ? "Yes" : "No"}
            />
            <InfoRow
              icon={Calendar}
              label="Member Since"
              value={new Date(user.createdAt).toLocaleDateString("en-GB")}
            />
            {user.lastLogin && (
              <InfoRow
                icon={Clock}
                label="Last Login"
                value={new Date(user.lastLogin).toLocaleString("en-GB", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              />
            )}
          </CardContent>
        </Card>
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
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Icon className="size-4 shrink-0" />
        <span>{label}</span>
      </div>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
