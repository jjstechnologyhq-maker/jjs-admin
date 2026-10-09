"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Scale,
  Plus,
  Trash2,
  Loader2,
  UserSearch,
  RotateCcw,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useAuditedMutation } from "@/hooks/use-audited-mutation";
import { transactionLimitsApi } from "@/api/transaction-limits";
import { usersApi } from "@/api/users";
import type {
  LimitKind,
  LimitRange,
  SetTransactionLimitsRequest,
  TransactionLimitsDocument,
  TransactionLimitsView,
} from "@/api/schema";

const KINDS: LimitKind[] = ["swap", "transfer", "withdrawal"];

const KIND_LABEL: Record<LimitKind, string> = {
  swap: "Swap",
  transfer: "Transfer",
  withdrawal: "Withdrawal",
};

const KEY_HINT: Record<LimitKind, string> = {
  swap: "Directed pair, e.g. ngn_usdt",
  transfer: "Currency ticker, e.g. ngn",
  withdrawal: "Currency ticker, e.g. ngn",
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface LimitRow {
  kind: LimitKind;
  key: string;
  min?: number;
  max?: number;
}

/** Selected user — either from a search result or a pasted UUID. */
interface SelectedUser {
  id: string;
  label: string;
  email?: string;
}

function flattenLimits(doc: TransactionLimitsDocument | undefined): LimitRow[] {
  if (!doc) return [];
  const rows: LimitRow[] = [];
  for (const kind of KINDS) {
    const entries = doc[kind];
    if (!entries) continue;
    for (const [key, range] of Object.entries(entries)) {
      rows.push({ kind, key, min: range?.min, max: range?.max });
    }
  }
  return rows;
}

function hasEntry(
  doc: TransactionLimitsDocument | undefined,
  kind: LimitKind,
  key: string,
): boolean {
  return Boolean(doc?.[kind]?.[key]);
}

function formatBound(value?: number): string {
  return value === undefined || value === null ? "—" : value.toLocaleString();
}

export default function TransactionLimitsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <Scale className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Transaction Limits</h1>
          <p className="text-sm text-muted-foreground">
            Min/max bounds on swaps, transfers, and withdrawals
          </p>
        </div>
      </div>

      <UserLimitsCard />
      <GeneralLimitsCard />
    </div>
  );
}

// ── Platform defaults ───────────────────────────────────────────────────────

function GeneralLimitsCard() {
  const [open, setOpen] = React.useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["transaction-limits", "general"],
    queryFn: () => transactionLimitsApi.getGeneral(),
  });

  const save = useAuditedMutation<TransactionLimitsView, SetTransactionLimitsRequest>({
    action: "set_general_transaction_limits",
    mutationFn: (body) => transactionLimitsApi.setGeneral(body),
    invalidateKeys: [["transaction-limits", "general"]],
    successMessage: "Platform limits updated",
  });

  const remove = useAuditedMutation<
    TransactionLimitsView,
    { kind: LimitKind; key: string }
  >({
    action: "delete_general_transaction_limit",
    mutationFn: ({ kind, key }) => transactionLimitsApi.removeGeneralEntry(kind, key),
    invalidateKeys: [["transaction-limits", "general"]],
    successMessage: "Limit entry removed",
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-lg">Platform Defaults</CardTitle>
          <CardDescription>
            Apply to every user who has no override of their own
          </CardDescription>
        </div>
        <Button size="sm" className="gap-1" onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Set limit
        </Button>
      </CardHeader>
      <CardContent>
        <LimitTable
          rows={flattenLimits(data?.limits)}
          isLoading={isLoading}
          emptyLabel="No platform limits configured"
          onDelete={(row) => remove.mutate({ kind: row.kind, key: row.key })}
          deleting={remove.isPending}
        />
      </CardContent>

      <SetLimitDialog
        open={open}
        onOpenChange={setOpen}
        title="Set platform limit"
        description="Merges into the platform-wide config, changing only the pair you name."
        onSubmit={(body) => save.mutateAsync(body)}
      />
    </Card>
  );
}

// ── Per-user limits ─────────────────────────────────────────────────────────

