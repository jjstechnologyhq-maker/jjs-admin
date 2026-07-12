"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { StatusBadge, TRANSACTION_STATUS } from "@/components/status-badge";
import { CursorPagination } from "@/components/cursor-pagination";
import { useCursorList } from "@/hooks/use-cursor-list";
import { transactionsApi } from "@/api/transactions";
import type { TransactionType, TransactionStatus } from "@/api/schema";
import { formatMoney } from "@/lib/money";

const TYPES: TransactionType[] = [
  "DEPOSIT",
  "WITHDRAWAL",
  "TRANSFER",
  "SWAP",
  "REFUND",
  "FEE",
  "VAS",
];
const STATUSES: TransactionStatus[] = [
  "PENDING",
  "CONFIRMED",
  "SUCCESSFUL",
  "FAILED",
  "CANCELLED",
  "REJECTED",
  "ON_HOLD",
  "REVERSED",
];

export default function TransactionsPage() {
  const router = useRouter();
  const [type, setType] = React.useState<TransactionType | "ALL">("ALL");
  const [status, setStatus] = React.useState<TransactionStatus | "ALL">("ALL");
  const [exporting, setExporting] = React.useState(false);

  const filters = {
    type: type === "ALL" ? undefined : type,
    status: status === "ALL" ? undefined : status,
  };

  const list = useCursorList({
    queryKey: ["transactions", "ledger"],
    resetToken: JSON.stringify(filters),
    limit: 50,
    fetcher: ({ cursor, limit }) => transactionsApi.list({ ...filters, cursor, limit }),
  });

  const handleExport = async () => {
    setExporting(true);
    try {
      await transactionsApi.exportCsv(filters);
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <ArrowLeftRight className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Transaction Ledger</h1>
            <p className="text-sm text-muted-foreground">
              Unified view of all platform transactions
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
          {exporting ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Download className="mr-2 size-4" />
          )}
          Export CSV
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={type} onValueChange={(v) => setType(v as TransactionType | "ALL")}>
          <SelectTrigger size="sm" className="w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All types</SelectItem>
            {TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setStatus(v as TransactionStatus | "ALL")}>
          <SelectTrigger size="sm" className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {TRANSACTION_STATUS[s]?.label ?? s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>TX ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Fee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Time</TableHead>
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
              list.items.map((tx) => (
                <TableRow
                  key={tx.id}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() => router.push(`/transactions/${tx.id}`)}
                >
                  <TableCell className="font-mono text-xs text-muted-foreground" title={tx.id}>
                    {tx.id.slice(0, 8)}…
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{tx.type}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{formatMoney(tx.amount, tx.asset)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {tx.fee ? formatMoney(tx.fee, tx.asset) : "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={tx.status} config={TRANSACTION_STATUS} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(tx.createdAt).toLocaleString("en-GB", {
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
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <ArrowLeftRight className="size-8 opacity-40" />
                    <p className="text-sm font-medium">No transactions found</p>
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
        itemLabel="transaction"
      />
    </div>
  );
}
