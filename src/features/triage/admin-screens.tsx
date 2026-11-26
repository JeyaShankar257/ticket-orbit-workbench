import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Cpu,
  LogOut,
  RefreshCw,
  Search,
  ShieldCheck,
  Ticket,
  UsersRound,
  Zap,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useAssignEscalation, useEscalations, useStaffAssignees, useTickets } from "@/lib/api";
import { demoAgentRuns } from "./demo-data";
import { getInitials, mapBackendTicketToDisplay } from "./mappers";
import {
  EmptyState,
  Metric,
  PageHeading,
  PreviewNotice,
  SectionTitle,
  StatusBadge,
  TicketTable,
} from "./primitives";
import { statusLabels, ticketStatuses } from "./model";

function AdminErrorBanner({
  title = "Unable to load data",
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-2.5">
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
        <div>
          <p className="font-semibold text-foreground">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{message}</p>
        </div>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onRetry} className="shrink-0">
        <RefreshCw className="mr-1.5 size-3.5" />
        Retry
      </Button>
    </div>
  );
}

function ChartFrame({
  title,
  caption,
  children,
}: {
  title: string;
  caption: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-md border border-border bg-card p-5 sm:p-6">
      <SectionTitle title={title} detail={caption} />
      <div className="h-56 w-full">{children}</div>
    </section>
  );
}

