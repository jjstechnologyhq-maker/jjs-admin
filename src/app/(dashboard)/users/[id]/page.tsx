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
  Smartphone,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  StatusBadge,
  USER_ACCOUNT_STATUS,
  KYC_STATUS,
} from "@/components/status-badge";
import { usersApi } from "@/api/users";
import type { UserAccountStatus } from "@/api/schema";
import { useAuditedMutation } from "@/hooks/use-audited-mutation";
import { formatAmount, formatMoney } from "@/lib/money";

const STATUS_OPTIONS: UserAccountStatus[] = ["ACTIVE", "FROZEN", "SHADOW_BANNED"];

export default function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const { data: user, isLoading } = useQuery({
    queryKey: ["users", "detail", id],
    queryFn: () => usersApi.get(id),
  });

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
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

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/users")}>
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">{user.fullName}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <StatusBadge value={user.accountStatus} config={USER_ACCOUNT_STATUS} />
              <StatusBadge value={user.kycStatus} config={KYC_STATUS} />
            </div>
          </div>
        </div>
        <ChangeStatusDialog userId={id} current={user.accountStatus} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <InfoRow icon={User} label="Full name" value={user.fullName} />
            <InfoRow icon={Mail} label="Email" value={user.email} />
            <InfoRow icon={Phone} label="Phone" value={user.phone} />
            <InfoRow
              icon={Calendar}
              label="Member since"
              value={new Date(user.createdAt).toLocaleDateString("en-GB")}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Balances</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {user.fiatBalances.length === 0 && user.cryptoBalances.length === 0 && (
              <p className="text-sm text-muted-foreground">No balances</p>
            )}
            {user.fiatBalances.map((b) => (
              <div key={b.currency} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{b.currency}</span>
                <span className="font-mono font-medium">
                  {formatMoney(b.available, b.currency)}
                </span>
              </div>
            ))}
            {user.cryptoBalances.map((b) => (
              <div key={b.asset} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{b.asset}</span>
                <span className="text-right font-mono font-medium">
                  {formatAmount(b.available, b.asset)} {b.asset}
                  <span className="ml-2 text-xs text-muted-foreground">
                    (${formatAmount(b.usdValue, "USD")})
                  </span>
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Linked devices</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {user.deviceFingerprints.length === 0 && (
              <p className="text-sm text-muted-foreground">No devices on record</p>
            )}
            {user.deviceFingerprints.map((d) => (
              <div key={d.id} className="flex items-center gap-3 text-sm">
                <Smartphone className="size-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="font-medium">{d.deviceName}</span>
                  <span className="text-xs text-muted-foreground">
                    {d.platform} · last seen{" "}
                    {new Date(d.lastSeenAt).toLocaleDateString("en-GB")}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <NotesPanel userId={id} />
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
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function ChangeStatusDialog({
  userId,
  current,
}: {
  userId: string;
  current: UserAccountStatus;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<UserAccountStatus>(current);
  const [reason, setReason] = useState("");

  const mutation = useAuditedMutation({
    action: "update_user_status",
    mutationFn: () => usersApi.updateStatus(userId, { status, reason }),
    invalidateKeys: [
      ["users", "detail", userId],
      ["users", "list"],
    ],
    successMessage: "Account status updated",
    onSuccess: () => {
      setOpen(false);
      setReason("");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="outline" size="sm">
          Change status
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change account status</DialogTitle>
          <DialogDescription>
            A reason is required and recorded in the audit log.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <Select value={status} onValueChange={(v) => setStatus(v as UserAccountStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {USER_ACCOUNT_STATUS[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            placeholder="Reason (required)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!reason.trim()) {
                toast.error("A reason is required");
                return;
              }
              mutation.mutate();
            }}
            disabled={mutation.isPending}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NotesPanel({ userId }: { userId: string }) {
  const [content, setContent] = useState("");
  const { data: notes } = useQuery({
    queryKey: ["users", "notes", userId],
    queryFn: () => usersApi.listNotes(userId, { limit: 50 }),
  });

  const createNote = useAuditedMutation({
    action: "create_user_note",
    mutationFn: () => usersApi.createNote(userId, { content }),
    invalidateKeys: [["users", "notes", userId]],
    successMessage: "Note added",
    onSuccess: () => setContent(""),
  });

  const deleteNote = useAuditedMutation({
    action: "delete_user_note",
    mutationFn: (noteId: string) => usersApi.deleteNote(userId, noteId),
    invalidateKeys: [["users", "notes", userId]],
    successMessage: "Note deleted",
  });

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle className="text-base">Internal notes</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex flex-col gap-2">
          <Textarea
            placeholder="Add an internal note (never visible to the user)…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={2000}
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => content.trim() && createNote.mutate()}
              disabled={!content.trim() || createNote.isPending}
            >
              Add note
            </Button>
          </div>
        </div>

        <div className="flex flex-col divide-y">
          {(notes?.data ?? []).filter((n) => !n.deletedAt).length === 0 && (
            <p className="py-2 text-sm text-muted-foreground">No notes yet</p>
          )}
          {(notes?.data ?? [])
            .filter((n) => !n.deletedAt)
            .map((note) => (
              <div key={note.id} className="flex items-start justify-between gap-4 py-3">
                <div className="flex flex-col gap-1">
                  <p className="text-sm">{note.content}</p>
                  <span className="text-xs text-muted-foreground">
                    {note.adminEmail} ·{" "}
                    {new Date(note.createdAt).toLocaleString("en-GB", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => deleteNote.mutate(note.id)}
                  disabled={deleteNote.isPending}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
