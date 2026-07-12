"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Headphones, Plus, Send, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { CursorPagination } from "@/components/cursor-pagination";
import { useCursorList } from "@/hooks/use-cursor-list";
import { supportApi } from "@/api/support";
import type { TicketStatusEnum, BannerTypeEnum } from "@/api/schema";
import { useAuditedMutation } from "@/hooks/use-audited-mutation";

const TICKET_STATUS: Record<string, StatusMeta> = {
  OPEN: { label: "Open", tone: "blue" },
  IN_PROGRESS: { label: "In Progress", tone: "amber" },
  CLOSED: { label: "Closed", tone: "gray" },
};
const BANNER_TYPES: BannerTypeEnum[] = ["INFO", "WARNING", "MAINTENANCE"];
const TABS = ["Tickets", "Banners", "Templates", "Notify"] as const;

export default function SupportPage() {
  const [tab, setTab] = React.useState<(typeof TABS)[number]>("Tickets");

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <Headphones className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Support</h1>
          <p className="text-sm text-muted-foreground">
            Tickets, in-app banners, email templates, and push notifications
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Button key={t} variant={tab === t ? "default" : "outline"} size="sm" onClick={() => setTab(t)}>
            {t}
          </Button>
        ))}
      </div>

      {tab === "Tickets" && <TicketsPanel />}
      {tab === "Banners" && <BannersPanel />}
      {tab === "Templates" && <TemplatesPanel />}
      {tab === "Notify" && <NotifyPanel />}
    </div>
  );
}

// ── Tickets ─────────────────────────────────────────────────────────────────

