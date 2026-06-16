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
  Users as UsersIcon,
  Search,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Ban,
  Clock,
  Info,
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

import {
  usersApi,
  type UserProfile,
  getFullName,
  KYC_LEVEL_LABELS,
} from "@/api/users";
import type { AccountStatus, KycLevel } from "@/api/types";

// ── Status badge config — aligned with openapi.yaml AccountStatus ────────────

const ACCOUNT_STATUS_CONFIG: Record<
  AccountStatus,
  { label: string; icon: React.ComponentType<{ className?: string }>; className: string }
> = {
  active: {
    label: "Active",
    icon: CheckCircle2,
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
  },
  suspended: {
    label: "Suspended",
    icon: Ban,
    className: "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400",
  },
  unverified: {
    label: "Unverified",
    icon: AlertCircle,
    className: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
  },
  "pending kyc": {
    label: "Pending KYC",
    icon: Clock,
    className: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
  },
  flagged: {
    label: "Flagged",
    icon: XCircle,
    className: "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400",
  },
};

const KYC_LEVEL_CONFIG: Record<
  KycLevel,
  { label: string; icon: React.ComponentType<{ className?: string }>; className: string }
> = {
  "0": { label: "Unverified", icon: XCircle, className: "text-red-600 dark:text-red-400" },
  "1": { label: "Phone Verified", icon: Clock, className: "text-amber-600 dark:text-amber-400" },
  "2": { label: "BVN Verified", icon: Info, className: "text-blue-600 dark:text-blue-400" },
  "3": { label: "Fully Verified", icon: CheckCircle2, className: "text-emerald-600 dark:text-emerald-400" },
};

// ── Column definitions — adapted for UserProfile ─────────────────────────────

const columns: ColumnDef<UserProfile>[] = [
  {
    accessorKey: "firstName",
    header: "User",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{getFullName(row.original)}</span>
        <span className="text-xs text-muted-foreground">{row.original.email}</span>
      </div>
    ),
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => (
      <span className="font-mono text-sm text-muted-foreground">
        {row.original.phone}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Account Status",
    cell: ({ row }) => {
      const config = ACCOUNT_STATUS_CONFIG[row.original.status];
      if (!config) return <span className="text-muted-foreground">{row.original.status}</span>;
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
    accessorKey: "kycLevel",
    header: "KYC Level",
    cell: ({ row }) => {
      const config = KYC_LEVEL_CONFIG[row.original.kycLevel];
      if (!config) return <span className="text-muted-foreground">Level {row.original.kycLevel}</span>;
      const Icon = config.icon;
      return (
        <div className="flex items-center gap-1.5 text-sm">
          <Icon className={`size-3.5 ${config.className}`} />
          <span>{config.label}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Joined",
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt);
      return (
        <span className="text-sm text-muted-foreground">
          {date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: () => (
      <Button variant="ghost" size="sm" className="text-muted-foreground">
        View Profile →
      </Button>
    ),
  },
];

// ── Main component ───────────────────────────────────────────────────────────

export default function UsersPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });

  const { data, isLoading } = useQuery({
    queryKey: ["users", "list", statusFilter, searchQuery, pagination.pageIndex, pagination.pageSize],
    queryFn: () =>
      usersApi.getUsers({
        status: statusFilter === "ALL" ? undefined : (statusFilter as AccountStatus),
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: searchQuery || undefined,
        sort: "createdAt:desc",
      }),
  });

  const tableData = React.useMemo(() => data?.data ?? [], [data]);

  // Client-side search filter (hybrid — backend also supports search param)
  const filteredData = React.useMemo(() => {
    if (!searchQuery) return tableData;
    const q = searchQuery.toLowerCase();
    return tableData.filter(
      (item) =>
        getFullName(item).toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.phone.toLowerCase().includes(q) ||
        (item.jjsTag && item.jjsTag.toLowerCase().includes(q))
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <UsersIcon className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Users</h1>
            <p className="text-sm text-muted-foreground">
              Manage platform users, accounts, and balances
            </p>
          </div>
        </div>
      </div>

      {/* Filters — uses openapi.yaml status enum values */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Status tabs */}
        <div className="flex flex-wrap gap-2">
          {(["ALL", "active", "suspended", "unverified", "pending kyc", "flagged"] as const).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setStatusFilter(status);
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              }}
              className="gap-1.5"
            >
              {status === "ALL" ? "All" : ACCOUNT_STATUS_CONFIG[status as AccountStatus]?.label ?? status}
            </Button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search name, email, phone..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
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
                  onClick={() => router.push(`/users/${row.original.id}`)}
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
                    <UsersIcon className="size-8 opacity-40" />
                    <p className="text-sm font-medium">No users found</p>
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
          Showing {table.getRowModel().rows.length} of {data?.pagination?.total ?? 0} user(s)
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="users-rows-per-page" className="text-sm font-medium">
              Rows per page
            </Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => table.setPageSize(Number(value))}
              items={[5, 10, 20].map((s) => ({ label: `${s}`, value: `${s}` }))}
            >
              <SelectTrigger size="sm" className="w-18" id="users-rows-per-page">
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
