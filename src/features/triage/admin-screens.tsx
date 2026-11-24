import { useState } from "react";
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Cpu,
  Search,
  Ticket,
  UsersRound,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { demoTickets, weeklyVolume } from "./demo-data";
import { EmptyState, Metric, PageHeading, PreviewNotice, SectionTitle, StatusBadge, TicketTable } from "./primitives";
import { statusLabels, ticketStatuses, type Ticket as TicketRecord, type TicketStatus } from "./model";

const categoryData = [
  { name: "Network", count: 29 },
  { name: "Accounts", count: 21 },
  { name: "Software", count: 18 },
  { name: "Hardware", count: 14 },
  { name: "Email", count: 11 },
];

const statusData = [
  { name: "In progress", value: 34, color: "var(--chart-2)" },
  { name: "Waiting", value: 22, color: "var(--chart-3)" },
  { name: "Resolved", value: 28, color: "var(--chart-1)" },
  { name: "Escalated", value: 16, color: "var(--chart-4)" },
];

function ChartFrame({ title, caption, children }: { title: string; caption: string; children: ReactNode }) {
  return (
    <section className="rounded-md border border-border bg-card p-5 sm:p-6">
      <SectionTitle title={title} detail={caption} />
      <div className="h-56 w-full">{children}</div>
    </section>
  );
}

export function AdminDashboard() {
  return (
    <>
      <PreviewNotice>Analytics below are illustrative sample data for the interface preview, not live service metrics.</PreviewNotice>
      <PageHeading eyebrow="Operations center" title="Support overview" description="A clear view of incoming requests, escalations, and support activity." actions={<Button variant="outline" asChild><Link to="/admin/tickets">View all tickets<ArrowUpRight /></Link></Button>} />
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Total tickets" value="128" note="Illustrative sample" icon={Ticket} />
        <Metric label="Open" value="34" note="Across active queues" icon={Clock3} tone="blue" />
        <Metric label="Waiting for user" value="22" note="Needs a reply" icon={UsersRound} tone="warning" />
        <Metric label="Escalated" value="16" note="Human support review" icon={AlertTriangle} tone="critical" />
        <Metric label="Resolved" value="56" note="Sample total" icon={CheckCircle2} />
      </div>
      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartFrame title="Ticket volume" caption="Illustrative tickets this week">
          <ResponsiveContainer width="100%" height="100%"><AreaChart data={weeklyVolume} margin={{ top: 10, right: 5, left: -22, bottom: 0 }}><defs><linearGradient id="ticket-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.22} /><stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.01} /></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} /><YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} /><Tooltip contentStyle={{ borderRadius: 8, borderColor: "var(--border)", background: "var(--popover)", color: "var(--popover-foreground)" }} /><Area type="monotone" dataKey="tickets" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#ticket-area)" /></AreaChart></ResponsiveContainer>
        </ChartFrame>
        <ChartFrame title="Requests by category" caption="Illustrative sample distribution">
          <ResponsiveContainer width="100%" height="100%"><BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 12, left: 8, bottom: 0 }}><CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" /><XAxis type="number" hide /><YAxis type="category" dataKey="name" width={74} tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} /><Tooltip cursor={{ fill: "var(--muted)" }} contentStyle={{ borderRadius: 8, borderColor: "var(--border)", background: "var(--popover)", color: "var(--popover-foreground)" }} /><Bar dataKey="count" fill="var(--chart-1)" radius={[0, 4, 4, 0]} barSize={17} /></BarChart></ResponsiveContainer>
        </ChartFrame>
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(260px,0.7fr)]">
        <section className="rounded-md border border-border bg-card p-5 sm:p-6">
          <SectionTitle title="Recently updated" detail="Sample tickets across the support queue" action={<Button variant="ghost" size="sm" asChild><Link to="/admin/tickets">All tickets<ArrowUpRight /></Link></Button>} />
          <TicketTable tickets={demoTickets.slice(0, 4)} showEmployee />
        </section>
        <section className="rounded-md border border-border bg-card p-5 sm:p-6">
          <SectionTitle title="Status mix" detail="Illustrative distribution" />
          <div className="relative h-52">
            <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statusData} dataKey="value" nameKey="name" innerRadius={56} outerRadius={82} paddingAngle={3} stroke="var(--card)">{statusData.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip contentStyle={{ borderRadius: 8, borderColor: "var(--border)", background: "var(--popover)", color: "var(--popover-foreground)" }} /></PieChart></ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-2xl font-semibold">128</span><span className="text-[11px] text-muted-foreground">tickets</span></div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2">{statusData.map((item) => <div key={item.name} className="flex items-center gap-2 text-xs text-muted-foreground"><span className={`size-2 rounded-full ${item.name === "In progress" ? "bg-chart-2" : item.name === "Waiting" ? "bg-chart-3" : item.name === "Resolved" ? "bg-chart-1" : "bg-chart-4"}`} />{item.name}<span className="ml-auto font-medium text-foreground">{item.value}%</span></div>)}</div>
        </section>
      </div>
    </>
  );
}

