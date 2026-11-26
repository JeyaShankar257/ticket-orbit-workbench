import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Info, Ticket as TicketIcon, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { statusLabels, type Ticket, type TicketPriority, type TicketStatus } from "./model";

export function PreviewNotice({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 border border-chart-3/30 bg-chart-3/10 px-3.5 py-3 text-sm text-foreground rounded-md">
      <Info className="mt-0.5 size-4 shrink-0 text-chart-3" aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}

export function PageHeading({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function SectionTitle({
  title,
  detail,
  action,
}: {
  title: string;
  detail?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {detail ? <p className="mt-1 text-xs text-muted-foreground">{detail}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function StatusBadge({ status }: { status: TicketStatus }) {
  const styles: Record<TicketStatus, string> = {
    NEW: "border-border bg-muted text-foreground",
    ANALYZING: "border-chart-2/25 bg-chart-2/10 text-chart-2",
    WAITING_FOR_USER: "border-chart-3/30 bg-chart-3/10 text-foreground",
    SOLUTION_SUGGESTED: "border-primary/20 bg-primary/10 text-primary",
    ESCALATED: "border-destructive/20 bg-destructive/10 text-destructive",
    RESOLVED: "border-primary/20 bg-primary/10 text-primary",
    CLOSED: "border-border bg-muted text-muted-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        styles[status],
      )}
    >
      <span className="size-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />
      {statusLabels[status]}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const styles: Record<TicketPriority, string> = {
    Low: "border-border bg-muted text-muted-foreground",
    Medium: "border-chart-2/25 bg-chart-2/10 text-chart-2",
    High: "border-chart-3/30 bg-chart-3/10 text-foreground",
    Critical: "border-destructive/20 bg-destructive/10 text-destructive",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-medium",
        styles[priority],
      )}
    >
      {priority}
    </span>
  );
}

export function Metric({
  label,
  value,
  note,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string;
  note: string;
  icon: LucideIcon;
  tone?: "primary" | "warning" | "critical" | "blue";
}) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    warning: "bg-chart-3/15 text-foreground",
    critical: "bg-destructive/10 text-destructive",
    blue: "bg-chart-2/10 text-chart-2",
  };
  return (
    <section className="rounded-md border border-border bg-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-3 text-3xl font-semibold tabular-nums text-foreground">{value}</p>
        </div>
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-md", tones[tone])}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{note}</p>
    </section>
  );
}

export function EmptyState({
  title,
  description,
  icon: Icon = TicketIcon,
  action,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center px-5 py-10 text-center">
      <span className="mb-4 grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function TicketTable({
  tickets,
  showEmployee = false,
  detailRoute = "/employee/tickets/$id",
}: {
  tickets: Ticket[];
  showEmployee?: boolean;
  detailRoute?: "/employee/tickets/$id" | "/admin/ticket/$id";
}) {
  if (tickets.length === 0) {
    return (
      <EmptyState
        title="No tickets match"
        description="Try a different search or adjust the filters above."
      />
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs font-medium text-muted-foreground">
            <th className="px-4 py-3 font-medium">Ticket</th>
            {showEmployee ? <th className="px-4 py-3 font-medium">Employee</th> : null}
            <th className="px-4 py-3 font-medium">Category</th>
            <th className="px-4 py-3 font-medium">Priority</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Updated</th>
            <th className="px-4 py-3 text-right font-medium"> </th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr
              key={ticket.id}
              className="border-b border-border/70 last:border-0 hover:bg-muted/50"
            >
              <td className="px-4 py-3.5">
                <Link to={detailRoute} params={{ id: ticket.id }} className="group block min-w-48">
                  <span className="text-xs font-medium text-muted-foreground">{ticket.id}</span>
                  <span className="mt-1 block max-w-[280px] truncate font-medium text-foreground group-hover:text-primary">
                    {ticket.title}
                  </span>
                </Link>
              </td>
              {showEmployee ? (
                <td className="px-4 py-3.5 text-muted-foreground">{ticket.employee}</td>
              ) : null}
              <td className="px-4 py-3.5 text-muted-foreground">{ticket.category}</td>
              <td className="px-4 py-3.5">
                <PriorityBadge priority={ticket.priority} />
              </td>
              <td className="px-4 py-3.5">
                <StatusBadge status={ticket.status} />
              </td>
              <td className="px-4 py-3.5 whitespace-nowrap text-muted-foreground">
                {ticket.updated}
              </td>
              <td className="px-4 py-3.5 text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  aria-label={`View ${ticket.id}`}
                  title="View ticket"
                >
                  <Link to="/employee/tickets/$id" params={{ id: ticket.id }}>
                    <ArrowUpRight />
                  </Link>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder = "Search tickets",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="w-full sm:max-w-xs">
      <Input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-10 bg-card"
      />
    </div>
  );
}
