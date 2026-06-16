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
  ShieldCheck,
  Search,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  CheckCircle2,
  XCircle,
  Clock,
  UserPlus,
  Ban,
  ShieldAlert,
  MoreHorizontal,
  Mail,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

import { adminApi, type AdminUser } from "@/api/admin";
import type { InvitationStatus } from "@/api/types";
import type { Role } from "@/lib/auth/types";
import { useAuditedMutation } from "@/hooks/use-audited-mutation";

// ── Status badge config ──────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  InvitationStatus,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    className: string;
  }
> = {
  ACTIVE: {
    label: "Active",
    icon: CheckCircle2,
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  PENDING: {
    label: "Pending Invite",
    icon: Clock,
    className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  },
  EXPIRED: {
    label: "Expired",
    icon: XCircle,
    className: "bg-muted text-muted-foreground border-border",
  },
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-red-500/10 text-red-500 border-red-500/20",
  COMPLIANCE_OFFICER: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  FINANCE_MANAGER: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  CUSTOMER_SUPPORT: "bg-amber-500/10 text-amber-500 border-amber-500/20",
};

// ── Main component ───────────────────────────────────────────────────────────

export default function AdminManagementPage() {
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState("CUSTOMER_SUPPORT");

  const { data, isLoading } = useQuery({
    queryKey: [
      "admins",
      "list",
      statusFilter,
      pagination.pageIndex,
      pagination.pageSize,
    ],
    queryFn: () =>
      adminApi.getAdmins({
        status:
          statusFilter === "ALL"
            ? undefined
            : (statusFilter as InvitationStatus),
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      }),
  });

  const inviteMutation = useAuditedMutation({
    action: "invite_admin",
    mutationFn: () =>
      adminApi.invite({
        email: inviteEmail,
        permissions: [inviteRole as Role],
        fullName: "Invited Admin",
      }),
    invalidateKeys: [["admins", "list"]],
    successMessage: "Invitation sent successfully",
    onSuccess: () => {
      setInviteOpen(false);
      setInviteEmail("");
      setInviteRole("CUSTOMER_SUPPORT");
    },
  });

  const suspendMutation = useAuditedMutation({
    action: "suspend_admin",
    mutationFn: (id: string) => adminApi.suspend(id),
    invalidateKeys: [["admins", "list"]],
    successMessage: "Admin suspended",
  });

  const columns: ColumnDef<AdminUser>[] = [
    {
      accessorKey: "fullName",
      header: "Administrator",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.fullName}</span>
          <span className="text-xs text-muted-foreground">
            {row.original.email}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "permissions",
      header: "Roles",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.permissions.map((role) => (
            <Badge
              key={role}
              variant="outline"
              className={`text-[10px] px-1.5 py-0 ${ROLE_COLORS[role] || ""}`}
            >
              {role.replace(/_/g, " ")}
            </Badge>
          ))}
        </div>
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
    },
    {
      accessorKey: "mfaEnabled",
      header: "Security",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-sm">
          {row.original.mfaEnabled ? (
            <>
              <ShieldCheck className="size-3.5 text-emerald-600" />
              <span className="text-emerald-600">2FA Active</span>
            </>
          ) : (
            <>
              <ShieldAlert className="size-3.5 text-amber-600" />
              <span className="text-amber-600">No 2FA</span>
            </>
          )}
        </div>
      ),
    },
    {
      accessorKey: "lastActive",
      header: "Last Active",
      cell: ({ row }) => {
        if (!row.original.lastActive)
          return <span className="text-muted-foreground text-sm">Never</span>;
        const date = new Date(row.original.lastActive);
        return (
          <span className="text-sm text-muted-foreground">
            {date.toLocaleString("en-GB", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="ghost" size="icon" className="size-8">
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Admin Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Edit Roles</DropdownMenuItem>
            <DropdownMenuItem>View Audit Trail</DropdownMenuItem>
            <DropdownMenuSeparator />
            {row.original.status === "ACTIVE" && (
              <DropdownMenuItem
                className="text-orange-600 focus:text-orange-600"
                onClick={() => suspendMutation.mutate(row.original.id)}
              >
                <Ban className="mr-2 size-4" />
                Suspend Access
              </DropdownMenuItem>
            )}
            <DropdownMenuItem className="text-red-600 focus:text-red-600">
              <XCircle className="mr-2 size-4" />
              Deactivate
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const tableData = React.useMemo(() => data?.data ?? [], [data]);

  const filteredData = React.useMemo(() => {
    if (!searchQuery) return tableData;
    const q = searchQuery.toLowerCase();
    return tableData.filter(
      (item) =>
        item.fullName.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q),
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
            <ShieldCheck className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Admin Management
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage dashboard users, roles, and security policies
            </p>
          </div>
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger>
            <Button className="gap-2">
              <UserPlus className="size-4" />
              Invite Admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New Administrator</DialogTitle>
              <DialogDescription>
                Send an email invitation with a secure signup link. They will be
                required to set up 2FA.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@company.com"
                    className="pl-8"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Primary Role</Label>
                <Select
                  value={inviteRole}
                  onValueChange={(val) => { if (val !== null) setInviteRole(val as Role); }}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="SUPER_ADMIN">
                        Super Admin (Full Access)
                      </SelectItem>
                      <SelectItem value="COMPLIANCE_OFFICER">
                        Compliance Officer
                      </SelectItem>
                      <SelectItem value="FINANCE_MANAGER">
                        Finance Manager
                      </SelectItem>
                      <SelectItem value="CUSTOMER_SUPPORT">
                        Customer Support
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => inviteMutation.mutate()}
                disabled={!inviteEmail || inviteMutation.isPending}
                className="gap-2"
              >
                {inviteMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Mail className="size-4" />
                )}
                Send Invite
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["ALL", "ACTIVE", "PENDING", "EXPIRED"] as const).map((status) => (
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
              {status === "ALL"
                ? "All"
                : (STATUS_CONFIG[status as InvitationStatus]?.label ?? status)}
            </Button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search name or email..."
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
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
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
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center"
                >
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <ShieldCheck className="size-8 opacity-40" />
                    <p className="text-sm font-medium">
                      No administrators found
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Showing {table.getRowModel().rows.length} of{" "}
          {data?.pagination?.total ?? 0} admin(s)
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
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount() === -1 ? 1 : table.getPageCount()}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeftIcon className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRightIcon className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
