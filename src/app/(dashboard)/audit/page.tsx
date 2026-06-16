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
  History,
  Search,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  FileText,
  Activity,
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

import { adminApi, type AuditLog } from "@/api/admin";

const RESOURCE_COLORS: Record<string, string> = {
  KYC: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
  WITHDRAWAL: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
  USER: "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400",
  SYSTEM: "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400",
  ADMIN: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
  FEES: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:text-indigo-400",
};

const columns: ColumnDef<AuditLog>[] = [
  {
    accessorKey: "timestamp",
    header: "Timestamp",
    cell: ({ row }) => {
      const date = new Date(row.original.timestamp);
      return (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {date.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </span>
      );
    },
  },
  {
    accessorKey: "adminEmail",
    header: "Administrator",
    cell: ({ row }) => (
      <span className="font-medium text-sm">{row.original.adminEmail}</span>
    ),
  },
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => (
      <span className="text-sm font-medium">{row.original.action}</span>
    ),
  },
  {
    accessorKey: "resourceType",
    header: "Resource",
    cell: ({ row }) => {
      const type = row.original.resourceType;
      const color = RESOURCE_COLORS[type] || "bg-muted text-muted-foreground border-border";
      return (
        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${color}`}>
          {type}
        </Badge>
      );
    },
  },
  {
    accessorKey: "resourceId",
    header: "Resource ID",
    cell: ({ row }) => {
      const id = row.original.resourceId;
      if (!id) return <span className="text-muted-foreground">-</span>;
      return (
        <span className="font-mono text-xs text-muted-foreground" title={id}>
          {id.length > 12 ? `${id.slice(0, 12)}...` : id}
        </span>
      );
    },
  },
  {
    accessorKey: "ipAddress",
    header: "IP Address",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">{row.original.ipAddress}</span>
    ),
  },
  {
    id: "details",
    header: () => <span className="sr-only">Details</span>,
    cell: ({ row }) => (
      <Button variant="ghost" size="sm" className="text-muted-foreground">
        <FileText className="size-4 mr-1" />
        Details
      </Button>
    ),
  },
];

export default function AuditLogPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 20 });

  const { data, isLoading } = useQuery({
    queryKey: ["audit", "logs", pagination.pageIndex, pagination.pageSize],
    queryFn: () =>
      adminApi.getAuditLogs({
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
        item.adminEmail.toLowerCase().includes(q) ||
        item.action.toLowerCase().includes(q) ||
        item.resourceId?.toLowerCase().includes(q)
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
            <History className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">System Audit Log</h1>
            <p className="text-sm text-muted-foreground">
              Immutable record of all administrative actions and system events
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Activity className="size-4" />
            Live Tail
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <FileText className="size-4" />
            Export CSV
          </Button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search email, action, ID..."
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
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="transition-colors hover:bg-muted/50">
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
                    <History className="size-8 opacity-40" />
                    <p className="text-sm font-medium">No audit logs found</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Showing {table.getRowModel().rows.length} of {data?.pagination?.total ?? 0} event(s)
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="rows-per-page" className="text-sm font-medium">
              Rows per page
            </Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => table.setPageSize(Number(value))}
              items={[10, 20, 50, 100].map((s) => ({ label: `${s}`, value: `${s}` }))}
            >
              <SelectTrigger size="sm" className="w-18" id="rows-per-page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="top">
                <SelectGroup>
                  {[10, 20, 50, 100].map((size) => (
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
