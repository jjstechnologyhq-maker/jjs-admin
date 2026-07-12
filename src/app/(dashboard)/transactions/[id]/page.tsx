"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Undo2, RefreshCw, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge, TRANSACTION_STATUS } from "@/components/status-badge";
import { transactionsApi } from "@/api/transactions";
import { useAuditedMutation } from "@/hooks/use-audited-mutation";
import { formatMoney } from "@/lib/money";

export default function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [reason, setReason] = useState("");

  const { data: tx, isLoading } = useQuery({
    queryKey: ["transactions", "detail", id],
    queryFn: () => transactionsApi.get(id),
  });

  const invalidate = [["transactions", "detail", id], ["transactions", "ledger"]] as const;

  const reverse = useAuditedMutation({
    action: "reverse_transaction",
    mutationFn: () => transactionsApi.reverse(id, { reason: reason || undefined }),
    invalidateKeys: [...invalidate],
    successMessage: "Reversal initiated",
  });
  const retry = useAuditedMutation({
    action: "retry_transaction",
    mutationFn: () => transactionsApi.retry(id, { reason: reason || undefined }),
    invalidateKeys: [...invalidate],
    successMessage: "Retry initiated",
  });

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!tx) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Transaction not found</p>
      </div>
    );
  }

  const isVas = tx.type === "VAS";
  const canReverse = isVas && (tx.status === "CONFIRMED" || tx.status === "SUCCESSFUL");
  const canRetry = isVas && (tx.status === "FAILED" || tx.status === "CANCELLED");
  const busy = reverse.isPending || retry.isPending;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/transactions")}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex items-center gap-2">
          <h1 className="font-mono text-lg font-semibold tracking-tight">{tx.id}</h1>
          <Badge variant="outline">{tx.type}</Badge>
          <StatusBadge value={tx.status} config={TRANSACTION_STATUS} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <Row label="Amount" value={formatMoney(tx.amount, tx.asset)} />
            <Row label="Fee" value={tx.fee ? formatMoney(tx.fee, tx.asset) : "—"} />
            <Row label="Asset" value={tx.asset} />
            <Row label="User ID" value={tx.userId} mono />
            {tx.referenceId && <Row label="Reference" value={tx.referenceId} mono />}
            {tx.description && <Row label="Description" value={tx.description} />}
            <Row label="Created" value={new Date(tx.createdAt).toLocaleString("en-GB")} />
            {tx.completedAt && (
              <Row label="Completed" value={new Date(tx.completedAt).toLocaleString("en-GB")} />
            )}
          </CardContent>
        </Card>

        {(canReverse || canRetry) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">VAS actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Textarea
                placeholder="Reason (optional, recorded in metadata)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <div className="flex gap-2">
                {canReverse && (
                  <Button
                    variant="destructive"
                    className="flex-1 gap-2"
                    onClick={() => reverse.mutate()}
                    disabled={busy}
                  >
                    {reverse.isPending ? <Loader2 className="size-4 animate-spin" /> : <Undo2 className="size-4" />}
                    Reverse
                  </Button>
                )}
                {canRetry && (
                  <Button
                    className="flex-1 gap-2"
                    onClick={() => retry.mutate()}
                    disabled={busy}
                  >
                    {retry.isPending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                    Retry
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono text-xs" : "font-medium"}>{value}</span>
    </div>
  );
}
