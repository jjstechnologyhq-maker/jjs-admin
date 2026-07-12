"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Zap, Plus, Loader2 } from "lucide-react";

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
import { StatusBadge, type StatusMeta } from "@/components/status-badge";
import { vasApi } from "@/api/vas";
import type { VasCategoryEnum } from "@/api/schema";
import { useAuditedMutation } from "@/hooks/use-audited-mutation";
import { formatAmount } from "@/lib/money";

const CATEGORIES: VasCategoryEnum[] = ["AIRTIME", "DATA", "BILLS", "UTILITIES"];

const PROVIDER_STATUS: Record<string, StatusMeta> = {
  ONLINE: { label: "Online", tone: "green" },
  DEGRADED: { label: "Degraded", tone: "amber" },
  OFFLINE: { label: "Offline", tone: "red" },
};

export default function VasPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <Zap className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Value-Added Services</h1>
          <p className="text-sm text-muted-foreground">
            Manage VAS providers and products
          </p>
        </div>
      </div>

      <ProvidersCard />
      <ProductsCard />
    </div>
  );
}

function ProvidersCard() {
  const { data, isLoading } = useQuery({
    queryKey: ["vas", "providers"],
    queryFn: () => vasApi.listProviders(),
  });

  const toggle = useAuditedMutation({
    action: "toggle_vas_provider",
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      vasApi.toggleProvider(id, { enabled }),
    invalidateKeys: [["vas", "providers"]],
    successMessage: "Provider updated",
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-lg">Providers</CardTitle>
          <CardDescription>Health is refreshed by a worker every 30s</CardDescription>
        </div>
        <CreateProviderDialog />
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Health</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-center">Enabled</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data?.length ? (
                data.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.category}</TableCell>
                    <TableCell>
                      <StatusBadge value={p.status} config={PROVIDER_STATUS} />
                    </TableCell>
                    <TableCell className="text-right font-mono">{formatAmount(p.balance)}</TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={p.isEnabled}
                        onCheckedChange={(v) => toggle.mutate({ id: p.id, enabled: !!v })}
                        disabled={toggle.isPending}
                        className="scale-90"
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-20 text-center text-sm text-muted-foreground">
                    No providers
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

function CreateProviderDialog() {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState<VasCategoryEnum>("AIRTIME");
  const [healthCheckUrl, setHealthCheckUrl] = React.useState("");
  const [balance, setBalance] = React.useState("");

  const mutation = useAuditedMutation({
    action: "create_vas_provider",
    mutationFn: () =>
      vasApi.createProvider({
        name,
        category,
        healthCheckUrl,
        balance: parseFloat(balance || "0"),
      }),
    invalidateKeys: [["vas", "providers"]],
    successMessage: "Provider created",
    onSuccess: () => {
      setOpen(false);
      setName("");
      setHealthCheckUrl("");
      setBalance("");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button size="sm" className="gap-1">
          <Plus className="size-4" />
          Provider
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New VAS provider</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="p-name">Name</Label>
            <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as VasCategoryEnum)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="p-url">Health check URL</Label>
            <Input id="p-url" placeholder="https://…" value={healthCheckUrl} onChange={(e) => setHealthCheckUrl(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="p-balance">Initial balance</Label>
            <Input id="p-balance" type="number" step="any" min="0" value={balance} onChange={(e) => setBalance(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => name && healthCheckUrl && mutation.mutate()} disabled={!name || !healthCheckUrl || mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProductsCard() {
  const { data, isLoading } = useQuery({
    queryKey: ["vas", "products"],
    queryFn: () => vasApi.listProducts(),
  });
  const { data: providers } = useQuery({
    queryKey: ["vas", "providers"],
    queryFn: () => vasApi.listProviders(),
  });

  const toggle = useAuditedMutation({
    action: "toggle_vas_product",
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      vasApi.toggleProduct(id, { enabled }),
    invalidateKeys: [["vas", "products"]],
    successMessage: "Product updated",
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-lg">Products</CardTitle>
          <CardDescription>Products offered under each provider</CardDescription>
        </div>
        <CreateProductDialog providers={(providers ?? []).map((p) => ({ id: p.id, name: p.name }))} />
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-center">Enabled</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data?.length ? (
                data.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{p.sku}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.providerName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.category}</TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={p.isEnabled}
                        onCheckedChange={(v) => toggle.mutate({ id: p.id, enabled: !!v })}
                        disabled={toggle.isPending}
                        className="scale-90"
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-20 text-center text-sm text-muted-foreground">
                    No products
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

function CreateProductDialog({ providers }: { providers: { id: string; name: string }[] }) {
  const [open, setOpen] = React.useState(false);
  const [providerId, setProviderId] = React.useState("");
  const [name, setName] = React.useState("");
  const [sku, setSku] = React.useState("");
  const [category, setCategory] = React.useState<VasCategoryEnum>("AIRTIME");

  const mutation = useAuditedMutation({
    action: "create_vas_product",
    mutationFn: () => vasApi.createProduct({ providerId, name, sku, category }),
    invalidateKeys: [["vas", "products"]],
    successMessage: "Product created",
    onSuccess: () => {
      setOpen(false);
      setName("");
      setSku("");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button size="sm" className="gap-1">
          <Plus className="size-4" />
          Product
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New VAS product</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Provider</Label>
            <Select value={providerId} onValueChange={(v) => setProviderId(v ?? "")}>
              <SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger>
              <SelectContent>
                {providers.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pr-name">Name</Label>
            <Input id="pr-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pr-sku">SKU</Label>
            <Input id="pr-sku" value={sku} onChange={(e) => setSku(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as VasCategoryEnum)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={() => providerId && name && sku && mutation.mutate()}
            disabled={!providerId || !name || !sku || mutation.isPending}
          >
            {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