function UserLimitsCard() {
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState<SelectedUser | null>(null);
  const [open, setOpen] = React.useState(false);

  const debounced = useDebouncedValue(search.trim(), 350);
  const { data: results, isFetching } = useQuery({
    queryKey: ["users", "limit-search", debounced],
    queryFn: () => usersApi.list({ q: debounced, limit: 8 }),
    enabled: debounced.length >= 2 && !selected,
  });

  const userId = selected?.id ?? "";

  const overridesQuery = useQuery({
    queryKey: ["transaction-limits", "user", userId],
    queryFn: () => transactionLimitsApi.getUser(userId),
    enabled: Boolean(userId),
  });
  const effectiveQuery = useQuery({
    queryKey: ["transaction-limits", "effective", userId],
    queryFn: () => transactionLimitsApi.getEffective(userId),
    enabled: Boolean(userId),
  });

  const invalidateKeys = [
    ["transaction-limits", "user", userId],
    ["transaction-limits", "effective", userId],
  ];

  const save = useAuditedMutation<TransactionLimitsView, SetTransactionLimitsRequest>({
    action: "set_user_transaction_limits",
    mutationFn: (body) => transactionLimitsApi.setUser(userId, body),
    invalidateKeys,
    successMessage: "User limits updated",
  });
  const clearAll = useAuditedMutation<TransactionLimitsView, void>({
    action: "clear_user_transaction_limits",
    mutationFn: () => transactionLimitsApi.clearUser(userId),
    invalidateKeys,
    successMessage: "Overrides cleared",
  });
  const clearKind = useAuditedMutation<TransactionLimitsView, LimitKind>({
    action: "clear_user_transaction_limit_kind",
    mutationFn: (kind) => transactionLimitsApi.clearUserKind(userId, kind),
    invalidateKeys,
    successMessage: "Overrides cleared",
  });
  const clearEntry = useAuditedMutation<
    TransactionLimitsView,
    { kind: LimitKind; key: string }
  >({
    action: "clear_user_transaction_limit_entry",
    mutationFn: ({ kind, key }) => transactionLimitsApi.clearUserEntry(userId, kind, key),
    invalidateKeys,
    successMessage: "Override removed",
  });

  const userOverrides = overridesQuery.data?.limits;
  const effective = effectiveQuery.data?.effective;

  const kindsWithOverrides = KINDS.filter(
    (k) => userOverrides?.[k] && Object.keys(userOverrides[k]).length > 0,
  );

  const trimmed = search.trim();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">User Limits</CardTitle>
        <CardDescription>
          Look up a user to inspect their effective limits and manage overrides
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="relative">
          <UserSearch className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search by email, name, phone, or paste a user ID"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (selected) setSelected(null);
            }}
          />
        </div>

        {trimmed.length >= 2 && !selected && (
          <div className="overflow-hidden rounded-lg border">
            {isFetching && !results ? (
              <div className="p-3">
                <Skeleton className="h-5 w-full" />
              </div>
            ) : results?.data.length ? (
              results.data.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    setSelected({ id: u.id, label: u.fullName || u.email, email: u.email });
                    setSearch(u.email);
                  }}
                  className="flex w-full items-center justify-between border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-muted/50"
                >
                  <span className="font-medium">{u.fullName || u.email}</span>
                  <span className="text-xs text-muted-foreground">{u.email}</span>
                </button>
              ))
            ) : (
              <p className="p-3 text-sm text-muted-foreground">No users found.</p>
            )}
          </div>
        )}

        {!selected && UUID_RE.test(trimmed) && (
          <Button
            variant="outline"
            size="sm"
            className="w-fit gap-1"
            onClick={() => setSelected({ id: trimmed, label: "User ID" })}
          >
            <UserSearch className="size-4" />
            Use user ID {trimmed.slice(0, 8)}…
          </Button>
        )}

        {selected && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 px-4 py-3">
              <div className="flex flex-col">
                <span className="text-sm font-medium">{selected.label}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {selected.email ? `${selected.email} · ${selected.id}` : selected.id}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1"
                onClick={() => {
                  setSelected(null);
                  setSearch("");
                }}
              >
                <RotateCcw className="size-3.5" />
                Change
              </Button>
            </div>

            <section className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Effective limits</h3>
                <span className="text-xs text-muted-foreground">
                  Platform defaults with this user&apos;s overrides applied
                </span>
              </div>
              <LimitTable
                rows={flattenLimits(effective)}
                isLoading={effectiveQuery.isLoading}
                emptyLabel="No limits resolve for this user"
                showSource={(row) =>
                  hasEntry(userOverrides, row.kind, row.key) ? (
                    <Badge
                      variant="outline"
                      className="border-blue-500/20 bg-blue-500/10 text-blue-600"
                    >
                      Override
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Default
                    </Badge>
                  )
                }
              />
            </section>

            <section className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">Overrides</h3>
                <div className="flex flex-wrap items-center gap-2">
                  {kindsWithOverrides.map((k) => (
                    <Button
                      key={k}
                      variant="outline"
                      size="sm"
                      onClick={() => clearKind.mutate(k)}
                      disabled={clearKind.isPending}
                    >
                      Clear {KIND_LABEL[k].toLowerCase()}
                    </Button>
                  ))}
                  <Button
                    size="sm"
                    className="gap-1"
                    onClick={() => setOpen(true)}
                    disabled={!userId}
                  >
                    <Plus className="size-4" />
                    Add override
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-muted-foreground hover:text-destructive"
                    onClick={() => clearAll.mutate()}
                    disabled={clearAll.isPending || kindsWithOverrides.length === 0}
                  >
                    <Trash2 className="size-4" />
                    Clear all
                  </Button>
                </div>
              </div>
              <LimitTable
                rows={flattenLimits(userOverrides)}
                isLoading={overridesQuery.isLoading}
                emptyLabel="No overrides — this user runs entirely on platform defaults"
                onDelete={(row) => clearEntry.mutate({ kind: row.kind, key: row.key })}
                deleting={clearEntry.isPending}
              />
            </section>

            <SetLimitDialog
              open={open}
              onOpenChange={setOpen}
              title="Add or override a limit"
              description={`Applies only to ${selected.email ?? selected.label}. Unspecified bounds fall back to platform defaults.`}
              onSubmit={(body) => save.mutateAsync(body)}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Shared table + dialog ───────────────────────────────────────────────────

function LimitTable({
  rows,
  isLoading,
  emptyLabel,
  onDelete,
  deleting,
  showSource,
}: {
  rows: LimitRow[];
  isLoading: boolean;
  emptyLabel: string;
  onDelete?: (row: LimitRow) => void;
  deleting?: boolean;
  showSource?: (row: LimitRow) => React.ReactNode;
}) {
  const columns = 4 + (showSource ? 1 : 0) + (onDelete ? 1 : 0);

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>Kind</TableHead>
            <TableHead>Key</TableHead>
            <TableHead className="text-right">Min</TableHead>
            <TableHead className="text-right">Max</TableHead>
            {showSource && <TableHead>Source</TableHead>}
            {onDelete && <TableHead className="w-10" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: columns }).map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : rows.length ? (
            rows.map((row) => (
              <TableRow key={`${row.kind}:${row.key}`}>
                <TableCell>
                  <Badge variant="outline">{KIND_LABEL[row.kind]}</Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">{row.key}</TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatBound(row.min)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatBound(row.max)}
                </TableCell>
                {showSource && <TableCell>{showSource(row)}</TableCell>}
                {onDelete && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      onClick={() => onDelete(row)}
                      disabled={deleting}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns}
                className="h-20 text-center text-sm text-muted-foreground"
              >
                {emptyLabel}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function SetLimitDialog({
  open,
  onOpenChange,
  title,
  description,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  onSubmit: (body: SetTransactionLimitsRequest) => Promise<unknown>;
}) {
  const [kind, setKind] = React.useState<LimitKind>("swap");
  const [key, setKey] = React.useState("");
  const [min, setMin] = React.useState("");
  const [max, setMax] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const minNum = min.trim() === "" ? undefined : Number(min);
  const maxNum = max.trim() === "" ? undefined : Number(max);

  const valid =
    key.trim().length > 0 &&
    (minNum !== undefined || maxNum !== undefined) &&
    (minNum === undefined || Number.isFinite(minNum)) &&
    (maxNum === undefined || Number.isFinite(maxNum)) &&
    (minNum === undefined || maxNum === undefined || minNum <= maxNum);

  async function handleSubmit() {
    if (!valid) return;
    const range: LimitRange = {};
    if (minNum !== undefined) range.min = minNum;
    if (maxNum !== undefined) range.max = maxNum;

    const limits: TransactionLimitsDocument = {};
    limits[kind] = { [key.trim()]: range };

    setSubmitting(true);
    try {
      await onSubmit({ limits, mode: "merge" });
      setKey("");
      setMin("");
      setMax("");
      onOpenChange(false);
    } catch {
      // The mutation hook already surfaced an error toast.
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Kind</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as LimitKind)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KINDS.map((k) => (
                  <SelectItem key={k} value={k}>
                    {KIND_LABEL[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="limit-key">Key</Label>
            <Input
              id="limit-key"
              placeholder={KEY_HINT[kind]}
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="limit-min">Minimum (optional)</Label>
              <Input
                id="limit-min"
                type="number"
                step="any"
                value={min}
                onChange={(e) => setMin(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="limit-max">Maximum (optional)</Label>
              <Input
                id="limit-max"
                type="number"
                step="any"
                value={max}
                onChange={(e) => setMax(e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Merge mode: naming only a minimum makes this entry min-only, discarding any
            stored maximum. Use the row&apos;s delete action to remove an entry outright.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!valid || submitting}>
            {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