function TicketsPanel() {
  const [status, setStatus] = React.useState<TicketStatusEnum | "ALL">("ALL");
  const [active, setActive] = React.useState<string | null>(null);

  const filters = { status: status === "ALL" ? undefined : status };
  const list = useCursorList({
    queryKey: ["support", "tickets"],
    resetToken: JSON.stringify(filters),
    limit: 50,
    fetcher: ({ cursor, limit }) => supportApi.listTickets({ ...filters, cursor, limit }),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {(["ALL", "OPEN", "IN_PROGRESS", "CLOSED"] as const).map((s) => (
          <Button key={s} variant={status === s ? "default" : "outline"} size="sm" onClick={() => setStatus(s)}>
            {s === "ALL" ? "All" : TICKET_STATUS[s].label}
          </Button>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 4 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : list.items.length ? (
              list.items.map((t) => (
                <TableRow key={t.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setActive(t.id)}>
                  <TableCell className="font-medium">{t.subject}</TableCell>
                  <TableCell><StatusBadge value={t.status} config={TICKET_STATUS} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(t.updatedAt).toLocaleDateString("en-GB")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Open →</Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-20 text-center text-sm text-muted-foreground">
                  No tickets
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
        itemLabel="ticket"
      />

      {active && <TicketDialog ticketId={active} onClose={() => setActive(null)} />}
    </div>
  );
}

const NEXT_STATUS: Record<TicketStatusEnum, TicketStatusEnum[]> = {
  OPEN: ["IN_PROGRESS", "CLOSED"],
  IN_PROGRESS: ["OPEN", "CLOSED"],
  CLOSED: [],
};

function TicketDialog({ ticketId, onClose }: { ticketId: string; onClose: () => void }) {
  const [reply, setReply] = React.useState("");
  const { data: ticket, isLoading } = useQuery({
    queryKey: ["support", "ticket", ticketId],
    queryFn: () => supportApi.getTicket(ticketId),
  });

  const invalidate = [["support", "ticket", ticketId], ["support", "tickets"]] as const;

  const sendReply = useAuditedMutation({
    action: "reply_ticket",
    mutationFn: () => supportApi.reply(ticketId, { body: reply }),
    invalidateKeys: [...invalidate],
    successMessage: "Reply sent",
    onSuccess: () => setReply(""),
  });
  const setStatus = useAuditedMutation({
    action: "update_ticket_status",
    mutationFn: (status: TicketStatusEnum) => supportApi.updateStatus(ticketId, { status }),
    invalidateKeys: [...invalidate],
    successMessage: "Status updated",
  });

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{ticket?.subject ?? "Ticket"}</DialogTitle>
        </DialogHeader>
        {isLoading || !ticket ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <StatusBadge value={ticket.status} config={TICKET_STATUS} />
              {NEXT_STATUS[ticket.status].map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant="outline"
                  onClick={() => setStatus.mutate(s)}
                  disabled={setStatus.isPending}
                >
                  → {TICKET_STATUS[s].label}
                </Button>
              ))}
            </div>

            <div className="rounded-md border bg-muted/30 p-3 text-sm">{ticket.body}</div>

            <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
              {(ticket.replies ?? []).map((r) => (
                <div key={r.id} className="rounded-md border p-2 text-sm">
                  <p>{r.body}</p>
                  <span className="text-xs text-muted-foreground">
                    {r.adminId} · {new Date(r.createdAt).toLocaleString("en-GB")}
                  </span>
                </div>
              ))}
            </div>

            {ticket.status !== "CLOSED" && (
              <div className="flex flex-col gap-2">
                <Textarea placeholder="Write a reply…" value={reply} onChange={(e) => setReply(e.target.value)} />
                <div className="flex justify-end">
                  <Button size="sm" onClick={() => reply.trim() && sendReply.mutate()} disabled={!reply.trim() || sendReply.isPending}>
                    {sendReply.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}
                    Reply
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Banners ─────────────────────────────────────────────────────────────────

function BannersPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["support", "banners"],
    queryFn: () => supportApi.listBanners(),
  });
  const del = useAuditedMutation({
    action: "delete_banner",
    mutationFn: (id: string) => supportApi.deleteBanner(id),
    invalidateKeys: [["support", "banners"]],
    successMessage: "Banner deleted",
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-lg">Banners</CardTitle>
          <CardDescription>Active in-app banners</CardDescription>
        </div>
        <CreateBannerDialog />
      </CardHeader>
      <CardContent className="grid gap-3">
        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : data?.length ? (
          data.map((b) => (
            <div key={b.id} className="flex items-center justify-between rounded-md border p-3">
              <div className="flex items-center gap-3">
                <Badge variant="outline">{b.type}</Badge>
                <span className="text-sm">{b.message}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => del.mutate(b.id)}
                disabled={del.isPending}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No active banners</p>
        )}
      </CardContent>
    </Card>
  );
}

function CreateBannerDialog() {
  const [open, setOpen] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [type, setType] = React.useState<BannerTypeEnum>("INFO");

  const mutation = useAuditedMutation({
    action: "create_banner",
    mutationFn: () => supportApi.createBanner({ message, type }),
    invalidateKeys: [["support", "banners"]],
    successMessage: "Banner created",
    onSuccess: () => {
      setOpen(false);
      setMessage("");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button size="sm" className="gap-1"><Plus className="size-4" />Banner</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New banner</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as BannerTypeEnum)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {BANNER_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="b-msg">Message</Label>
            <Textarea id="b-msg" value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => message && mutation.mutate()} disabled={!message || mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Templates ───────────────────────────────────────────────────────────────

function TemplatesPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["support", "templates"],
    queryFn: () => supportApi.listTemplates(),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-lg">Email Templates</CardTitle>
          <CardDescription>Handlebars templates for transactional email</CardDescription>
        </div>
        <CreateTemplateDialog />
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 3 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data?.length ? (
                data.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.subject}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(t.updatedAt).toLocaleDateString("en-GB")}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-20 text-center text-sm text-muted-foreground">
                    No templates
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

function CreateTemplateDialog() {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");

  const mutation = useAuditedMutation({
    action: "create_email_template",
    mutationFn: () => supportApi.createTemplate({ name, subject, body }),
    invalidateKeys: [["support", "templates"]],
    successMessage: "Template created",
    onSuccess: () => {
      setOpen(false);
      setName("");
      setSubject("");
      setBody("");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button size="sm" className="gap-1"><Plus className="size-4" />Template</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New email template</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="t-name">Name</Label>
            <Input id="t-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="t-subject">Subject</Label>
            <Input id="t-subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="t-body">Body (Handlebars)</Label>
            <Textarea id="t-body" className="font-mono text-xs" rows={6} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => name && subject && body && mutation.mutate()} disabled={!name || !subject || !body || mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Notify ──────────────────────────────────────────────────────────────────

function NotifyPanel() {
  const [userId, setUserId] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");

  const mutation = useAuditedMutation({
    action: "send_push_notification",
    mutationFn: () => supportApi.sendNotification({ userId, title, body }),
    successMessage: "Notification enqueued",
    onSuccess: (res) => {
      toast.success(`Queued (job ${res.jobId})`);
      setUserId("");
      setTitle("");
      setBody("");
    },
  });

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle className="text-lg">Send push notification</CardTitle>
        <CardDescription>Delivery is asynchronous</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="n-user">User ID</Label>
          <Input id="n-user" value={userId} onChange={(e) => setUserId(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="n-title">Title</Label>
          <Input id="n-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="n-body">Body</Label>
          <Textarea id="n-body" value={body} onChange={(e) => setBody(e.target.value)} />
        </div>
        <div className="flex justify-end">
          <Button
            onClick={() => userId && title && body && mutation.mutate()}
            disabled={!userId || !title || !body || mutation.isPending}
          >
            {mutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
