"use client";

import * as React from "react";
import { History, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { CursorPagination } from "@/components/cursor-pagination";
import { useCursorList } from "@/hooks/use-cursor-list";
import { analyticsApi } from "@/api/analytics";

export default function AuditLogPage() {
  const [action, setAction] = React.useState("");
  const [entityType, setEntityType] = React.useState("");
  const [debounced, setDebounced] = React.useState({ action: "", entityType: "" });

  React.useEffect(() => {
    const t = setTimeout(
      () => setDebounced({ action: action.trim(), entityType: entityType.trim() }),
      350,
    );
    return () => clearTimeout(t);
  }, [action, entityType]);

  const filters = {
    action: debounced.action || undefined,
    entityType: debounced.entityType || undefined,
  };

  const list = useCursorList({
    queryKey: ["audit", "log"],
    resetToken: JSON.stringify(filters),
    limit: 50,
    fetcher: ({ cursor, limit }) => analyticsApi.auditLog({ ...filters, cursor, limit }),
  });

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <History className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">System Audit Log</h1>
          <p className="text-sm text-muted-foreground">
            Immutable record of all administrative actions
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Filter by action (e.g. UPDATE_USER_STATUS)"
            className="pl-8"
            value={action}
            onChange={(e) => setAction(e.target.value)}
          />
        </div>
        <Input
          placeholder="Filter by entity type (e.g. User)"
          className="w-full sm:w-56"
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Entity ID</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : list.items.length ? (
              list.items.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(e.createdAt).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{e.adminId}</TableCell>
                  <TableCell className="text-sm font-medium">{e.action}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {e.entityType}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {e.entityId ?? "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{e.ipAddress}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <History className="size-8 opacity-40" />
                    <p className="text-sm font-medium">No audit entries found</p>
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
        itemLabel="event"
      />
    </div>
  );
}
