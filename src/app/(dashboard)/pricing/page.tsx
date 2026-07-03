"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Coins, Plus, Save, Loader2, Trash2 } from "lucide-react";

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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
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

import { pricingApi } from "@/api/pricing";
import type {
  AssetSpreadResponse,
  AssetResponse,
  FeeRuleTypeEnum,
  FeeCalculationTypeEnum,
} from "@/api/schema";
import { useAuditedMutation } from "@/hooks/use-audited-mutation";

const FEE_TYPES: FeeRuleTypeEnum[] = ["WITHDRAWAL", "SWAP", "VAS"];
const FEE_CALC: FeeCalculationTypeEnum[] = ["FLAT", "PERCENTAGE"];

export default function PricingPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <Coins className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Pricing & Fees</h1>
          <p className="text-sm text-muted-foreground">
            Configure asset-pair spreads, fee rules, and asset availability
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SpreadsCard />
        <AssetsCard />
        <FeesCard />
      </div>
    </div>
  );
}

// ── Spreads ───────────────────────────────────────────────────────────────────

function SpreadsCard() {
  const { data, isLoading } = useQuery({
    queryKey: ["pricing", "spreads"],
    queryFn: () => pricingApi.listSpreads(),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-lg">Asset Pair Spreads</CardTitle>
          <CardDescription>Markup applied over market rates</CardDescription>
        </div>
        <CreateSpreadDialog />
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Pair</TableHead>
                <TableHead className="w-[220px] text-right">Spread</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="ml-auto h-8 w-32" /></TableCell>
                  </TableRow>
                ))
              ) : data?.length ? (
                data.map((s) => <SpreadRow key={s.id} spread={s} />)
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="h-20 text-center text-sm text-muted-foreground">
                    No spreads configured
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function SpreadRow({ spread }: { spread: AssetSpreadResponse }) {
  const [value, setValue] = React.useState(spread.spread);
  const dirty = value !== spread.spread;

  const mutation = useAuditedMutation({
    action: "update_spread",
    mutationFn: () => pricingApi.updateSpread(spread.assetPair, { spread: parseFloat(value) }),
    invalidateKeys: [["pricing", "spreads"]],
    successMessage: `${spread.assetPair} spread updated`,
  });

  return (
    <TableRow>
      <TableCell className="font-medium">{spread.assetPair}</TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-2">
          <Input
            type="number"
            step="any"
            min="0"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-8 w-28 text-right"
          />
          {dirty && (
            <Button
              size="icon"
              variant="ghost"
              className="size-8 text-primary"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

function CreateSpreadDialog() {
  const [open, setOpen] = React.useState(false);
  const [assetPair, setAssetPair] = React.useState("");
  const [spread, setSpread] = React.useState("");

  const mutation = useAuditedMutation({
    action: "create_spread",
    mutationFn: () => pricingApi.createSpread({ assetPair, spread: parseFloat(spread) }),
    invalidateKeys: [["pricing", "spreads"]],
    successMessage: "Spread created",
    onSuccess: () => {
      setOpen(false);
      setAssetPair("");
      setSpread("");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="outline" size="sm" className="gap-1">
          <Plus className="size-4" />
          Add
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New asset pair spread</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="pair">Asset pair</Label>
            <Input id="pair" placeholder="BTC/NGN" value={assetPair} onChange={(e) => setAssetPair(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="spread">Spread</Label>
            <Input id="spread" type="number" step="any" min="0" value={spread} onChange={(e) => setSpread(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => assetPair && spread && mutation.mutate()} disabled={!assetPair || !spread || mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Assets ────────────────────────────────────────────────────────────────────

function AssetsCard() {
  const { data, isLoading } = useQuery({
    queryKey: ["pricing", "assets"],
    queryFn: () => pricingApi.listAssets(),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-lg">Asset Availability</CardTitle>
          <CardDescription>Enable or disable assets platform-wide</CardDescription>
        </div>
        <CreateAssetDialog />
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead className="text-center">Enabled</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="mx-auto h-5 w-8 rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : data?.length ? (
                data.map((a) => <AssetRow key={a.id} asset={a} />)
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="h-20 text-center text-sm text-muted-foreground">
                    No assets registered
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function AssetRow({ asset }: { asset: AssetResponse }) {
  const mutation = useAuditedMutation({
    action: "toggle_asset",
    mutationFn: (enabled: boolean) => pricingApi.toggleAsset(asset.asset, { enabled }),
    invalidateKeys: [["pricing", "assets"]],
    successMessage: `${asset.asset} updated`,
  });

  return (
    <TableRow>
      <TableCell className="font-medium">{asset.asset}</TableCell>
      <TableCell className="text-center">
        <Switch
          checked={asset.enabled}
          onCheckedChange={(v) => mutation.mutate(!!v)}
          disabled={mutation.isPending}
          className="scale-90"
        />
      </TableCell>
    </TableRow>
  );
}

function CreateAssetDialog() {
  const [open, setOpen] = React.useState(false);
  const [asset, setAsset] = React.useState("");

  const mutation = useAuditedMutation({
    action: "create_asset",
    mutationFn: () => pricingApi.createAsset({ asset: asset.toUpperCase() }),
    invalidateKeys: [["pricing", "assets"]],
    successMessage: "Asset created",
    onSuccess: () => {
      setOpen(false);
      setAsset("");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="outline" size="sm" className="gap-1">
          <Plus className="size-4" />
          Add
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Register asset</DialogTitle>
        </DialogHeader>
        <Input placeholder="BTC" value={asset} onChange={(e) => setAsset(e.target.value)} />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => asset && mutation.mutate()} disabled={!asset || mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Fees ──────────────────────────────────────────────────────────────────────

function FeesCard() {
  const { data, isLoading } = useQuery({
    queryKey: ["pricing", "fees"],
    queryFn: () => pricingApi.listFees(),
  });

  const deactivate = useAuditedMutation({
    action: "deactivate_fee",
    mutationFn: (feeId: string) => pricingApi.deactivateFee(feeId),
    invalidateKeys: [["pricing", "fees"]],
    successMessage: "Fee rule deactivated",
  });

  return (
    <Card className="xl:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-lg">Fee Rules</CardTitle>
          <CardDescription>Active fee rules by transaction type</CardDescription>
        </div>
        <CreateFeeDialog />
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Calculation</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data?.length ? (
                data.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>
                      <Badge variant="outline">{f.type}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{f.feeType}</TableCell>
                    <TableCell className="text-right font-mono">
                      {f.amount}
                      {f.feeType === "PERCENTAGE" ? "%" : ""}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{f.tier ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{f.asset ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => deactivate.mutate(f.id)}
                        disabled={deactivate.isPending}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-20 text-center text-sm text-muted-foreground">
                    No active fee rules
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateFeeDialog() {
  const [open, setOpen] = React.useState(false);
  const [type, setType] = React.useState<FeeRuleTypeEnum>("WITHDRAWAL");
  const [feeType, setFeeType] = React.useState<FeeCalculationTypeEnum>("FLAT");
  const [amount, setAmount] = React.useState("");
  const [tier, setTier] = React.useState("");
  const [asset, setAsset] = React.useState("");

  const mutation = useAuditedMutation({
    action: "create_fee",
    mutationFn: () =>
      pricingApi.createFee({
        type,
        feeType,
        amount: parseFloat(amount),
        tier: tier || undefined,
        asset: asset || undefined,
      }),
    invalidateKeys: [["pricing", "fees"]],
    successMessage: "Fee rule created",
    onSuccess: () => {
      setOpen(false);
      setAmount("");
      setTier("");
      setAsset("");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="outline" size="sm" className="gap-1">
          <Plus className="size-4" />
          Add fee
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New fee rule</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as FeeRuleTypeEnum)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FEE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Calculation</Label>
              <Select value={feeType} onValueChange={(v) => setFeeType(v as FeeCalculationTypeEnum)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FEE_CALC.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="fee-amount">Amount</Label>
            <Input id="fee-amount" type="number" step="any" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="fee-tier">Tier (optional)</Label>
              <Input id="fee-tier" value={tier} onChange={(e) => setTier(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fee-asset">Asset (optional)</Label>
              <Input id="fee-asset" value={asset} onChange={(e) => setAsset(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => amount && mutation.mutate()} disabled={!amount || mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
