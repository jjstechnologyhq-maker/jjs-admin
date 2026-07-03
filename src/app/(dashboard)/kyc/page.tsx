"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, KYC_STATUS } from "@/components/status-badge";
import { CursorPagination } from "@/components/cursor-pagination";
import { useCursorList } from "@/hooks/use-cursor-list";
import { kycApi } from "@/api/kyc";
import type { KycQueueStatusFilter } from "@/api/schema";

const TABS: { label: string; value: KycQueueStatusFilter[] }[] = [
  { label: "Review queue", value: ["PENDING", "INFO_REQUIRED"] },
  { label: "Pending", value: ["PENDING"] },
  { label: "Info required", value: ["INFO_REQUIRED"] },
  { label: "Approved", value: ["APPROVED"] },
  { label: "Rejected", value: ["REJECTED"] },
];

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "Just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function KycQueuePage() {
  const router = useRouter();
  const [tab, setTab] = React.useState(0);
  const status = TABS[tab].value;

  const list = useCursorList({
    queryKey: ["kyc", "queue"],
    resetToken: JSON.stringify(status),
    limit: 50,
    fetcher: ({ cursor, limit }) => kycApi.getQueue({ status, cursor, limit }),
  });

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <FileCheck className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">KYC Verification Queue</h1>
          <p className="text-sm text-muted-foreground">
            Review and verify user identity submissions
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t, i) => (
          <Button
            key={t.label}
            variant={tab === i ? "default" : "outline"}
            size="sm"
            onClick={() => setTab(i)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : list.items.length ? (
              list.items.map((item) => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() => router.push(`/kyc/${item.userId}`)}
                >
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {item.userId}
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={item.status} config={KYC_STATUS} />
                  </TableCell>
                  <TableCell className="text-sm">{relativeTime(item.createdAt)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(item.updatedAt).toLocaleDateString("en-GB")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      Review →
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <FileCheck className="size-8 opacity-40" />
                    <p className="text-sm font-medium">No submissions</p>
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
        itemLabel="submission"
      />
    </div>
  );
}
