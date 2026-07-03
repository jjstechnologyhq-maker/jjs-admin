"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { ShieldAlert, Plus, Trash2, Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
  DialogDescription,
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
import { CursorPagination } from "@/components/cursor-pagination";
import { useCursorList } from "@/hooks/use-cursor-list";
import { riskApi } from "@/api/risk";
import type { RiskActionEnum, FlaggedTransactionResponse } from "@/api/schema";
import { useAuditedMutation } from "@/hooks/use-audited-mutation";
import { formatMoney } from "@/lib/money";

const ACTIONS: RiskActionEnum[] = ["FLAG", "BLOCK", "NOTIFY"];

export default function RiskPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <ShieldAlert className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Risk &amp; Compliance</h1>
          <p className="text-sm text-muted-foreground">
            Automated risk rules and manually flagged transactions
          </p>
        </div>
      </div>

      <RulesCard />
      <FlaggedCard />
    </div>
  );
}

function RulesCard() {
  const { data, isLoading } = useQuery({
    queryKey: ["risk", "rules"],
    queryFn: () => riskApi.listRules(),
  });

  const deactivate = useAuditedMutation({
    action: "deactivate_risk_rule",
    mutationFn: (id: string) => riskApi.deactivateRule(id),
    invalidateKeys: [["risk", "rules"]],
    successMessage: "Rule deactivated",
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-lg">Risk Rules</CardTitle>
          <CardDescription>Active automated evaluation rules</CardDescription>
        </div>
        <CreateRuleDialog />
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Conditions</TableHead>
                <TableHead className="text-right">Manage</TableHead>
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
                data.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="max-w-xs truncate">{rule.description ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{rule.action}</Badge>
                    </TableCell>
                    <TableCell>
                      {rule.isDryRun ? (
                        <Badge variant="outline" className="border-blue-500/20 bg-blue-500/10 text-blue-600">
                          Dry run
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600">
                          Live
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate font-mono text-xs text-muted-foreground">
                      {JSON.stringify(rule.conditions)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => deactivate.mutate(rule.id)}
                        disabled={deactivate.isPending}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-20 text-center text-sm text-muted-foreground">
                    No active risk rules
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

function CreateRuleDialog() {
  const [open, setOpen] = React.useState(false);
  const [description, setDescription] = React.useState("");
  const [action, setAction] = React.useState<RiskActionEnum>("FLAG");
  const [isDryRun, setIsDryRun] = React.useState(true);
  const [conditions, setConditions] = React.useState('{\n  "amountMin": 1000000\n}');

  const mutation = useAuditedMutation({
    action: "create_risk_rule",
    mutationFn: () => {
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(conditions);
      } catch {
        throw new Error("Conditions must be valid JSON");
      }
      return riskApi.createRule({
        conditions: parsed,
        action,
        description: description || undefined,
        isDryRun,
      });
    },
    invalidateKeys: [["risk", "rules"]],
    successMessage: "Rule created",
    onSuccess: () => {
      setOpen(false);
      setDescription("");
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button size="sm" className="gap-1">
          <Plus className="size-4" />
          New rule
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New risk rule</DialogTitle>
          <DialogDescription>Rules activate within ~10 seconds.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="rule-desc">Description</Label>
            <Input id="rule-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Action</Label>
            <Select value={action} onValueChange={(v) => setAction(v as RiskActionEnum)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ACTIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="rule-conditions">Conditions (JSON)</Label>
            <Textarea
              id="rule-conditions"
              className="font-mono text-xs"
              rows={5}
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={isDryRun} onCheckedChange={(v) => setIsDryRun(!!v)} />
            Dry run (evaluate without enforcing)
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FlaggedCard() {
  const list = useCursorList({
    queryKey: ["risk", "flagged"],
    limit: 50,
    fetcher: ({ cursor, limit }) => riskApi.listFlagged({ cursor, limit }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Flagged Transactions</CardTitle>
        <CardDescription>Transactions flagged by rules or manually</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>TX ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : list.items.length ? (
                list.items.map((tx) => <FlaggedRow key={tx.id} tx={tx} />)
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-20 text-center text-sm text-muted-foreground">
                    No flagged transactions
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
          itemLabel="flag"
        />
      </CardContent>
    </Card>
  );
}

function FlaggedRow({ tx }: { tx: FlaggedTransactionResponse }) {
  const [open, setOpen] = React.useState(false);
  const [justification, setJustification] = React.useState("");

  const unflag = useAuditedMutation({
    action: "unflag_transaction",
    mutationFn: () => riskApi.unflag(tx.id, { justification }),
    invalidateKeys: [["risk", "flagged"]],
    successMessage: "Flag cleared",
    onSuccess: () => {
      setOpen(false);
      setJustification("");
    },
  });

  return (
    <TableRow>
      <TableCell className="font-mono text-xs text-muted-foreground" title={tx.id}>
        {tx.id.slice(0, 8)}…
      </TableCell>
      <TableCell>
        <Badge variant="outline">{tx.type}</Badge>
      </TableCell>
      <TableCell className="font-medium">{formatMoney(tx.amount, tx.asset)}</TableCell>
      <TableCell>
        <Badge variant="outline" className="gap-1">
          <Flag className="size-3" />
          {tx.flaggedBy ?? "—"}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <Button variant="ghost" size="sm">Unflag</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove flag</DialogTitle>
              <DialogDescription>A justification is required for the audit trail.</DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Justification (required)"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                onClick={() => justification.trim() && unflag.mutate()}
                disabled={!justification.trim() || unflag.isPending}
              >
                {unflag.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Unflag
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </TableCell>
    </TableRow>
  );
}
