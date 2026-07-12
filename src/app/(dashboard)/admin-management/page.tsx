"use client";

import * as React from "react";
import {
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  MoreHorizontal,
  Mail,
  Loader2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, ADMIN_STATUS } from "@/components/status-badge";
import { CursorPagination } from "@/components/cursor-pagination";
import { useCursorList } from "@/hooks/use-cursor-list";
import { adminApi } from "@/api/admin";
import type { AdminProfile, AdminRole, AdminStatus } from "@/api/schema";
import { useAuthStore } from "@/stores/auth-store";
import { useAuditedMutation } from "@/hooks/use-audited-mutation";

const ROLES: AdminRole[] = [
  "SUPER_ADMIN",
  "COMPLIANCE_OFFICER",
  "FINANCE_MANAGER",
  "CUSTOMER_SUPPORT",
];
const STATUS_TABS: (AdminStatus | "ALL")[] = [
  "ALL",
  "ACTIVE",
  "PENDING",
  "SUSPENDED",
  "DEACTIVATED",
];

export default function AdminManagementPage() {
  const [status, setStatus] = React.useState<AdminStatus | "ALL">("ALL");

  const filters = { status: status === "ALL" ? undefined : status };
  const list = useCursorList({
    queryKey: ["admins", "list"],
    resetToken: JSON.stringify(filters),
    limit: 50,
    fetcher: ({ cursor, limit }) => adminApi.list({ ...filters, cursor, limit }),
  });

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <ShieldCheck className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Admin Management</h1>
            <p className="text-sm text-muted-foreground">
              Manage dashboard administrators, roles, and MFA
            </p>
          </div>
        </div>
        <InviteDialog />
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((s) => (
          <Button
            key={s}
            variant={status === s ? "default" : "outline"}
            size="sm"
            onClick={() => setStatus(s)}
          >
            {s === "ALL" ? "All" : ADMIN_STATUS[s]?.label ?? s}
          </Button>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Administrator</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>MFA</TableHead>
              <TableHead>Last login</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : list.items.length ? (
              list.items.map((admin) => <AdminRow key={admin.id} admin={admin} />)
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <ShieldCheck className="size-8 opacity-40" />
                    <p className="text-sm font-medium">No administrators found</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <CursorPagination
        page={list.page}
        canPrev={list.canPrev}
        canNext={list.canNext}
        onPrev={list.prev}
        onNext={list.next}
        total={list.meta?.total}
        isFetching={list.isFetching}
        itemLabel="admin"
      />
    </div>
  );
}

function AdminRow({ admin }: { admin: AdminProfile }) {
  const currentEmail = useAuthStore((s) => s.session?.email);
  const isSelf = currentEmail === admin.email;
  const [mfaOpen, setMfaOpen] = React.useState(false);
  const [roleOpen, setRoleOpen] = React.useState(false);

  const setStatus = useAuditedMutation({
    action: "update_admin_status",
    mutationFn: (next: AdminStatus) => adminApi.update(admin.id, { status: next }),
    invalidateKeys: [["admins", "list"]],
    successMessage: "Admin updated",
  });
  const resend = useAuditedMutation({
    action: "resend_admin_invite",
    mutationFn: () => adminApi.resendInvite(admin.id),
    invalidateKeys: [["admins", "list"]],
    successMessage: "Invite resent",
  });

  return (
    <TableRow>
      <TableCell className="font-medium">{admin.email}</TableCell>
      <TableCell>
        <Badge variant="outline">{admin.role.replace(/_/g, " ")}</Badge>
      </TableCell>
      <TableCell>
        <StatusBadge value={admin.status} config={ADMIN_STATUS} />
      </TableCell>
      <TableCell>
        {admin.mfaEnrolled ? (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600">
            <ShieldCheck className="size-3.5" /> Enrolled
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-sm text-amber-600">
            <ShieldAlert className="size-3.5" /> None
          </span>
        )}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {admin.lastLoginAt
          ? new Date(admin.lastLoginAt).toLocaleString("en-GB", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Never"}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="ghost" size="icon" className="size-8" disabled={isSelf}>
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Admin actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setRoleOpen(true)}>Change role</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setMfaOpen(true)}>Reset MFA</DropdownMenuItem>
            {admin.status === "PENDING" && (
              <DropdownMenuItem onClick={() => resend.mutate()}>Resend invite</DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {admin.status === "ACTIVE" ? (
              <DropdownMenuItem
                className="text-orange-600 focus:text-orange-600"
                onClick={() => setStatus.mutate("SUSPENDED")}
              >
                Suspend
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => setStatus.mutate("ACTIVE")}>
                Reactivate
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={() => setStatus.mutate("DEACTIVATED")}
            >
              Deactivate
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ResetMfaDialog adminId={admin.id} open={mfaOpen} onOpenChange={setMfaOpen} />
        <ChangeRoleDialog
          adminId={admin.id}
          current={admin.role}
          open={roleOpen}
          onOpenChange={setRoleOpen}
        />
      </TableCell>
    </TableRow>
  );
}

function InviteDialog() {
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<AdminRole>("CUSTOMER_SUPPORT");

  const mutation = useAuditedMutation({
    action: "invite_admin",
    mutationFn: () => adminApi.invite({ email, role }),
    invalidateKeys: [["admins", "list"]],
    successMessage: "Invitation sent",
    onSuccess: () => {
      setOpen(false);
      setEmail("");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button className="gap-2">
          <UserPlus className="size-4" />
          Invite Admin
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite administrator</DialogTitle>
          <DialogDescription>
            Sends an activation email. They set a password and enroll MFA.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="invite-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                id="invite-email"
                type="email"
                className="pl-8"
                placeholder="colleague@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as AdminRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => email && mutation.mutate()} disabled={!email || mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Send invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResetMfaDialog({
  adminId,
  open,
  onOpenChange,
}: {
  adminId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [note, setNote] = React.useState("");
  const mutation = useAuditedMutation({
    action: "reset_admin_mfa",
    mutationFn: () => adminApi.resetMfa(adminId, { offlineVerificationNote: note }),
    invalidateKeys: [["admins", "list"]],
    successMessage: "MFA reset",
    onSuccess: () => {
      onOpenChange(false);
      setNote("");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset MFA</DialogTitle>
          <DialogDescription>
            Document how you verified this admin&apos;s identity out-of-band.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="e.g. Identity verified via Zoom call on 2026-07-03"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => note.trim() && mutation.mutate()} disabled={!note.trim() || mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Reset MFA
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ChangeRoleDialog({
  adminId,
  current,
  open,
  onOpenChange,
}: {
  adminId: string;
  current: AdminRole;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [role, setRole] = React.useState<AdminRole>(current);
  const mutation = useAuditedMutation({
    action: "update_admin_role",
    // Always confirm — active JWTs keep the old role until they expire.
    mutationFn: () => adminApi.update(adminId, { role, confirmRoleChange: true }),
    invalidateKeys: [["admins", "list"]],
    successMessage: "Role updated",
    onSuccess: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change role</DialogTitle>
          <DialogDescription>
            Existing sessions keep the old role until their tokens expire.
          </DialogDescription>
        </DialogHeader>
        <Select value={role} onValueChange={(v) => setRole(v as AdminRole)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {r.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={role === current || mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
