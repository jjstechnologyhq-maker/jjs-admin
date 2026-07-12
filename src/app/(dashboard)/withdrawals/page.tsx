"use client";

import * as React from "react";
import {
  ArrowDownToLine,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, WITHDRAWAL_STATUS } from "@/components/status-badge";
import { CursorPagination } from "@/components/cursor-pagination";
import { useCursorList } from "@/hooks/use-cursor-list";
import { financeApi } from "@/api/finance";
import type { WithdrawalStatus } from "@/api/schema";
import { useAuditedMutation } from "@/hooks/use-audited-mutation";
import { formatMoney } from "@/lib/money";

const STATUSES: WithdrawalStatus[] = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "PROCESSING",
  "COMPLETED",
];

export default function WithdrawalsPage() {
  const [status, setStatus] = React.useState<WithdrawalStatus | "ALL">("PENDING");
  const [highRiskOnly, setHighRiskOnly] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState("");

  const filters = {
    status: status === "ALL" ? undefined : status,
    isHighRisk: highRiskOnly ? true : undefined,
  };

  const list = useCursorList({
    queryKey: ["withdrawals", "queue"],
    resetToken: JSON.stringify(filters),
    limit: 50,
    fetcher: ({ cursor, limit }) => financeApi.listWithdrawals({ ...filters, cursor, limit }),
  });

  // Only PENDING withdrawals can be actioned.
  const pendingIds = list.items.filter((w) => w.status === "PENDING").map((w) => w.id);
  const selectedIds = [...selected];
  const clearSelection = () => setSelected(new Set());

  const approve = useAuditedMutation({
    action: "bulk_approve_withdrawals",
    mutationFn: () => financeApi.bulkApprove({ withdrawalIds: selectedIds }),
    invalidateKeys: [["withdrawals", "queue"]],
    onSuccess: (res) => {
      toast.success(`Approved ${res.processed}, failed ${res.failed}`);
      clearSelection();
    },
  });

  const reject = useAuditedMutation({
    action: "bulk_reject_withdrawals",
    mutationFn: () =>
      financeApi.bulkReject({ withdrawalIds: selectedIds, reason: rejectReason }),
    invalidateKeys: [["withdrawals", "queue"]],
    onSuccess: (res) => {
      toast.success(`Rejected ${res.processed}`);
      setRejectOpen(false);
      setRejectReason("");
      clearSelection();
    },
  });

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allPendingSelected = pendingIds.length > 0 && pendingIds.every((id) => selected.has(id));
  const toggleAll = () =>
    setSelected(allPendingSelected ? new Set() : new Set(pendingIds));

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <ArrowDownToLine className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Withdrawals Queue</h1>
          <p className="text-sm text-muted-foreground">
            Review and process withdrawal requests (Maker-Checker)
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={status} onValueChange={(v) => setStatus(v as WithdrawalStatus | "ALL")}>
          <SelectTrigger size="sm" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {WITHDRAWAL_STATUS[s]?.label ?? s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={highRiskOnly}
            onCheckedChange={(v) => setHighRiskOnly(!!v)}
          />
          High-risk only
        </label>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center justify-between rounded-md border border-primary/20 bg-primary/5 px-4 py-3">
          <div className="text-sm font-medium text-primary">
            {selected.size} selected
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="gap-2" onClick={() => approve.mutate()} disabled={approve.isPending}>
              {approve.isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              Approve
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="gap-2"
              onClick={() => setRejectOpen(true)}
              disabled={reject.isPending}
            >
              <XCircle className="size-4" />
              Reject
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allPendingSelected}
                  onCheckedChange={toggleAll}
                  disabled={pendingIds.length === 0}
                  aria-label="Select all pending"
                />
              </TableHead>
              <TableHead>User</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Requested</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : list.items.length ? (
              list.items.map((w) => (
                <TableRow key={w.id} data-state={selected.has(w.id) ? "selected" : undefined}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(w.id)}
                      onCheckedChange={() => toggle(w.id)}
                      disabled={w.status !== "PENDING"}
                      aria-label="Select row"
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{w.userId}</TableCell>
                  <TableCell className="font-medium">{formatMoney(w.amount, w.asset)}</TableCell>
                  <TableCell className="font-mono text-sm" title={w.destinationAddress}>
                    {w.destinationAddress.slice(0, 6)}…{w.destinationAddress.slice(-4)}
                  </TableCell>
                  <TableCell>
                    {w.isHighRisk ? (
                      <Badge variant="outline" className="gap-1 border-red-500/20 bg-red-500/10 text-red-600">
                        <ShieldAlert className="size-3" />
                        High
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={w.status} config={WITHDRAWAL_STATUS} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(w.createdAt).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <ArrowDownToLine className="size-8 opacity-40" />
                    <p className="text-sm font-medium">No withdrawals found</p>
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
        itemLabel="request"
      />

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {selected.size} withdrawal(s)</DialogTitle>
            <DialogDescription>
              A reason is required and stored on each withdrawal record.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Rejection reason (required)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => rejectReason.trim() && reject.mutate()}
              disabled={!rejectReason.trim() || reject.isPending}
            >
              {reject.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
