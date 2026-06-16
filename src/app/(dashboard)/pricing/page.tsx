"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Coins,
  CheckCircle2,
  XCircle,
  Percent,
  Settings2,
  Save,
  Loader2,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";

import { feesApi, type AssetRate, type AssetToggle } from "@/api/fees";
import { useAuditedMutation } from "@/hooks/use-audited-mutation";

export default function PricingPage() {
  const { data: rates, isLoading: isLoadingRates } = useQuery({
    queryKey: ["pricing", "rates"],
    queryFn: () => feesApi.getRates(),
  });

  const { data: assets, isLoading: isLoadingAssets } = useQuery({
    queryKey: ["pricing", "assets"],
    queryFn: () => feesApi.getAssetToggles(),
  });

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <Coins className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Pricing & Fees</h1>
          <p className="text-sm text-muted-foreground">
            Configure market spreads, asset availability, and platform fees
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Exchange Rates & Spread</CardTitle>
              <CardDescription>Adjust the platform spread markup over live market rates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Asset</TableHead>
                      <TableHead className="text-right">Market</TableHead>
                      <TableHead className="text-right">Platform</TableHead>
                      <TableHead className="text-right w-[150px]">Spread</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingRates ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-8 w-full" /></TableCell>
                        </TableRow>
                      ))
                    ) : rates?.map((rate) => (
                      <SpreadRow key={rate.asset} rate={rate} />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Platform Fees</CardTitle>
              <CardDescription>Global flat and percentage fees</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <p className="text-sm">Fee tiers configuration coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Asset Availability</CardTitle>
              <CardDescription>Enable or disable core operations per asset globally</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Asset</TableHead>
                      <TableHead className="text-center">Trading</TableHead>
                      <TableHead className="text-center">Deposits</TableHead>
                      <TableHead className="text-center">Withdrawals</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingAssets ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                          <TableCell className="text-center"><Skeleton className="h-5 w-8 mx-auto rounded-full" /></TableCell>
                          <TableCell className="text-center"><Skeleton className="h-5 w-8 mx-auto rounded-full" /></TableCell>
                          <TableCell className="text-center"><Skeleton className="h-5 w-8 mx-auto rounded-full" /></TableCell>
                        </TableRow>
                      ))
                    ) : assets?.map((asset) => (
                      <AssetToggleRow key={asset.asset} asset={asset} />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SpreadRow({ rate }: { rate: AssetRate }) {
  const [spread, setSpread] = React.useState(rate.spreadPercent);
  const isDirty = spread !== rate.spreadPercent;

  const platformRate = rate.marketRate * (1 + spread / 100);

  const updateSpreadMutation = useAuditedMutation({
    action: "update_spread",
    mutationFn: () => feesApi.updateSpread({ asset: rate.asset, spreadPercent: spread }),
    invalidateKeys: [["pricing", "rates"]],
    successMessage: `${rate.asset} spread updated`,
  });

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-full bg-secondary text-xs font-medium">
            {rate.asset[0]}
          </div>
          <span className="font-medium">{rate.asset}</span>
        </div>
      </TableCell>
      <TableCell className="text-right font-mono text-muted-foreground text-sm">
        ${rate.marketRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
      </TableCell>
      <TableCell className="text-right font-mono font-medium text-sm">
        ${platformRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3 justify-end">
          <div className="flex items-center gap-2 flex-1 max-w-[100px]">
            <span className="text-xs w-8 text-right font-medium">{spread.toFixed(1)}%</span>
            <Slider
              value={[spread]}
              min={0}
              max={5}
              step={0.1}
              onValueChange={(vals) => setSpread(Array.isArray(vals) ? vals[0] : (vals as unknown as number))}
              className="flex-1"
            />
          </div>
          {isDirty && (
            <Button
              size="icon"
              variant="ghost"
              className="size-6 h-6 w-6 text-primary hover:text-primary hover:bg-primary/10"
              onClick={() => updateSpreadMutation.mutate()}
              disabled={updateSpreadMutation.isPending}
            >
              {updateSpreadMutation.isPending ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

function AssetToggleRow({ asset }: { asset: AssetToggle }) {
  const updateToggleMutation = useAuditedMutation({
    action: "update_asset_toggle",
    mutationFn: (updates: Partial<AssetToggle>) => feesApi.updateAssetToggle(asset.asset, updates),
    invalidateKeys: [["pricing", "assets"]],
    successMessage: `${asset.asset} configuration updated`,
  });

  const handleToggle = (key: keyof Omit<AssetToggle, "asset">, checked: boolean) => {
    updateToggleMutation.mutate({ [key]: checked });
  };

  return (
    <TableRow>
      <TableCell>
        <span className="font-medium">{asset.asset}</span>
      </TableCell>
      <TableCell className="text-center">
        <Switch
          checked={asset.tradingEnabled}
          onCheckedChange={(v) => handleToggle("tradingEnabled", v)}
          disabled={updateToggleMutation.isPending}
          className="scale-90"
        />
      </TableCell>
      <TableCell className="text-center">
        <Switch
          checked={asset.depositsEnabled}
          onCheckedChange={(v) => handleToggle("depositsEnabled", v)}
          disabled={updateToggleMutation.isPending}
          className="scale-90"
        />
      </TableCell>
      <TableCell className="text-center">
        <Switch
          checked={asset.withdrawalsEnabled}
          onCheckedChange={(v) => handleToggle("withdrawalsEnabled", v)}
          disabled={updateToggleMutation.isPending}
          className="scale-90"
        />
      </TableCell>
    </TableRow>
  );
}
