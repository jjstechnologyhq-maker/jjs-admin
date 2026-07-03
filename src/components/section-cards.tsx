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
import { Users, DollarSign, BarChart3, Clock } from "lucide-react"
import { analyticsApi } from "@/api/analytics"
import { formatAmount } from "@/lib/money"

function isoDaysAgo(days: number) {
  return new Date(Date.now() - days * 86_400_000).toISOString()
}

export function SectionCards() {
  const overview = useQuery({
    queryKey: ["analytics", "overview"],
    queryFn: () => analyticsApi.overview(),
  })
  const funnel = useQuery({
    queryKey: ["analytics", "kyc-funnel", "30d"],
    queryFn: () => analyticsApi.kycFunnel({ from: isoDaysAgo(30), to: new Date().toISOString() }),
  })

  if (overview.isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="@container/card">
            <CardHeader>
              <Skeleton className="mb-2 h-4 w-32" />
              <Skeleton className="h-8 w-24" />
            </CardHeader>
          </Card>
        ))}
      </div>
    )
  }

  const o = overview.data
  const f = funnel.data

  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <Users className="size-4" />
            Daily Active Users
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {(o?.dau ?? 0).toLocaleString()}
          </CardTitle>
        </CardHeader>
        <CardFooter className="text-sm text-muted-foreground">
          As of {o?.dataDate ?? "—"}
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <DollarSign className="size-4" />
            Revenue (today)
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatAmount(o?.revenue, "NGN")}
          </CardTitle>
        </CardHeader>
        <CardFooter className="text-sm text-muted-foreground">Fee revenue snapshot</CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <BarChart3 className="size-4" />
            Total Volume
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatAmount(o?.totalVolume, "NGN")}
          </CardTitle>
        </CardHeader>
        <CardFooter className="text-sm text-muted-foreground">Across all transactions</CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <Clock className="size-4" />
            KYC Pending (30d)
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {(f?.pending ?? 0).toLocaleString()}
          </CardTitle>
          {f && f.pending > 0 && (
            <CardAction>
              <Badge variant="outline" className="border-amber-500/20 bg-amber-500/10 text-amber-600">
                Action needed
              </Badge>
            </CardAction>
          )}
        </CardHeader>
        <CardFooter className="text-sm text-muted-foreground">
          {f ? `${f.conversionRate} conversion` : "—"}
        </CardFooter>
      </Card>
    </div>
  )
}
