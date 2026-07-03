"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Wallet,
  ArrowRightLeft,
  AlertTriangle,
  Plus,
  Loader2,
  Send,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

import { financeApi, isPendingAdjustment } from "@/api/finance";
import type { AdjustmentDirection, WalletType } from "@/api/schema";
import { useAuditedMutation } from "@/hooks/use-audited-mutation";
import { parseAmount, formatAmount } from "@/lib/money";

export default function LiquidityPage() {
  const { data: wallets, isLoading } = useQuery({
    queryKey: ["finance", "wallets"],
    queryFn: () => financeApi.listWallets(),
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
              Monitor wallet balances and make manual adjustments
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <CreateWalletDialog />
          <NewAdjustmentDialog assets={(wallets ?? []).map((w) => w.asset)} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-5 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="mb-2 h-8 w-32" />
                  <Skeleton className="h-4 w-20" />
                </CardContent>
              </Card>
            ))
          : (wallets ?? []).map((w) => {
              const low = parseAmount(w.balance) < parseAmount(w.alertThreshold);
              return (
                <Card key={w.id} className={low ? "border-orange-500/50" : ""}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="flex items-center gap-2 text-base font-medium">
                      <div className="flex size-6 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
                        {w.asset[0]}
                      </div>
                      {w.asset}
                    </CardTitle>
                    <Badge variant="outline">{w.walletType}</Badge>
                  </CardHeader>
                  <CardContent className="grid gap-2">
                    <span className="font-mono text-2xl font-bold tracking-tight">
                      {formatAmount(w.balance, w.asset)}
                    </span>
                    {low && (
                      <Badge
                        variant="outline"
                        className="w-fit gap-1 border-orange-500/20 bg-orange-500/10 text-orange-600"
                      >
                        <AlertTriangle className="size-3" />
                        Below threshold
                      </Badge>
                    )}
                  </CardContent>
                  <CardFooter className="flex items-center justify-between pt-0 text-xs text-muted-foreground">
                    <span>
                      Threshold: {formatAmount(w.alertThreshold, w.asset)} {w.asset}
                    </span>
                    <ThresholdDialog asset={w.asset} />
                  </CardFooter>
                </Card>
              );
            })}
        {!isLoading && (wallets ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">No wallet records yet.</p>
        )}
      </div>
    </div>
  );
}

function CreateWalletDialog() {
  const [open, setOpen] = React.useState(false);
  const [asset, setAsset] = React.useState("");
  const [walletType, setWalletType] = React.useState<WalletType>("HOT");
  const [alertThreshold, setAlertThreshold] = React.useState("");

  const mutation = useAuditedMutation({
    action: "create_wallet",
    mutationFn: () =>
      financeApi.createWallet({
        asset: asset.toUpperCase(),
        walletType,
        alertThreshold: alertThreshold ? parseFloat(alertThreshold) : undefined,
      }),
    invalidateKeys: [["finance", "wallets"]],
    successMessage: "Wallet created",
    onSuccess: () => {
      setOpen(false);
      setAsset("");
      setAlertThreshold("");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="outline" className="gap-2">
          <Plus className="size-4" />
          Wallet
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create wallet record</DialogTitle>
          <DialogDescription>Track balance for an asset (hot or cold).</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="w-asset">Asset</Label>
            <Input id="w-asset" placeholder="ETH" value={asset} onChange={(e) => setAsset(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Type</Label>
            <Select value={walletType} onValueChange={(v) => setWalletType(v as WalletType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HOT">Hot</SelectItem>
                <SelectItem value="COLD">Cold</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="w-threshold">Alert threshold (optional)</Label>
            <Input
              id="w-threshold"
              type="number"
              min="0"
              step="any"
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => asset && mutation.mutate()} disabled={!asset || mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ThresholdDialog({ asset }: { asset: string }) {
  const [open, setOpen] = React.useState(false);
  const [threshold, setThreshold] = React.useState("");

  const mutation = useAuditedMutation({
    action: "set_wallet_threshold",
    mutationFn: () => financeApi.setThreshold(asset, { asset, threshold: parseFloat(threshold) }),
    invalidateKeys: [["finance", "wallets"]],
    successMessage: "Threshold updated",
    onSuccess: () => setOpen(false),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alert threshold — {asset}</DialogTitle>
          <DialogDescription>
            The watcher fires an alert when the balance drops below this value.
          </DialogDescription>
        </DialogHeader>
        <Input
          type="number"
          min="0"
          step="any"
          placeholder="0.0"
          value={threshold}
          onChange={(e) => setThreshold(e.target.value)}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => threshold && mutation.mutate()} disabled={!threshold || mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewAdjustmentDialog({ assets }: { assets: string[] }) {
  const [open, setOpen] = React.useState(false);
  const [asset, setAsset] = React.useState("");
  const [direction, setDirection] = React.useState<AdjustmentDirection>("CREDIT");
  const [amount, setAmount] = React.useState("");
  const [reason, setReason] = React.useState("");

  const mutation = useAuditedMutation({
    action: "create_adjustment",
    mutationFn: () =>
      financeApi.createAdjustment({
        asset,
        direction,
        amount: parseFloat(amount),
        reason,
      }),
    invalidateKeys: [["finance", "wallets"]],
    onSuccess: (result) => {
      if (isPendingAdjustment(result)) {
        toast.success(
          `Above threshold — pending a second approver (id ${result.adjustmentId}).`,
        );
      } else {
        toast.success("Adjustment executed.");
      }
      setOpen(false);
      setAsset("");
      setAmount("");
      setReason("");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button className="gap-2">
          <ArrowRightLeft className="size-4" />
          New Adjustment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manual balance adjustment</DialogTitle>
          <DialogDescription>
            Below the NGN approval threshold executes immediately; above it needs a second admin.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Asset</Label>
            <Select value={asset} onValueChange={(v) => setAsset(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select asset" />
              </SelectTrigger>
              <SelectContent>
                {assets.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Direction</Label>
              <Select value={direction} onValueChange={(v) => setDirection(v as AdjustmentDirection)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CREDIT">Credit (add)</SelectItem>
                  <SelectItem value="DEBIT">Debit (remove)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="adj-amount">Amount</Label>
              <Input
                id="adj-amount"
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
            <Label htmlFor="adj-reason">Reason</Label>
            <Textarea
              id="adj-reason"
              placeholder="e.g. Reconciliation adjustment"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            className="gap-2"
            onClick={() => mutation.mutate()}
            disabled={
              !asset || !amount || parseFloat(amount) <= 0 || !reason || mutation.isPending
            }
          >
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
