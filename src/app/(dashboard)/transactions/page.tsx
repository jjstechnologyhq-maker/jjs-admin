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
  ArrowLeftRight,
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
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
  Wallet,
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

import { transactionsApi, type Transaction } from "@/api/transactions";
import type { TransactionType, RiskLevel } from "@/api/types";
import { useAuditedMutation } from "@/hooks/use-audited-mutation";

// ── Status badge config ──────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  TransactionType,
  { label: string; icon: React.ComponentType<{ className?: string }>; className: string }
> = {
  SWAP: { label: "Swap", icon: RefreshCw, className: "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400" },
  TRANSFER: { label: "Transfer", icon: ArrowLeftRight, className: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400" },
  WITHDRAWAL: { label: "Withdrawal", icon: ArrowUpFromLine, className: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400" },
  FUNDING: { label: "Funding", icon: ArrowDownToLine, className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400" },
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; className: string }> = {
  PENDING: { label: "Pending", icon: Clock, className: "text-amber-600 dark:text-amber-400" },
  COMPLETED: { label: "Completed", icon: CheckCircle2, className: "text-emerald-600 dark:text-emerald-400" },
  FAILED: { label: "Failed", icon: XCircle, className: "text-red-600 dark:text-red-400" },
  FLAGGED: { label: "Flagged", icon: AlertTriangle, className: "text-orange-600 dark:text-orange-400" },
};

// ── Column definitions ───────────────────────────────────────────────────────

const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: "id",
    header: "TX ID",
    cell: ({ row }) => {
      const id = row.original.id;
      const displayId = `${id.slice(0, 8)}...`;
      return (
        <span className="font-mono text-sm text-muted-foreground" title={id}>
          {displayId}
        </span>
      );
    },
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const config = TYPE_CONFIG[row.original.type];
      const Icon = config.icon;
      return (
        <Badge variant="outline" className={`gap-1 ${config.className}`}>
          <Icon className="size-3" />
          {config.label}
        </Badge>
      );
    },
    filterFn: (row, _id, value) => value === "ALL" || row.original.type === value,
  },
  {
    accessorKey: "userName",
    header: "User",
    cell: ({ row }) => (
      <span className="font-medium text-sm">{row.original.userName}</span>
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
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const config = STATUS_CONFIG[row.original.status] || { label: row.original.status, icon: Clock, className: "text-muted-foreground" };
      const Icon = config.icon;
      return (
        <div className="flex items-center gap-1.5 text-sm">
          <Icon className={`size-3.5 ${config.className}`} />
          <span className={config.className}>{config.label}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "riskScore",
    header: "Risk Score",
    cell: ({ row }) => {
      const score = row.original.riskScore;
      let colorClass = "text-emerald-600 dark:text-emerald-400";
      if (score > 40) colorClass = "text-amber-600 dark:text-amber-400";
      if (score > 75) colorClass = "text-red-600 dark:text-red-400";

      return (
        <div className="flex items-center gap-2">
          <div className="w-12 h-2 rounded-full bg-muted overflow-hidden">
            <div className={`h-full ${colorClass.replace('text-', 'bg-')}`} style={{ width: `${Math.min(100, score)}%` }} />
          </div>
          <span className={`text-sm font-medium ${colorClass}`}>{score}/100</span>
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Time",
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt);
      return (
        <span className="text-sm text-muted-foreground">
          {date.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: () => (
      <Button variant="ghost" size="sm" className="text-muted-foreground">
        Details →
      </Button>
    ),
  },
];

// ── Main component ───────────────────────────────────────────────────────────

export default function TransactionsPage() {
  const [typeFilter, setTypeFilter] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });

  const { data, isLoading } = useQuery({
    queryKey: ["transactions", "ledger", typeFilter, pagination.pageIndex, pagination.pageSize],
    queryFn: () =>
      transactionsApi.getTransactions({
        type: typeFilter === "ALL" ? undefined : (typeFilter as TransactionType),
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
        item.id.toLowerCase().includes(q) ||
        item.asset.toLowerCase().includes(q)
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
    manualPagination: true,
    pageCount: data?.pagination?.totalPages ?? -1,
  });

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
              Global view of all platform transactions and movements
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["ALL", "SWAP", "TRANSFER", "WITHDRAWAL", "FUNDING"] as const).map((type) => (
            <Button
              key={type}
              variant={typeFilter === type ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setTypeFilter(type);
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              }}
              className="gap-1.5"
            >
              {type === "ALL" ? "All Types" : TYPE_CONFIG[type as TransactionType]?.label ?? type}
            </Button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search TX ID, user, asset..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
          />
        </div>
      </div>

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
                  className="transition-colors hover:bg-muted/50 cursor-pointer"
                  onClick={() => {/* Navigate to detail slide-out or page */}}
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
                    <ArrowLeftRight className="size-8 opacity-40" />
                    <p className="text-sm font-medium">No transactions found</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Showing {table.getRowModel().rows.length} of {data?.pagination?.total ?? 0} transaction(s)
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
