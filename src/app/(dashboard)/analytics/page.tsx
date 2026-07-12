"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { BarChart3, AlertTriangle, FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { analyticsApi } from "@/api/analytics";
import type { AnalyticsPeriodEnum, ReportTypeEnum } from "@/api/schema";
import { formatAmount, parseAmount } from "@/lib/money";

const PERIODS: AnalyticsPeriodEnum[] = ["DAILY", "WEEKLY", "MONTHLY"];
const REPORT_TYPES: ReportTypeEnum[] = ["REVENUE", "VOLUME", "KYC", "VASP"];

function isoDaysAgo(days: number) {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}
const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export default function AnalyticsPage() {
  const [period, setPeriod] = React.useState<AnalyticsPeriodEnum>("DAILY");
  const range = React.useMemo(
    () => ({ period, from: isoDaysAgo(30), to: new Date().toISOString() }),
    [period],
  );

  const overview = useQuery({ queryKey: ["analytics", "overview"], queryFn: () => analyticsApi.overview() });
  const users = useQuery({ queryKey: ["analytics", "users", range], queryFn: () => analyticsApi.users(range) });
  const volumes = useQuery({ queryKey: ["analytics", "volumes", range], queryFn: () => analyticsApi.volumes(range) });
  const funnel = useQuery({
    queryKey: ["analytics", "funnel"],
    queryFn: () => analyticsApi.kycFunnel({ from: isoDaysAgo(30), to: new Date().toISOString() }),
  });
  const vasp = useQuery({ queryKey: ["analytics", "vasp"], queryFn: () => analyticsApi.vasp() });

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <BarChart3 className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Analytics &amp; Reporting</h1>
            <p className="text-sm text-muted-foreground">Metrics aggregate nightly — data may be up to 24h old</p>
          </div>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as AnalyticsPeriodEnum)}>
          <SelectTrigger size="sm" className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Daily Active Users" value={overview.data ? overview.data.dau.toLocaleString() : undefined} />
        <StatCard label="Revenue" value={overview.data ? formatAmount(overview.data.revenue, "NGN") : undefined} />
        <StatCard label="Total Volume" value={overview.data ? formatAmount(overview.data.totalVolume, "NGN") : undefined} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active Users (30d)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {users.isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={(users.data ?? []).map((d) => ({ date: shortDate(d.date), value: Number(d.value) }))}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} width={40} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transaction Volume (30d)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {volumes.isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={(volumes.data ?? []).map((d) => ({
                    date: shortDate(d.date),
                    swap: parseAmount(d.swap),
                    withdrawal: parseAmount(d.withdrawal),
                    funding: parseAmount(d.funding),
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} width={40} />
                  <Tooltip />
                  <Bar dataKey="swap" stackId="v" fill="var(--chart-1)" />
                  <Bar dataKey="withdrawal" stackId="v" fill="var(--chart-2)" />
                  <Bar dataKey="funding" stackId="v" fill="var(--chart-3)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">KYC Funnel (30d)</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {funnel.isLoading || !funnel.data ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <>
                <FunnelRow label="Submitted" value={funnel.data.submitted} />
                <FunnelRow label="Pending" value={funnel.data.pending} />
                <FunnelRow label="Approved" value={funnel.data.approved} />
                <FunnelRow label="Rejected" value={funnel.data.rejected} />
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Conversion rate</span>
                  <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600">
                    {funnel.data.conversionRate}
                  </Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className={vasp.data?.thresholdBreached ? "border-red-500/40" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              VASP Licence Monitoring
              {vasp.data?.thresholdBreached && (
                <Badge variant="outline" className="gap-1 border-red-500/20 bg-red-500/10 text-red-600">
                  <AlertTriangle className="size-3" />
                  Threshold breached
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Actual volume vs NGN regulatory threshold</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            {vasp.isLoading || !vasp.data ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total volume</span>
                  <span className="font-mono font-medium">{formatAmount(vasp.data.totalVolume, "NGN")} NGN</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Threshold</span>
                  <span className="font-mono">{formatAmount(vasp.data.thresholdNgn, "NGN")} NGN</span>
                </div>
                <div className="border-t pt-2">
                  {Object.entries(vasp.data.breakdown).map(([asset, v]) => (
                    <div key={asset} className="flex justify-between">
                      <span className="text-muted-foreground">{asset}</span>
                      <span className="font-mono">{formatAmount(v)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <ReportCard />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums">
          {value ?? <Skeleton className="h-7 w-24" />}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}

function FunnelRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value.toLocaleString()}</span>
    </div>
  );
}

function ReportCard() {
  const [reportType, setReportType] = React.useState<ReportTypeEnum>("REVENUE");
  const [jobId, setJobId] = React.useState<string | null>(null);

  const enqueue = async () => {
    try {
      const filters =
        reportType === "VASP"
          ? undefined
          : { period: "DAILY", from: isoDaysAgo(30), to: new Date().toISOString() };
      const { jobId: id } = await analyticsApi.enqueueReport({ reportType, filters });
      setJobId(id);
      toast.success("Report queued");
    } catch {
      toast.error("Could not enqueue report");
    }
  };

  const status = useQuery({
    queryKey: ["analytics", "report", jobId],
    queryFn: () => analyticsApi.reportStatus(jobId as string),
    enabled: !!jobId,
    refetchInterval: (q) => {
      const s = q.state.data?.status;
      return s === "COMPLETE" || s === "FAILED" ? false : 2000;
    },
  });

  const st = status.data?.status;

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle className="text-base">Generate PDF report</CardTitle>
        <CardDescription>Async job — poll until the download is ready</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3">
        <Select value={reportType} onValueChange={(v) => setReportType(v as ReportTypeEnum)}>
          <SelectTrigger size="sm" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REPORT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={enqueue} disabled={!!jobId && st !== "COMPLETE" && st !== "FAILED"}>
          Generate
        </Button>
        {jobId && st && st !== "COMPLETE" && st !== "FAILED" && (
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {st}…
          </span>
        )}
        {st === "FAILED" && <span className="text-sm text-destructive">Report failed</span>}
        {st === "COMPLETE" && status.data?.downloadUrl && (
          <a
            href={status.data.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-muted"
          >
            <FileDown className="size-4" />
            Download
          </a>
        )}
      </CardContent>
    </Card>
  );
}
