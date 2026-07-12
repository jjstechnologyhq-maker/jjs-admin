"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Users as UsersIcon, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import {
  StatusBadge,
  USER_ACCOUNT_STATUS,
  KYC_STATUS,
} from "@/components/status-badge";
import { CursorPagination } from "@/components/cursor-pagination";
import { useCursorList } from "@/hooks/use-cursor-list";
import { usersApi } from "@/api/users";
import type { UserAccountStatus } from "@/api/schema";

const STATUS_TABS: { label: string; value: "ALL" | UserAccountStatus }[] = [
  { label: "All", value: "ALL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Frozen", value: "FROZEN" },
  { label: "Shadow Banned", value: "SHADOW_BANNED" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function UsersPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = React.useState<"ALL" | UserAccountStatus>("ALL");
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  // Debounce full-text search to avoid a request per keystroke.
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const filters = {
    account_status: statusFilter === "ALL" ? undefined : statusFilter,
    q: debouncedSearch || undefined,
  };

  const list = useCursorList({
    queryKey: ["users", "list"],
    resetToken: JSON.stringify(filters),
    limit: 50,
    fetcher: ({ cursor, limit }) => usersApi.list({ ...filters, cursor, limit }),
  });

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <UsersIcon className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">
            Look up platform users, review accounts, and manage status
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => (
            <Button
              key={tab.value}
              variant={statusFilter === tab.value ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(tab.value)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search name, email, phone..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>KYC</TableHead>
              <TableHead>Joined</TableHead>
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
              list.items.map((user) => (
                <TableRow
                  key={user.id}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() => router.push(`/users/${user.id}`)}
                >
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{user.fullName}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {user.phone}
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={user.accountStatus} config={USER_ACCOUNT_STATUS} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={user.kycStatus} config={KYC_STATUS} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
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

      <CursorPagination
        page={list.page}
        canPrev={list.canPrev}
        canNext={list.canNext}
        onPrev={list.prev}
        onNext={list.next}
        total={list.meta?.total}
        isFetching={list.isFetching}
        itemLabel="user"
      />
    </div>
  );
}