export function AdminDashboard() {
  const { data, isLoading, isError, error, refetch } = useTickets();
  const rawTickets = data ?? [];
  const tickets = rawTickets.map((t) => mapBackendTicketToDisplay(t));

  const openTickets = tickets.filter((t) => ["NEW", "ANALYZING"].includes(t.status));
  const waitingTickets = tickets.filter((t) =>
    ["WAITING_FOR_USER", "SOLUTION_SUGGESTED"].includes(t.status),
  );
  const escalatedTickets = tickets.filter((t) => t.status === "ESCALATED");
  const resolvedTickets = tickets.filter((t) => ["RESOLVED", "CLOSED"].includes(t.status));

  const categoryCounts = Array.from(
    tickets.reduce((map, ticket) => {
      map.set(ticket.category, (map.get(ticket.category) ?? 0) + 1);
      return map;
    }, new Map<string, number>()),
  ).map(([name, count]) => ({ name, count }));

  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const volumeByDay = weekdayLabels.map((day) => ({ day, tickets: 0 }));
  for (const raw of rawTickets) {
    const parsed = new Date(raw.created_at);
    if (!Number.isNaN(parsed.getTime())) {
      const bucket = volumeByDay[parsed.getDay()];
      if (bucket) bucket.tickets += 1;
    }
  }

  const totalCount = tickets.length;
  const pct = (count: number) => (totalCount > 0 ? Math.round((count / totalCount) * 100) : 0);
  const statusMix = [
    { name: "In progress", value: pct(openTickets.length), color: "var(--chart-2)" },
    { name: "Waiting", value: pct(waitingTickets.length), color: "var(--chart-3)" },
    { name: "Resolved", value: pct(resolvedTickets.length), color: "var(--chart-1)" },
    { name: "Escalated", value: pct(escalatedTickets.length), color: "var(--chart-4)" },
  ];

  return (
    <>
      <PageHeading
        eyebrow="Operations center"
        title="Support overview"
        description="Live view of incoming requests, escalations, and support queue metrics."
        actions={
          <Button variant="outline" asChild>
            <Link to="/admin/tickets">
              View all tickets
              <ArrowUpRight />
            </Link>
          </Button>
        }
      />

      {isError && (
        <div className="mb-6">
          <AdminErrorBanner
            title="Unable to load ticket statistics"
            message={error?.message ?? "Please try again."}
            onRetry={() => void refetch()}
          />
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric
          label="Total tickets"
          value={isLoading ? "—" : String(tickets.length)}
          note="Across all queues"
          icon={Ticket}
        />
        <Metric
          label="Open"
          value={isLoading ? "—" : String(openTickets.length)}
          note="New or analyzing"
          icon={Clock3}
          tone="blue"
        />
        <Metric
          label="Waiting for user"
          value={isLoading ? "—" : String(waitingTickets.length)}
          note="Clarification or solution ready"
          icon={UsersRound}
          tone="warning"
        />
        <Metric
          label="Escalated"
          value={isLoading ? "—" : String(escalatedTickets.length)}
          note="Human support review"
          icon={AlertTriangle}
          tone="critical"
        />
        <Metric
          label="Resolved"
          value={isLoading ? "—" : String(resolvedTickets.length)}
          note="Completed requests"
          icon={CheckCircle2}
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartFrame title="Ticket volume" caption="Requests grouped by day of creation">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={volumeByDay} margin={{ top: 10, right: 5, left: -22, bottom: 0 }}>
              <defs>
                <linearGradient id="ticket-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  borderColor: "var(--border)",
                  background: "var(--popover)",
                  color: "var(--popover-foreground)",
                }}
              />
              <Area
                type="monotone"
                dataKey="tickets"
                stroke="var(--chart-1)"
                strokeWidth={2.5}
                fill="url(#ticket-area)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartFrame>
        <ChartFrame title="Requests by category" caption="Live distribution across categories">
          {categoryCounts.length === 0 ? (
            <EmptyState
              title="No category data yet"
              description="Category counts will appear once tickets are submitted."
            />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryCounts}
                layout="vertical"
                margin={{ top: 0, right: 12, left: 8, bottom: 0 }}
              >
                <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                />
                <Tooltip
                  cursor={{ fill: "var(--muted)" }}
                  contentStyle={{
                    borderRadius: 8,
                    borderColor: "var(--border)",
                    background: "var(--popover)",
                    color: "var(--popover-foreground)",
                  }}
                />
                <Bar dataKey="count" fill="var(--chart-1)" radius={[0, 4, 4, 0]} barSize={17} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartFrame>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(260px,0.7fr)]">
        <section className="rounded-md border border-border bg-card p-5 sm:p-6">
          <SectionTitle
            title="Recently updated"
            detail="Live tickets across the support queue"
            action={
              <Button variant="ghost" size="sm" asChild>
                <Link to="/admin/tickets">
                  All tickets
                  <ArrowUpRight />
                </Link>
              </Button>
            }
          />
          {isLoading ? (
            <div className="space-y-3 py-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <TicketTable
              tickets={tickets.slice(0, 4)}
              showEmployee
              detailRoute="/admin/ticket/$id"
            />
          )}
        </section>
        <section className="rounded-md border border-border bg-card p-5 sm:p-6">
          <SectionTitle title="Status mix" detail="Live distribution" />
          <div className="relative h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusMix}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={56}
                  outerRadius={82}
                  paddingAngle={3}
                  stroke="var(--card)"
                >
                  {statusMix.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    borderColor: "var(--border)",
                    background: "var(--popover)",
                    color: "var(--popover-foreground)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-semibold">{totalCount}</span>
              <span className="text-[11px] text-muted-foreground">tickets</span>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2">
            {statusMix.map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <span
                  className={`size-2 rounded-full ${item.name === "In progress" ? "bg-chart-2" : item.name === "Waiting" ? "bg-chart-3" : item.name === "Resolved" ? "bg-chart-1" : "bg-chart-4"}`}
                />
                {item.name}
                <span className="ml-auto font-medium text-foreground">{item.value}%</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

export function AdminTickets() {
  const { data, isLoading, isError, error, refetch } = useTickets();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const tickets = (data ?? []).map((t) => mapBackendTicketToDisplay(t));
  const filtered = tickets.filter(
    (ticket) =>
      `${ticket.id} ${ticket.title} ${ticket.employee}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (status === "all" || ticket.status === status),
  );

  return (
    <>
      <PageHeading
        eyebrow="Operations center"
        title="All tickets"
        description="Review requests across the support queue, respond to employees, and run AI triage."
      />

      {isError && (
        <div className="mb-4">
          <AdminErrorBanner
            title="Unable to load support queue"
            message={error?.message ?? "Please try again."}
            onRetry={() => void refetch()}
          />
        </div>
      )}

      <section className="rounded-md border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tickets or users"
              aria-label="Search tickets or users"
              className="h-10 pl-9"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-10 w-full sm:w-48">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {ticketStatuses.map((item) => (
                <SelectItem key={item} value={item}>
                  {statusLabels[item]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <TicketTable tickets={filtered} showEmployee detailRoute="/admin/ticket/$id" />
        )}

        <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
          Showing {filtered.length} of {tickets.length} tickets
        </div>
      </section>
    </>
  );
}

export function Escalations() {
  const { role } = useAuth();
  const { data, isLoading, isError, error, refetch } = useEscalations();
  const staffQuery = useStaffAssignees();
  const assignMutation = useAssignEscalation();
  const [selectedByEscalation, setSelectedByEscalation] = useState<Record<string, string>>({});

  const escalations = data ?? [];
  const staffList = staffQuery.data ?? [];
  const isAdmin = role === "admin";

  const openCount = escalations.filter((item) => item.status === "OPEN").length;
  const inProgressCount = escalations.filter((item) => item.status === "IN_PROGRESS").length;
  const criticalCount = escalations.filter((item) => item.ticket_risk_level === "CRITICAL").length;

  const handleAssign = async (
    escalationId: string,
    ticketId: string,
    currentAssignee?: string | null,
  ) => {
    const chosen = selectedByEscalation[escalationId] ?? currentAssignee ?? "";
    if (!chosen || assignMutation.isPending) return;
    try {
      await assignMutation.mutateAsync({
        escalationId,
        ticketId,
        payload: { assigned_to: chosen },
      });
      toast.success("Escalation assigned.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to assign escalation.");
    }
  };

  return (
    <>
      <PageHeading
        eyebrow="Operations center"
        title="Escalations"
        description="Live escalation records from TriageAgent requiring IT support review and assignment."
      />

      {isError && (
        <div className="mb-5">
          <AdminErrorBanner
            title="Unable to load escalated tickets"
            message={error?.message ?? "Please try again."}
            onRetry={() => void refetch()}
          />
        </div>
      )}

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Metric
          label="Open escalations"
          value={isLoading ? "—" : `${openCount}`}
          note="Awaiting assignment or review"
          icon={AlertTriangle}
          tone="critical"
        />
        <Metric
          label="In progress"
          value={isLoading ? "—" : `${inProgressCount}`}
          note="Assigned to support staff"
          icon={UsersRound}
          tone="blue"
        />
        <Metric
          label="Critical risk"
          value={isLoading ? "—" : `${criticalCount}`}
          note="Assessed CRITICAL by agent"
          icon={Clock3}
          tone="warning"
        />
      </div>

      <section className="rounded-md border border-border bg-card p-4 sm:p-6">
        <SectionTitle
          title="Escalated requests"
          detail={
            isLoading ? "Loading escalations..." : `${escalations.length} escalation record(s)`
          }
        />

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : escalations.length === 0 ? (
          <EmptyState
            title="No escalated tickets"
            description="No escalation records currently exist."
          />
        ) : (
          <div className="space-y-3">
            {escalations.map((item) => (
              <article
                key={item.id}
                className="flex flex-col gap-4 rounded-md border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-muted-foreground">
                      {item.ticket_id}
                    </span>
                    <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium">
                      Escalation: {item.status}
                    </span>
                    {item.ticket_status && <StatusBadge status={item.ticket_status} />}
                    {item.ticket_risk_level && (
                      <span className="text-xs font-medium text-destructive">
                        {item.ticket_risk_level} Risk
                      </span>
                    )}
                    {item.ticket_priority && (
                      <span className="text-xs text-muted-foreground">
                        Priority: {item.ticket_priority}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold">{item.ticket_title ?? "Escalated ticket"}</h3>
                  {item.ticket_description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {item.ticket_description}
                    </p>
                  )}
                  <p className="text-xs text-foreground">
                    <strong>Escalation reason:</strong> {item.reason}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Employee: {item.employee_name ?? item.employee_id ?? "Unknown"} · Team:{" "}
                    {item.assigned_team ?? "IT Support"} · Technician:{" "}
                    {item.assigned_to_name ?? "Unassigned"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Created: {new Date(item.created_at).toLocaleString()} · Updated:{" "}
                    {new Date(item.updated_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-col gap-2 shrink-0 sm:items-end">
                  {isAdmin && item.status !== "RESOLVED" && (
                    <div className="flex items-center gap-2">
                      <Select
                        value={selectedByEscalation[item.id] ?? item.assigned_to ?? ""}
                        onValueChange={(value) =>
                          setSelectedByEscalation((prev) => ({ ...prev, [item.id]: value }))
                        }
                      >
                        <SelectTrigger
                          className="h-9 w-44 text-xs"
                          aria-label={`Select technician for ${item.ticket_id}`}
                        >
                          <SelectValue placeholder="Assign technician" />
                        </SelectTrigger>
                        <SelectContent>
                          {staffList.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.full_name} ({member.role})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        size="sm"
                        disabled={
                          assignMutation.isPending ||
                          !(selectedByEscalation[item.id] ?? item.assigned_to)
                        }
                        onClick={() => void handleAssign(item.id, item.ticket_id, item.assigned_to)}
                      >
                        {assignMutation.isPending ? "Assigning..." : "Assign"}
                      </Button>
                    </div>
                  )}
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/admin/ticket/$id" params={{ id: item.ticket_id }}>
                      Open conversation
                      <ArrowUpRight className="ml-1.5 size-3.5" />
                    </Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export function AgentActivity() {
  const avgLatency = Math.round(
    demoAgentRuns.reduce((acc, curr) => acc + curr.latency_ms, 0) / demoAgentRuns.length,
  );
  const avgRetrieval = (
    (demoAgentRuns.reduce((acc, curr) => acc + curr.retrieval_score, 0) / demoAgentRuns.length) *
    100
  ).toFixed(1);

  return (
    <>
      <div className="mb-6">
        <PreviewNotice>
          Preview only — No live agent-runs API endpoint is connected yet. Telemetry and run records
          below are illustrative sample data.
        </PreviewNotice>
      </div>
      <PageHeading
        eyebrow="Operations center"
        title="Agent activity"
        description="Monitor LangGraph triage runs, execution latency, and ChromaDB retrieval metrics (Preview)."
      />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Total Agent Runs"
          value={`${demoAgentRuns.length}`}
          note="Logged in agent_runs table"
          icon={Cpu}
        />
        <Metric
          label="Average Latency"
          value={`${avgLatency} ms`}
          note="End-to-end graph execution"
          icon={Activity}
          tone="blue"
        />
        <Metric
          label="Retrieval Relevance"
          value={`${avgRetrieval}%`}
          note="ChromaDB cosine similarity"
          icon={Zap}
          tone="warning"
        />
        <Metric
          label="Automated Triage"
          value="75%"
          note="Resolved without escalation"
          icon={ShieldCheck}
          tone="critical"
        />
      </div>

      <section className="rounded-md border border-border bg-card p-5 sm:p-7">
        <div className="flex flex-col gap-1 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">Recent LangGraph Agent Runs</h2>
            <p className="text-xs text-muted-foreground">
              Detailed telemetry per ticket invocation: confidence, tool selection, and latency.
            </p>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            Table: Supabase.agent_runs
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="pb-3 pr-4">Ticket</th>
                <th className="pb-3 px-4">Agent Decision</th>
                <th className="pb-3 px-4">Confidence</th>
                <th className="pb-3 px-4">RAG Score</th>
                <th className="pb-3 px-4">Latency</th>
                <th className="pb-3 px-4">Tools Executed</th>
                <th className="pb-3 pl-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {demoAgentRuns.map((run) => (
                <tr key={run.id} className="hover:bg-muted/40 transition-colors">
                  <td className="py-3.5 pr-4 font-mono font-medium text-foreground">
                    <Link
                      to="/employee/tickets/$id"
                      params={{ id: run.ticket_id }}
                      className="text-primary hover:underline"
                    >
                      {run.ticket_id}
                    </Link>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        run.decision === "SOLUTION_SUGGESTED"
                          ? "bg-chart-2/15 text-chart-2 border border-chart-2/30"
                          : run.decision === "ESCALATED"
                            ? "bg-destructive/15 text-destructive border border-destructive/30"
                            : "bg-chart-3/20 text-foreground border border-chart-3/40"
                      }`}
                    >
                      {run.decision}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-medium">{(run.confidence * 100).toFixed(0)}%</td>
                  <td className="py-3.5 px-4 font-medium">{run.retrieval_score.toFixed(2)}</td>
                  <td className="py-3.5 px-4 font-mono text-muted-foreground">
                    {run.latency_ms} ms
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      {run.tools_invoked.map((tool) => (
                        <span
                          key={tool}
                          className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 pl-4 text-right text-xs text-muted-foreground">
                    {run.created_at}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

export function AdminProfile() {
  const navigate = useNavigate();
  const { user, fullName, role, signOut } = useAuth();
  const displayName = fullName ?? user?.email ?? "Operator";
  const initials = getInitials(displayName);
  const roleLabel =
    role === "admin" ? "IT Administrator" : role === "support" ? "IT Support" : "Operator";

  const handleSignOut = async () => {
    await signOut();
    await navigate({ to: "/login" });
  };

  return (
    <>
      <PageHeading
        eyebrow="Account"
        title="Operations profile"
        description="Your authenticated operations account details."
      />
      <section className="max-w-3xl rounded-md border border-border bg-card p-5 sm:p-7">
        <div className="flex items-center gap-4 border-b border-border pb-6">
          <span className="grid size-14 place-items-center rounded-full bg-accent text-base font-semibold text-accent-foreground">
            {initials}
          </span>
          <div>
            <h2 className="font-semibold">{displayName}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{roleLabel}</p>
          </div>
        </div>
        <dl className="grid grid-cols-1 gap-x-8 gap-y-5 pt-6 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Full name</dt>
            <dd className="mt-1 text-sm font-medium">{fullName ?? "Not set"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Email address</dt>
            <dd className="mt-1 break-all text-sm font-medium">{user?.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Role</dt>
            <dd className="mt-1 text-sm font-medium">{roleLabel}</dd>
          </div>
        </dl>
        <div className="mt-6 flex justify-end">
          <Button variant="outline" size="sm" onClick={() => void handleSignOut()}>
            <LogOut className="mr-1.5 size-3.5" />
            Sign out of Operations
          </Button>
        </div>
      </section>
    </>
  );
}
