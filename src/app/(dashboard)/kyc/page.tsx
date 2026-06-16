"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
  FileCheck,
  Search,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Info,
  Loader2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

import { kycApi, type KycSubmission } from "@/api/kyc";
import type { KycStatus, RiskLevel } from "@/api/types";

// ── Status badge config ──────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  KycStatus,
  { label: string; icon: React.ComponentType<{ className?: string }>; className: string }
> = {
  PENDING: {
    label: "Pending",
    icon: Clock,
    className: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
  },
  APPROVED: {
    label: "Approved",
    icon: CheckCircle2,
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
  },
  REJECTED: {
    label: "Rejected",
    icon: XCircle,
    className: "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400",
  },
  INFO_REQUIRED: {
    label: "Info Required",
    icon: Info,
    className: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
  },
};

const RISK_CONFIG: Record<RiskLevel, { label: string; className: string }> = {
  LOW: { label: "Low", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400" },
  MEDIUM: { label: "Medium", className: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400" },
  HIGH: { label: "High", className: "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400" },
  CRITICAL: { label: "Critical", className: "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400" },
};

// ── Column definitions ───────────────────────────────────────────────────────

const columns: ColumnDef<KycSubmission>[] = [
  {
    accessorKey: "userName",
    header: "Applicant",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.userName}</span>
        <span className="text-xs text-muted-foreground">{row.original.email}</span>
      </div>
    ),
  },
  {
    accessorKey: "documentType",
    header: "Document",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.original.documentType}</span>
    ),
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
    filterFn: (row, _id, value) => value === "ALL" || row.original.status === value,
  },
  {
    accessorKey: "riskLevel",
    header: "Risk",
    cell: ({ row }) => {
      const config = RISK_CONFIG[row.original.riskLevel];
      return (
        <Badge variant="outline" className={`${config.className}`}>
          {row.original.riskLevel === "HIGH" || row.original.riskLevel === "CRITICAL" ? (
            <AlertTriangle className="mr-1 size-3" />
          ) : null}
          {config.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "submittedAt",
    header: "Submitted",
    cell: ({ row }) => {
      const date = new Date(row.original.submittedAt);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      let relative: string;
      if (diffDays > 0) relative = `${diffDays}d ago`;
      else if (diffHours > 0) relative = `${diffHours}h ago`;
      else relative = "Just now";

      return (
        <div className="flex flex-col">
          <span className="text-sm">{relative}</span>
          <span className="text-xs text-muted-foreground">
            {date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: () => (
      <Button variant="ghost" size="sm" className="text-muted-foreground">
        Review →
      </Button>
    ),
  },
];

// ── Main component ───────────────────────────────────────────────────────────

export default function KycQueuePage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });

  const { data, isLoading } = useQuery({
    queryKey: ["kyc", "queue", statusFilter],
    queryFn: () =>
      kycApi.getQueue({
        status: statusFilter === "ALL" ? undefined : (statusFilter as KycStatus),
        page: 1,
        limit: 50,
      }),
  });

  const tableData = React.useMemo(() => data?.data ?? [], [data]);

  // Client-side search filter
  const filteredData = React.useMemo(() => {
    if (!searchQuery) return tableData;
    const q = searchQuery.toLowerCase();
    return tableData.filter(
      (item) =>
        item.userName.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q)
    );
  }, [tableData, searchQuery]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, columnFilters, pagination },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Status count badges
  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = { ALL: 0, PENDING: 0, APPROVED: 0, REJECTED: 0, INFO_REQUIRED: 0 };
    for (const item of tableData) {
      counts[item.status] = (counts[item.status] || 0) + 1;
      counts.ALL++;
    }
    return counts;
  }, [tableData]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <FileCheck className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">KYC Verification Queue</h1>
            <p className="text-sm text-muted-foreground">
              Review and verify user identity documents
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Status tabs */}
        <div className="flex flex-wrap gap-2">
          {(["ALL", "PENDING", "APPROVED", "REJECTED", "INFO_REQUIRED"] as const).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="gap-1.5"
            >
              {status === "ALL" ? "All" : STATUS_CONFIG[status as KycStatus]?.label ?? status}
              <Badge
                variant="secondary"
                className="ml-1 size-5 rounded-full p-0 text-[10px] flex items-center justify-center"
              >
                {statusCounts[status] || 0}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
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
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() => router.push(`/kyc/${row.original.userId}`)}
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
                    <FileCheck className="size-8 opacity-40" />
                    <p className="text-sm font-medium">No submissions found</p>
                    <p className="text-xs">
                      {statusFilter !== "ALL"
                        ? `No ${STATUS_CONFIG[statusFilter as KycStatus]?.label.toLowerCase()} submissions`
                        : "The queue is empty"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          {filteredData.length} submission{filteredData.length !== 1 ? "s" : ""}
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="kyc-rows-per-page" className="text-sm font-medium">
              Rows per page
            </Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => table.setPageSize(Number(value))}
              items={[5, 10, 20].map((s) => ({ label: `${s}`, value: `${s}` }))}
            >
              <SelectTrigger size="sm" className="w-18" id="kyc-rows-per-page">
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
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
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
