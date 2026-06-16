"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Wallet,
  ArrowRightLeft,
  AlertTriangle,
  History,
  CheckCircle2,
  Clock,
  Send,
  Loader2,
  ShieldAlert,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

import { liquidityApi } from "@/api/liquidity";
import { useAuditedMutation } from "@/hooks/use-audited-mutation";

export default function LiquidityPage() {
  const { data: wallets, isLoading: isLoadingWallets } = useQuery({
    queryKey: ["liquidity", "wallets"],
    queryFn: () => liquidityApi.getWallets(),
  });

  const { data: adjustments, isLoading: isLoadingAdjustments } = useQuery({
    queryKey: ["liquidity", "adjustments", "pending"],
    queryFn: () => liquidityApi.getPendingAdjustments(),
  });

  const [adjustmentOpen, setAdjustmentOpen] = React.useState(false);
  const [selectedAsset, setSelectedAsset] = React.useState<string>("");
  const [adjustmentType, setAdjustmentType] = React.useState<"CREDIT" | "DEBIT">("CREDIT");
  const [amount, setAmount] = React.useState("");
  const [reason, setReason] = React.useState("");

  const initiateAdjustmentMutation = useAuditedMutation({
    action: "initiate_liquidity_adjustment",
    mutationFn: () =>
      liquidityApi.initiateAdjustment({
        asset: selectedAsset,
        type: adjustmentType,
        amount: parseFloat(amount),
        reason,
      }),
    invalidateKeys: [["liquidity", "adjustments", "pending"]],
    successMessage: "Adjustment sent for Maker-Checker approval",
    onSuccess: () => {
      setAdjustmentOpen(false);
      setSelectedAsset("");
      setAmount("");
      setReason("");
    },
  });

  const resolveAdjustmentMutation = useAuditedMutation({
    action: "resolve_liquidity_adjustment",
    mutationFn: ({ id, status }: { id: string; status: "APPROVED" | "REJECTED" }) =>
      liquidityApi.resolveAdjustment(id, status),
    invalidateKeys: [["liquidity", "wallets"], ["liquidity", "adjustments", "pending"]],
    successMessage: "Adjustment resolved successfully",
  });

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Wallet className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Liquidity Management</h1>
            <p className="text-sm text-muted-foreground">
              Monitor treasury balances and manage hot/cold wallet distribution
            </p>
          </div>
        </div>
        <Dialog open={adjustmentOpen} onOpenChange={setAdjustmentOpen}>
          <DialogTrigger render={<Button className="gap-2" />}>
            <ArrowRightLeft className="size-4" />
            New Adjustment
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Initiate Liquidity Adjustment</DialogTitle>
              <DialogDescription>
                Propose a manual credit or debit to the treasury. Requires Maker-Checker approval.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="asset">Asset</Label>
                <Select value={selectedAsset} onValueChange={(v) => { if (v !== null) setSelectedAsset(v); }}>
                  <SelectTrigger id="asset">
                    <SelectValue placeholder="Select asset" />
                  </SelectTrigger>
                  <SelectContent>
                    {wallets?.map((w) => (
                      <SelectItem key={w.asset} value={w.asset}>
                        {w.name} ({w.asset})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={adjustmentType} onValueChange={(v) => { if (v !== null) setAdjustmentType(v as "CREDIT" | "DEBIT"); }}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CREDIT">Credit (Add)</SelectItem>
                      <SelectItem value="DEBIT">Debit (Remove)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reason">Reason / Memo</Label>
                <Textarea
                  id="reason"
                  placeholder="e.g., Transfer from cold storage"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAdjustmentOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => initiateAdjustmentMutation.mutate()}
                disabled={!selectedAsset || !amount || parseFloat(amount) <= 0 || !reason || initiateAdjustmentMutation.isPending}
                className="gap-2"
              >
                {initiateAdjustmentMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                Submit Proposal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pending Adjustments Queue */}
      {adjustments && adjustments.length > 0 && (
        <Card className="border-orange-500/20 bg-orange-500/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-5 text-orange-600" />
              <CardTitle className="text-lg">Pending Maker-Checker Approvals</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {adjustments.map((adj) => (
              <div key={adj.id} className="flex flex-col gap-3 rounded-lg border bg-background p-4">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1">
                    <Badge variant="outline" className={adj.type === "CREDIT" ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" : "text-amber-600 bg-amber-500/10 border-amber-500/20"}>
                      {adj.type} {adj.asset}
                    </Badge>
                    <span className="font-mono text-lg font-semibold">{adj.amount}</span>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(adj.initiatedAt).toLocaleDateString("en-GB", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{adj.reason}</p>
                <div className="text-xs font-medium text-muted-foreground">Proposed by: {adj.initiatedBy}</div>
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => resolveAdjustmentMutation.mutate({ id: adj.id, status: "APPROVED" })}
                    disabled={resolveAdjustmentMutation.isPending}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                    onClick={() => resolveAdjustmentMutation.mutate({ id: adj.id, status: "REJECTED" })}
                    disabled={resolveAdjustmentMutation.isPending}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Wallet Balances */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoadingWallets ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2"><Skeleton className="h-5 w-24" /></CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-4 w-20" />
              </CardContent>
            </Card>
          ))
        ) : wallets?.map((wallet) => (
          <Card key={wallet.asset} className={wallet.isLowBalance ? "border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.1)]" : ""}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <div className="flex size-6 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
                  {wallet.asset[0]}
                </div>
                {wallet.name}
              </CardTitle>
              {wallet.isLowBalance && (
                <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20 gap-1">
                  <AlertTriangle className="size-3" />
                  Low Balance
                </Badge>
              )}
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex flex-col">
                <span className="text-2xl font-bold tracking-tight font-mono">
                  {(wallet.hotWallet + wallet.coldWallet).toLocaleString(undefined, { maximumFractionDigits: 4 })} {wallet.asset}
                </span>
                <span className="text-sm text-muted-foreground font-mono">
                  ${wallet.totalUsdValue.toLocaleString()} USD
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/50 p-3 text-sm">
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">Hot Wallet</span>
                  <span className="font-mono font-medium">{wallet.hotWallet.toLocaleString()}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">Cold Storage</span>
                  <span className="font-mono font-medium">{wallet.coldWallet.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0 flex justify-between items-center text-xs text-muted-foreground">
              <span>Threshold: {wallet.lowBalanceThreshold} {wallet.asset}</span>
              <span className="flex items-center gap-1"><Clock className="size-3" /> Updated</span>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
