import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Tone = "green" | "amber" | "red" | "blue" | "gray" | "purple";

const TONE: Record<Tone, string> = {
  green: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
  amber: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
  red: "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400",
  blue: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
  purple: "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400",
  gray: "bg-muted text-muted-foreground border-border",
};

export interface StatusMeta {
  label: string;
  tone: Tone;
}

/** Render a coloured status pill from a config map keyed by the raw enum value. */
export function StatusBadge<K extends string>({
  value,
  config,
  className,
}: {
  value: K;
  config: Record<K, StatusMeta>;
  className?: string;
}) {
  const meta = config[value];
  if (!meta) {
    return (
      <Badge variant="outline" className={cn(TONE.gray, className)}>
        {value}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className={cn(TONE[meta.tone], className)}>
      {meta.label}
    </Badge>
  );
}

// ── Shared config maps (extend as modules are built) ─────────────────────────

export const USER_ACCOUNT_STATUS: Record<string, StatusMeta> = {
  ACTIVE: { label: "Active", tone: "green" },
  FROZEN: { label: "Frozen", tone: "amber" },
  SHADOW_BANNED: { label: "Shadow Banned", tone: "red" },
};

export const KYC_STATUS: Record<string, StatusMeta> = {
  NOT_STARTED: { label: "Not Started", tone: "gray" },
  NOT_SUBMITTED: { label: "Not Submitted", tone: "gray" },
  PENDING: { label: "Pending", tone: "amber" },
  UNDER_REVIEW: { label: "Under Review", tone: "blue" },
  INFO_REQUIRED: { label: "Info Required", tone: "purple" },
  APPROVED: { label: "Approved", tone: "green" },
  REJECTED: { label: "Rejected", tone: "red" },
};

export const TRANSACTION_STATUS: Record<string, StatusMeta> = {
  PENDING: { label: "Pending", tone: "amber" },
  PROCESSING: { label: "Processing", tone: "blue" },
  CONFIRMED: { label: "Confirmed", tone: "blue" },
  SUCCESSFUL: { label: "Successful", tone: "green" },
  FAILED: { label: "Failed", tone: "red" },
  CANCELLED: { label: "Cancelled", tone: "gray" },
  REVERSED: { label: "Reversed", tone: "purple" },
};

export const WITHDRAWAL_STATUS: Record<string, StatusMeta> = {
  PENDING: { label: "Pending", tone: "amber" },
  APPROVED: { label: "Approved", tone: "green" },
  REJECTED: { label: "Rejected", tone: "red" },
  PROCESSING: { label: "Processing", tone: "blue" },
  COMPLETED: { label: "Completed", tone: "green" },
  FAILED: { label: "Failed", tone: "red" },
};

export const ADMIN_STATUS: Record<string, StatusMeta> = {
  ACTIVE: { label: "Active", tone: "green" },
  PENDING: { label: "Pending", tone: "amber" },
  SUSPENDED: { label: "Suspended", tone: "red" },
  DEACTIVATED: { label: "Deactivated", tone: "gray" },
};