export function AdminTickets() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const filtered = demoTickets.filter((ticket) => `${ticket.id} ${ticket.title} ${ticket.employee}`.toLowerCase().includes(query.toLowerCase()) && (status === "all" || ticket.status === status));
  return (
    <>
      <PreviewNotice>This is an illustrative queue. Search and status filters run in your browser only.</PreviewNotice>
      <PageHeading eyebrow="Operations center" title="All tickets" description="Review requests across the support queue and inspect their current status." />
      <section className="rounded-md border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tickets or employees" aria-label="Search tickets or employees" className="h-10 pl-9" /></div>
          <Select value={status} onValueChange={setStatus}><SelectTrigger className="h-10 w-full sm:w-48"><SelectValue placeholder="All statuses" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{ticketStatuses.map((item) => <SelectItem key={item} value={item}>{statusLabels[item]}</SelectItem>)}</SelectContent></Select>
        </div>
        <TicketTable tickets={filtered} showEmployee />
        <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">Showing {filtered.length} of {demoTickets.length} sample tickets</div>
      </section>
    </>
  );
}

type Escalation = TicketRecord & { reason: string; team: string };
const initialEscalations: Escalation[] = demoTickets.filter((ticket) => ticket.status === "ESCALATED").map((ticket) => ({
  ...ticket,
  team: ticket.team ?? "Unassigned",
  reason: ticket.priority === "Critical" ? "Urgent account security review" : "Hardware issue needs hands-on assessment",
}));

export function Escalations() {
  const [items, setItems] = useState(initialEscalations);
  const updateTeam = (id: string, team: string) => setItems((current) => current.map((item) => item.id === id ? { ...item, team } : item));
  const updateStatus = (id: string, status: TicketStatus) => setItems((current) => current.map((item) => item.id === id ? { ...item, status } : item));
  return (
    <>
      <PreviewNotice>Team assignments and status changes below are temporary browser-only previews. No support team is notified.</PreviewNotice>
      <PageHeading eyebrow="Operations center" title="Escalations" description="Coordinate requests that need human support attention." />
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3"><Metric label="Needs assignment" value={`${items.filter((item) => item.team === "Unassigned").length}`} note="Sample escalations" icon={AlertTriangle} tone="critical" /><Metric label="Assigned" value={`${items.filter((item) => item.team !== "Unassigned").length}`} note="Sample team ownership" icon={UsersRound} tone="blue" /><Metric label="In progress" value={`${items.filter((item) => item.status === "ANALYZING").length}`} note="Temporary preview state" icon={Clock3} tone="warning" /></div>
      <section className="rounded-md border border-border bg-card p-4 sm:p-6">
        <SectionTitle title="Escalated requests" detail={`${items.length} sample records`} />
        {items.length === 0 ? <EmptyState title="No escalations in this preview" description="Escalated requests will appear here when a live service is connected." /> : (
          <div className="space-y-3">
            {items.map((item) => (
              <article key={item.id} className="grid grid-cols-1 gap-4 rounded-md border border-border p-4 lg:grid-cols-[minmax(0,1fr)_190px_190px] lg:items-center">
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-semibold text-muted-foreground">{item.id}</span><StatusBadge status={item.status} /></div><h3 className="mt-2 font-semibold">{item.title}</h3><p className="mt-1 text-sm text-muted-foreground">{item.reason}</p><p className="mt-2 text-xs text-muted-foreground">{item.employee} · {item.category} · {item.created}</p></div>
                <div className="space-y-2"><label className="text-xs font-medium text-muted-foreground">Assigned team</label><Select value={item.team} onValueChange={(value) => updateTeam(item.id, value)}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Unassigned">Unassigned</SelectItem><SelectItem value="Workplace IT">Workplace IT</SelectItem><SelectItem value="Security Operations">Security Operations</SelectItem><SelectItem value="Network Support">Network Support</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><label className="text-xs font-medium text-muted-foreground">Preview status</label><Select value={item.status} onValueChange={(value) => updateStatus(item.id, value as TicketStatus)}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent>{ticketStatuses.map((status) => <SelectItem key={status} value={status}>{statusLabels[status]}</SelectItem>)}</SelectContent></Select></div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export function AgentActivity() {
  return (
    <>
      <PageHeading eyebrow="Operations center" title="Agent activity" description="Review processing activity and service health once the agent service is connected." />
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2"><Metric label="Agent runs" value="—" note="No live service connected" icon={Cpu} /><Metric label="Average response time" value="—" note="No measured activity" icon={Activity} tone="blue" /></div>
      <section className="rounded-md border border-border bg-card p-5 sm:p-7"><EmptyState icon={Activity} title="No agent activity recorded" description="This preview does not generate simulated AI responses or performance statistics. Connect an agent service to show real runs, outcomes, retrieval details, and errors." /></section>
    </>
  );
}

export function AdminProfile() {
  return (
    <>
      <PageHeading eyebrow="Account" title="Administrator profile" description="Profile details for the sample operations workspace." />
      <section className="max-w-3xl rounded-md border border-border bg-card p-5 sm:p-7">
        <div className="flex items-center gap-4 border-b border-border pb-6"><span className="grid size-14 place-items-center rounded-full bg-accent text-base font-semibold text-accent-foreground">CM</span><div><h2 className="font-semibold">Casey Morgan</h2><p className="mt-1 text-sm text-muted-foreground">IT administrator · Preview only</p></div></div>
        <dl className="grid grid-cols-1 gap-x-8 gap-y-5 pt-6 sm:grid-cols-2"><div><dt className="text-xs text-muted-foreground">Email address</dt><dd className="mt-1 break-all text-sm font-medium">casey.morgan@example.com</dd></div><div><dt className="text-xs text-muted-foreground">Role</dt><dd className="mt-1 text-sm font-medium">Administrator (sample view)</dd></div></dl>
        <div className="mt-6"><PreviewNotice>Role access, account changes, and sign-out are not implemented in this frontend-only preview.</PreviewNotice></div>
      </section>
    </>
  );
}