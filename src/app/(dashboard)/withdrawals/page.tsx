"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";
import {
  ArrowDownToLine,
  Search,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ShieldAlert,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectGroup,
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

import { withdrawalsApi, type Withdrawal } from "@/api/withdrawals";
import type { WithdrawalStatus, RiskLevel } from "@/api/types";
import { useAuditedMutation } from "@/hooks/use-audited-mutation";
import { toast } from "sonner";

// ── Status badge config ──────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  WithdrawalStatus,
  { label: string; icon: React.ComponentType<{ className?: string }>; className: string }
> = {
  PENDING: { label: "Pending", icon: Clock, className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  APPROVED: { label: "Approved", icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  REJECTED: { label: "Rejected", icon: XCircle, className: "bg-red-500/10 text-red-600 border-red-500/20" },
  PROCESSING: { label: "Processing", icon: Loader2, className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  COMPLETED: { label: "Completed", icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  FAILED: { label: "Failed", icon: AlertTriangle, className: "bg-red-500/10 text-red-600 border-red-500/20" },
};

const RISK_CONFIG: Record<RiskLevel, { label: string; className: string }> = {
  LOW: { label: "Low", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  MEDIUM: { label: "Medium", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  HIGH: { label: "High", className: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  CRITICAL: { label: "Critical", className: "bg-red-500/10 text-red-600 border-red-500/20" },
};

// ── Column definitions ───────────────────────────────────────────────────────

const columns: ColumnDef<Withdrawal>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          disabled={row.original.status !== "PENDING"}
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "userName",
    header: "User",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.userName}</span>
        <span className="text-xs text-muted-foreground">{row.original.email}</span>
      </div>
    ),
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.amount} {row.original.asset}</span>
        <span className="text-xs text-muted-foreground">${row.original.usdValue.toLocaleString()}</span>
      </div>
    ),
  },
  {
    accessorKey: "destinationAddress",
    header: "Destination",
    cell: ({ row }) => {
      const address = row.original.destinationAddress;
      const displayAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
      return (
        <div className="flex flex-col">
          <span className="font-mono text-sm" title={address}>
            {displayAddress}
          </span>
          <span className="text-xs text-muted-foreground">{row.original.network}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const config = STATUS_CONFIG[row.original.status];
      const Icon = config.icon;
      return (
        <Badge variant="outline" className={`gap-1 ${config.className}`}>
          <Icon className="size-3" />
          {config.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "riskLevel",
    header: "Risk",
    cell: ({ row }) => {
      const config = RISK_CONFIG[row.original.riskLevel];
      const isHighRisk = row.original.riskLevel === "HIGH" || row.original.riskLevel === "CRITICAL";
      return (
        <div className="flex flex-col items-start gap-1">
          <Badge variant="outline" className={`${config.className}`}>
            {isHighRisk && <ShieldAlert className="mr-1 size-3" />}
            {config.label}
          </Badge>
          {row.original.makerCheckerRequired && (
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Maker-Checker</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "requestedAt",
    header: "Requested",
    cell: ({ row }) => {
      const date = new Date(row.original.requestedAt);
      return (
        <span className="text-sm text-muted-foreground">
          {date.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
        </span>
      );
    },
  },
];

// ── Main component ───────────────────────────────────────────────────────────

export default function WithdrawalsPage() {
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });
  const [rowSelection, setRowSelection] = React.useState({});

  const { data, isLoading } = useQuery({
    queryKey: ["withdrawals", "queue", statusFilter, pagination.pageIndex, pagination.pageSize],
    queryFn: () =>
      withdrawalsApi.getQueue({
        status: statusFilter === "ALL" ? undefined : (statusFilter as WithdrawalStatus),
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      }),
  });

  const tableData = React.useMemo(() => data?.data ?? [], [data]);

  const filteredData = React.useMemo(() => {
    if (!searchQuery) return tableData;
    const q = searchQuery.toLowerCase();
    return tableData.filter(
      (item) =>
        item.userName.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.destinationAddress.toLowerCase().includes(q)
    );
  }, [tableData, searchQuery]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, columnFilters, pagination, rowSelection },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: data?.pagination?.totalPages ?? -1,
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const hasSelection = selectedRows.length > 0;
  const selectedIds = selectedRows.map((row) => row.original.id);

  // Bulk mutations
  const bulkApproveMutation = useAuditedMutation({
    action: "bulk_approve_withdrawals",
    mutationFn: (ids: string[]) => withdrawalsApi.bulkApprove(ids),
    invalidateKeys: [["withdrawals", "queue"]],
    successMessage: `${selectedIds.length} withdrawals approved`,
    onSuccess: () => setRowSelection({}),
  });

  const bulkRejectMutation = useAuditedMutation({
    action: "bulk_reject_withdrawals",
    mutationFn: (ids: string[]) => withdrawalsApi.bulkReject(ids, "Bulk rejected by admin"),
    invalidateKeys: [["withdrawals", "queue"]],
    successMessage: `${selectedIds.length} withdrawals rejected`,
    onSuccess: () => setRowSelection({}),
  });

  const handleBulkApprove = () => {
    if (!hasSelection) return;
    bulkApproveMutation.mutate(selectedIds);
  };

  const handleBulkReject = () => {
    if (!hasSelection) return;
    bulkRejectMutation.mutate(selectedIds);
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <ArrowDownToLine className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Withdrawals Queue</h1>
            <p className="text-sm text-muted-foreground">
              Review and process fiat and crypto withdrawal requests
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["ALL", "PENDING", "APPROVED", "REJECTED", "PROCESSING", "COMPLETED", "FAILED"] as const).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setStatusFilter(status);
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                setRowSelection({});
              }}
              className="gap-1.5"
            >
              {status === "ALL" ? "All" : STATUS_CONFIG[status as WithdrawalStatus]?.label ?? status}
            </Button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search user or address..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
          />
        </div>
      </div>

      {hasSelection && (
        <div className="flex items-center justify-between rounded-md border border-primary/20 bg-primary/5 px-4 py-3">
          <div className="text-sm font-medium text-primary">
            {selectedRows.length} item(s) selected
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="gap-2"
              onClick={handleBulkApprove}
              disabled={bulkApproveMutation.isPending || bulkRejectMutation.isPending}
            >
              {bulkApproveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              Approve Selected
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="gap-2"
              onClick={handleBulkReject}
              disabled={bulkApproveMutation.isPending || bulkRejectMutation.isPending}
            >
              {bulkRejectMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />}
              Reject Selected
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="transition-colors hover:bg-muted/50"
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center">
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

      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Showing {table.getRowModel().rows.length} of {data?.pagination?.total ?? 0} request(s)
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="rows-per-page" className="text-sm font-medium">
              Rows per page
            </Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => table.setPageSize(Number(value))}
              items={[5, 10, 20].map((s) => ({ label: `${s}`, value: `${s}` }))}
            >
              <SelectTrigger size="sm" className="w-18" id="rows-per-page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="top">
                <SelectGroup>
                  {[5, 10, 20].map((size) => (
                    <SelectItem key={size} value={`${size}`}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() === -1 ? 1 : table.getPageCount()}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="size-8" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
              <ChevronsLeftIcon className="size-4" />
            </Button>
            <Button variant="outline" size="icon" className="size-8" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              <ChevronLeftIcon className="size-4" />
            </Button>
            <Button variant="outline" size="icon" className="size-8" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              <ChevronRightIcon className="size-4" />
            </Button>
            <Button variant="outline" size="icon" className="size-8" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
              <ChevronsRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
