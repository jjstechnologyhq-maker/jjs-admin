"use client"

import { useQuery } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUpIcon, Users, UserCheck, Clock, AlertTriangle } from "lucide-react"
import { adminApi } from "@/api/admin"

export function SectionCards() {
  const { data: response, isLoading } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => adminApi.getStats(),
  });

  const stats = response?.data;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="@container/card">
            <CardHeader>
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-8 w-24" />
            </CardHeader>
            <CardFooter>
              <Skeleton className="h-4 w-48" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <Users className="size-4" />
            Total Users
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.totalUsers.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
              <TrendingUpIcon className="mr-1 size-3" />
              +{stats.newUsersThisMonth} this month
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Steady growth <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">
            +{stats.newUsersToday} new today, +{stats.newUsersThisWeek} this week
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <UserCheck className="size-4" />
            Active Users
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.activeUsers.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
              {Math.round((stats.activeUsers / Math.max(stats.totalUsers, 1)) * 100)}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Strong user retention
          </div>
          <div className="text-muted-foreground">
            Actively using the platform
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <Clock className="size-4" />
            Pending KYC
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.pendingKycUsers.toLocaleString()}
          </CardTitle>
          {stats.pendingKycUsers > 0 && (
            <CardAction>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                Action Needed
              </Badge>
            </CardAction>
          )}
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-amber-600">
            Awaiting verification
          </div>
          <div className="text-muted-foreground">
            Check the KYC queue
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <AlertTriangle className="size-4" />
            Suspended & Flagged
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {(stats.suspendedUsers + stats.flaggedUsers).toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
              {stats.flaggedUsers} Flagged
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-red-600">
            {stats.suspendedUsers} Suspended
          </div>
          <div className="text-muted-foreground">
            Requires administrative review
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
