import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { format, isValid, parseISO } from "date-fns";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  CircleHelp,
  Clock3,
  FileText,
  Laptop,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Ticket,
  Wifi,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import {
  useAnalyzeTicket,
  useAssignEscalation,
  useCreateTicket,
  useResolveTicket,
  useSendTicketMessage,
  useStaffAssignees,
  useTicket,
  useTicketAgentRuns,
  useTicketEscalation,
  useTicketMessages,
  useTickets,
  useUpdateTicketStatus,
} from "@/lib/api";
import type { TicketAnalyzeResponse } from "@/lib/api/types";
import {
  getInitials,
  mapBackendMessageToDisplay,
  mapBackendTicketToDisplay,
  toBackendCategory,
} from "./mappers";
import {
  EmptyState,
  Metric,
  PageHeading,
  PriorityBadge,
  SectionTitle,
  StatusBadge,
  TicketTable,
} from "./primitives";
import {
  statusLabels,
  ticketStatuses,
  type Ticket as TicketRecord,
  type TicketPriority,
  type TicketStatus,
} from "./model";

function LiveErrorBanner({
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

export function EmployeeDashboard() {
  const { fullName, user } = useAuth();
  const { data, isLoading, isError, error, refetch } = useTickets();
  const employeeLabel = fullName ?? user?.email ?? "You";
  const greetingName = fullName ?? user?.email?.split("@")[0] ?? "there";

  const tickets = (data ?? []).map((t) => mapBackendTicketToDisplay(t, employeeLabel));
  const inProgressTickets = tickets.filter((t) =>
    ["NEW", "ANALYZING", "ESCALATED"].includes(t.status),
  );
  const waitingTickets = tickets.filter((t) =>
    ["WAITING_FOR_USER", "SOLUTION_SUGGESTED"].includes(t.status),
  );
  const resolvedTickets = tickets.filter((t) => ["RESOLVED", "CLOSED"].includes(t.status));
  const pulseTickets = tickets.filter((t) => t.status !== "CLOSED").slice(0, 2);

  return (
    <>
      <PageHeading
        eyebrow="Employee workspace"
        title={`Good day, ${greetingName}`}
        description="Your support requests, all in one place. We're here to keep your day moving."
        actions={
          <Button asChild>
            <Link to="/employee/tickets/new">
              <Plus />
              Create a ticket
            </Link>
          </Button>
        }
      />

      {isError && (
        <div className="mb-6">
          <LiveErrorBanner
            title="Unable to load your tickets"
            message={error?.message ?? "Please check your connection and try again."}
            onRetry={() => void refetch()}
          />
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Total requests"
          value={isLoading ? "—" : String(tickets.length).padStart(2, "0")}
          note="Across all statuses"
          icon={Ticket}
        />
        <Metric
          label="In progress"
          value={isLoading ? "—" : String(inProgressTickets.length).padStart(2, "0")}
          note="Being reviewed or escalated"
          icon={Clock3}
          tone="blue"
        />
        <Metric
          label="Waiting for you"
          value={isLoading ? "—" : String(waitingTickets.length).padStart(2, "0")}
          note="Clarification or solution ready"
          icon={CircleHelp}
          tone="warning"
        />
        <Metric
          label="Resolved"
          value={isLoading ? "—" : String(resolvedTickets.length).padStart(2, "0")}
          note="Completed requests"
          icon={CheckCircle2}
        />
      </div>

      <section className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.8fr)]">
        <div className="rounded-md border border-border bg-card p-5 sm:p-6">
          <SectionTitle
            title="Recent tickets"
            detail="A quick look at your latest requests"
            action={
              <Button variant="ghost" size="sm" asChild>
                <Link to="/employee/tickets">
                  View all
                  <ArrowRight />
                </Link>
              </Button>
            }
          />
          {isLoading ? (
            <div className="space-y-3 py-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : tickets.length === 0 && !isError ? (
            <TicketListEmpty />
          ) : (
            <TicketTable tickets={tickets.slice(0, 4)} />
          )}
        </div>
        <div className="rounded-md border border-border bg-card p-5 sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary">
                At a glance
              </p>
              <h2 className="mt-2 text-lg font-semibold">Your support pulse</h2>
            </div>
            <span className="grid size-10 place-items-center rounded-md bg-secondary text-secondary-foreground">
              <Wifi className="size-5" />
            </span>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            {isLoading
              ? "Loading your latest ticket updates..."
              : tickets.length === 0
                ? "You have no active requests yet. Create a ticket whenever you need IT help."
                : `${inProgressTickets.length} request(s) in progress and ${waitingTickets.length} waiting for your review.`}
          </p>
          <div className="mt-5 space-y-4">
            {pulseTickets.map((item, index) => (
              <Link
                key={item.id}
                to="/employee/tickets/$id"
                params={{ id: item.id }}
                className="flex items-center gap-3 border-t border-border pt-4 hover:opacity-80"
              >
                <span
                  className={
                    index === 0
                      ? "grid size-9 place-items-center rounded-md bg-chart-2/10 text-chart-2"
                      : "grid size-9 place-items-center rounded-md bg-chart-3/15 text-foreground"
                  }
                >
                  {index === 0 ? <Laptop className="size-4" /> : <FileText className="size-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Latest update · {item.updated}
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </Link>
            ))}
          </div>
          <Link
            to="/employee/tickets"
            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            Open your tickets
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </section>

      <section className="rounded-md border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">Need a hand?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tell us what&apos;s going on and we&apos;ll get the right support moving.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/employee/tickets/new">
              Start a new request
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}

export function EmployeeTickets() {
  const { fullName, user } = useAuth();
  const { data, isLoading, isError, error, refetch } = useTickets();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");

  const employeeLabel = fullName ?? user?.email ?? "You";
  const tickets = (data ?? []).map((t) => mapBackendTicketToDisplay(t, employeeLabel));

  const filtered = tickets.filter((ticket) => {
    const matchesQuery = `${ticket.id} ${ticket.title}`.toLowerCase().includes(query.toLowerCase());
    return (
      matchesQuery &&
      (status === "all" || ticket.status === status) &&
      (priority === "all" || ticket.priority === priority)
    );
  });

  return (
    <>
      <PageHeading
        eyebrow="Employee workspace"
        title="My tickets"
        description="Track requests, check the latest status, and pick up where you left off."
        actions={
          <Button asChild>
            <Link to="/employee/tickets/new">
              <Plus />
              Create ticket
            </Link>
          </Button>
        }
      />

      {isError && (
        <div className="mb-4">
          <LiveErrorBanner
            title="Unable to load tickets"
            message={error?.message ?? "Please try again."}
            onRetry={() => void refetch()}
          />
        </div>
      )}

      <div className="rounded-md border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by ticket or title"
              className="h-10 pl-9"
              aria-label="Search tickets"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-10 w-full sm:w-48">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {ticketStatuses.map((value) => (
                  <SelectItem key={value} value={value}>
                    {statusLabels[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="h-10 w-full sm:w-36">
                <SelectValue placeholder="Any priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any priority</SelectItem>
                {(["Low", "Medium", "High", "Critical"] as TicketPriority[]).map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : tickets.length === 0 && !isError ? (
          <TicketListEmpty />
        ) : (
          <TicketTable tickets={filtered} />
        )}

        <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
          Showing {filtered.length} of {tickets.length} tickets
        </div>
      </div>
    </>
  );
}

const categories = [
  "Network / VPN",
  "Hardware",
  "Software / Applications",
  "Account / Access",
  "Email / Outlook",
  "Other",
];
const priorities: { value: TicketPriority; description: string }[] = [
  { value: "Low", description: "A minor issue with a workaround available." },
  { value: "Medium", description: "Work is affected, but can continue." },
  { value: "High", description: "Work is blocked or significantly slowed." },
  { value: "Critical", description: "A major outage or urgent security concern." },
];

export function NewTicket() {
  const navigate = useNavigate();
  const createTicketMutation = useCreateTicket();
  const [selectedPriority, setSelectedPriority] = useState<TicketPriority>("Medium");
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(categories[0] ?? "Other");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (trimmedTitle.length < 5 || trimmedDescription.length < 10) {
      setError("Add a title (at least 5 characters) and description (at least 10 characters).");
      return;
    }

    setError("");
    try {
      const created = await createTicketMutation.mutateAsync({
        title: trimmedTitle,
        description: trimmedDescription,
        category: toBackendCategory(category),
        reported_priority: selectedPriority,
      });
      toast.success("Support ticket created!");
      await navigate({ to: "/employee/tickets/$id", params: { id: created.ticket_id } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to create ticket.";
      setError(msg);
      toast.error(msg);
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="Employee workspace"
        title="Create a support ticket"
        description="Share a few details so your support team knows where to start."
      />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(270px,0.7fr)]">
        <form
          onSubmit={handleSubmit}
          className="rounded-md border border-border bg-card p-5 sm:p-7"
        >
          <div className="mb-6 flex items-start gap-3 border-b border-border pb-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
              <Ticket className="size-5" />
            </span>
            <div>
              <h2 className="font-semibold">Request details</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Fields marked with * are required.
              </p>
            </div>
          </div>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="ticket-title">
                Problem title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ticket-title"
                required
                minLength={5}
                maxLength={150}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="For example, VPN disconnects during calls"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket-description">
                What’s happening? <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="ticket-description"
                required
                minLength={10}
                maxLength={3000}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Tell us what you were trying to do, what happened instead, and when you first noticed the issue."
                className="min-h-36 resize-y"
              />
              <p className="text-xs text-muted-foreground">
                Include any error messages and the steps you already tried.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reported priority</Label>
                <Select
                  value={selectedPriority}
                  onValueChange={(value) => setSelectedPriority(value as TicketPriority)}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="rounded-md border border-border bg-muted/50 px-3.5 py-3">
              <p className="text-sm font-medium">{selectedPriority} priority</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {priorities.find((item) => item.value === selectedPriority)?.description}
              </p>
            </div>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <div className="flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" asChild>
                <Link to="/employee/dashboard">Cancel</Link>
              </Button>
              <Button type="submit" disabled={createTicketMutation.isPending}>
                {createTicketMutation.isPending ? (
                  <>
                    <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit ticket
                    <ArrowRight />
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>

        <aside className="space-y-4">
          <div className="rounded-md border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <ShieldAlert className="size-4 text-primary" />
              <h2 className="text-sm font-semibold">Choosing a priority</h2>
            </div>
            <div className="space-y-4">
              {priorities.map((item) => (
                <div key={item.value} className="flex items-start gap-3">
                  <PriorityBadge priority={item.value} />
                  <p className="pt-0.5 text-xs leading-5 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

const AUTO_ANALYZE_STATUSES: ReadonlySet<TicketStatus> = new Set([
  "NEW",
  "WAITING_FOR_USER",
  "SOLUTION_SUGGESTED",
  "ESCALATED",
]);

const initialAutoAnalyzedTickets = new Set<string>();

export function TicketDetails({
  id,
  backTo = "/employee/tickets",
}: {
  id: string;
  backTo?: "/employee/tickets" | "/admin/tickets";
}) {
  const { fullName, user, role } = useAuth();
  const ticketQuery = useTicket(id);
  const messagesQuery = useTicketMessages(id);
  const sendMessageMutation = useSendTicketMessage(id);
  const analyzeMutation = useAnalyzeTicket(id);
  const resolveMutation = useResolveTicket(id);

  const [replyText, setReplyText] = useState("");
  const [latestAnalysis, setLatestAnalysis] = useState<TicketAnalyzeResponse | null>(null);
  const replyInFlightRef = useRef(false);
  const analyzeInFlightRef = useRef(false);
  const resolveInFlightRef = useRef(false);
  const autoAnalyzedTicketIdRef = useRef<string | null>(null);

  const currentUserLabel = fullName ?? user?.email ?? "You";
  const userInitials = getInitials(currentUserLabel);

  const handleAnalyzeTicket = async () => {
    if (analyzeMutation.isPending || analyzeInFlightRef.current) return;
    analyzeInFlightRef.current = true;
    try {
      const result = await analyzeMutation.mutateAsync();
      setLatestAnalysis(result);
      if (result.decision_source === "groq" || result.decision_source === "fallback") {
        toast.warning(
          `Fallback analysis (Groq) – Gemini unavailable. Decision: ${result.decision}`,
        );
      } else {
        toast.success(`AI analysis complete: ${result.decision}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "AI analysis failed. Please try again.";
      toast.error(msg);
    } finally {
      analyzeInFlightRef.current = false;
    }
  };

  useEffect(() => {
    const raw = ticketQuery.data;
    if (!raw || messagesQuery.isLoading || messagesQuery.isError) return;
    const isTicketOwner = raw.user_id === user?.id;
    const hasMessages = (messagesQuery.data?.length ?? 0) > 0;
    if (
      isTicketOwner &&
      raw.status === "NEW" &&
      !hasMessages &&
      autoAnalyzedTicketIdRef.current !== raw.id &&
      !initialAutoAnalyzedTickets.has(raw.id)
    ) {
      autoAnalyzedTicketIdRef.current = raw.id;
      initialAutoAnalyzedTickets.add(raw.id);
      void handleAnalyzeTicket();
    }
  }, [
    ticketQuery.data,
    messagesQuery.data,
    messagesQuery.isLoading,
    messagesQuery.isError,
    user?.id,
  ]);

  if (ticketQuery.isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(310px,0.8fr)]">
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      </div>
    );
  }

  if (ticketQuery.isError) {
    if (ticketQuery.error?.status === 404) {
      return (
        <EmptyState
          title="Ticket not found"
          description="This ticket does not exist or you do not have access to view it."
          action={
            <Button asChild variant="outline">
              <Link to={backTo}>Back to tickets</Link>
            </Button>
          }
        />
      );
    }

    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild className="px-2">
          <Link to={backTo}>
            <ArrowRight className="rotate-180" />
            Back to tickets
          </Link>
        </Button>
        <LiveErrorBanner
          title="Unable to load ticket"
          message={ticketQuery.error?.message ?? "Please try again."}
          onRetry={() => void ticketQuery.refetch()}
        />
      </div>
    );
  }

  const rawTicket = ticketQuery.data;
  if (!rawTicket) {
    return <EmptyState title="Ticket not found" description="This ticket could not be loaded." />;
  }

  const isOwner = rawTicket.user_id === user?.id;
  const ticket = mapBackendTicketToDisplay(rawTicket, isOwner ? currentUserLabel : undefined);
  const messages = (messagesQuery.data ?? []).map(mapBackendMessageToDisplay);
  const canAnalyze = ticket.status !== "RESOLVED" && ticket.status !== "CLOSED";
  const isAdminOrSupportView = backTo === "/admin/tickets" || !isOwner;
  const showManualAnalyze = canAnalyze && (isAdminOrSupportView || messages.length === 0);
  const shouldAutoAnalyze = isOwner && AUTO_ANALYZE_STATUSES.has(ticket.status);
  const isReplyBusy =
    sendMessageMutation.isPending || analyzeMutation.isPending || resolveMutation.isPending;
  const showResolutionActions =
    isOwner && !isAdminOrSupportView && ticket.status === "SOLUTION_SUGGESTED";
  const isStaffView = backTo === "/admin/tickets" && (role === "admin" || role === "support");

  const handleConfirmResolved = async () => {
    if (resolveMutation.isPending || isReplyBusy || resolveInFlightRef.current) return;
    resolveInFlightRef.current = true;
    try {
      await resolveMutation.mutateAsync({
        rating: 5,
        feedback: "Employee confirmed issue resolved.",
      });
      toast.success("Ticket marked as resolved. Thank you for confirming!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to mark ticket as resolved.";
      toast.error(msg);
    } finally {
      resolveInFlightRef.current = false;
    }
  };

  const handleReportUnresolved = async () => {
    if (isReplyBusy || replyInFlightRef.current) return;
    replyInFlightRef.current = true;
    try {
      await sendMessageMutation.mutateAsync({
        message:
          "The suggested solution did not resolve my issue. Please investigate further or escalate.",
      });
      toast.success("Feedback sent. Requesting further AI investigation...");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to send feedback.";
      toast.error(msg);
      replyInFlightRef.current = false;
      return;
    }

    try {
      await handleAnalyzeTicket();
    } finally {
      replyInFlightRef.current = false;
    }
  };

  const handleManualAnalyzeTicket = () => {
    if (isReplyBusy || replyInFlightRef.current) return;
    void handleAnalyzeTicket();
  };

  const handleSendClarification = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = replyText.trim();
    if (!trimmed || isReplyBusy || replyInFlightRef.current) return;

    replyInFlightRef.current = true;
    try {
      await sendMessageMutation.mutateAsync({ message: trimmed });
      setReplyText("");
      toast.success(
        shouldAutoAnalyze ? "Message sent. Requesting AI follow-up..." : "Message sent.",
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to send message.";
      toast.error(msg);
      replyInFlightRef.current = false;
      return;
    }

    try {
      if (shouldAutoAnalyze) {
        await handleAnalyzeTicket();
      }
    } finally {
      replyInFlightRef.current = false;
    }
  };

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="mb-5 px-2">
        <Link to={backTo}>
          <ArrowRight className="rotate-180" />
          Back to tickets
        </Link>
      </Button>
      <PageHeading
        eyebrow={`Ticket ${ticket.id}`}
        title={ticket.title}
        description="Request details and agentic support conversation for this ticket."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={ticket.status} />
            {showManualAnalyze && (
              <Button
                type="button"
                size="sm"
                onClick={handleManualAnalyzeTicket}
                disabled={isReplyBusy}
                className="gap-1.5"
              >
                {analyzeMutation.isPending ? (
                  <>
                    <span className="size-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3.5" />
                    Analyze with AI
                  </>
                )}
              </Button>
            )}
          </div>
        }
      />

      {analyzeMutation.isError && (
        <div className="mb-5">
          <LiveErrorBanner
            title="AI analysis failed"
            message={analyzeMutation.error?.message ?? "Please try again."}
            onRetry={() => void handleAnalyzeTicket()}
          />
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(310px,0.8fr)]">
        <div className="space-y-5">
          <section className="rounded-md border border-border bg-card p-5 sm:p-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <SectionTitle title="Request details" detail={`Reported by ${ticket.employee}`} />
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                <ShieldCheck className="size-3.5" />
                PII Masking Active
              </span>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">
              {ticket.description}
            </p>
            <div className="mt-5 grid grid-cols-1 gap-4 border-t border-border pt-5 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Category</p>
                <p className="mt-1 text-sm font-medium">{ticket.category}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Reported priority</p>
                <div className="mt-1">
                  <PriorityBadge priority={ticket.priority} />
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="mt-1 text-sm font-medium">{ticket.created}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last updated</p>
                <p className="mt-1 text-sm font-medium">{ticket.updated}</p>
              </div>
            </div>
          </section>

          <section className="rounded-md border border-border bg-card p-5 sm:p-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <SectionTitle
                title="Agentic Conversation"
                detail="Multi-turn clarification and AI triage thread."
              />
              <span className="text-xs text-muted-foreground font-mono">
                {messages.length} messages
              </span>
            </div>

            {messagesQuery.isLoading ? (
              <div className="mt-4 space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : messagesQuery.isError ? (
              <div className="mt-4">
                <LiveErrorBanner
                  title="Unable to load messages"
                  message={messagesQuery.error?.message ?? "Please try again."}
                  onRetry={() => void messagesQuery.refetch()}
                />
              </div>
            ) : messages.length === 0 ? (
              <EmptyState
                icon={CircleHelp}
                title="No conversation thread yet"
                description="Send a message or click Analyze with AI to start triage."
              />
            ) : (
              <div className="mt-4 space-y-4">
                {messages.map((msg) => {
                  const isAgent = msg.sender === "agent";
                  const isSupport = msg.sender === "human_support";
                  const isIncoming = isAgent || isSupport;
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${
                        isIncoming ? "items-start" : "items-start flex-row-reverse"
                      }`}
                    >
                      <span
                        className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                          isAgent
                            ? "bg-primary text-primary-foreground"
                            : isSupport
                              ? "bg-chart-2 text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isAgent ? <Bot className="size-4" /> : isSupport ? "SP" : userInitials}
                      </span>
                      <div
                        className={`max-w-[85%] rounded-lg p-3.5 text-xs sm:text-sm leading-relaxed ${
                          isIncoming
                            ? "border border-border bg-muted/30 text-foreground"
                            : "bg-primary text-primary-foreground"
                        }`}
                      >
                        <div
                          className={`flex items-center gap-2 mb-1 text-[11px] font-semibold ${
                            isIncoming ? "text-primary" : "text-primary-foreground/80"
                          }`}
                        >
                          <span>
                            {isAgent
                              ? "TriageAgent AI"
                              : isSupport
                                ? "IT Support"
                                : isOwner
                                  ? `${currentUserLabel} (You)`
                                  : ticket.employee}
                          </span>
                          <span className="font-normal opacity-70">· {msg.created_at}</span>
                        </div>
                        <p className="whitespace-pre-line">{msg.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {ticket.status !== "RESOLVED" && ticket.status !== "CLOSED" && (
              <form
                onSubmit={(e) => void handleSendClarification(e)}
                className="mt-5 border-t border-border pt-4"
              >
                <Label htmlFor="clarification-input" className="text-xs text-muted-foreground">
                  Reply to agent clarification or add missing details
                </Label>
                <div className="mt-2 flex gap-2">
                  <Input
                    id="clarification-input"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Provide additional details or answer the agent's questions..."
                    className="h-10 text-xs sm:text-sm"
                    disabled={isReplyBusy}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="gap-1.5 shrink-0"
                    disabled={isReplyBusy || !replyText.trim()}
                  >
                    <Send className="size-3.5" />
                    <span>
                      {sendMessageMutation.isPending
                        ? "Sending..."
                        : analyzeMutation.isPending
                          ? "Analyzing..."
                          : "Send"}
                    </span>
                  </Button>
                </div>
                {analyzeMutation.isPending && (
                  <p
                    className="mt-2 flex items-center gap-2 text-xs text-muted-foreground"
                    role="status"
                  >
                    <span className="size-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    TriageAgent AI is reviewing your reply...
                  </p>
                )}
                {sendMessageMutation.isError && (
                  <p className="mt-2 text-xs text-destructive" role="alert">
                    {sendMessageMutation.error?.message ?? "Unable to send message."}
                  </p>
                )}
              </form>
            )}

            {showResolutionActions && (
              <div className="mt-4 flex flex-col gap-3 rounded-md border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    Did this resolve your issue?
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Confirm resolution to close the troubleshooting loop, or report that the issue
                    continues.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void handleConfirmResolved()}
                    disabled={isReplyBusy}
                    className="gap-1.5"
                  >
                    <CheckCircle2 className="size-3.5" />
                    {resolveMutation.isPending ? "Confirming..." : "Issue resolved"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void handleReportUnresolved()}
                    disabled={isReplyBusy}
                  >
                    Still not resolved
                  </Button>
                </div>
              </div>
            )}

            {(ticket.status === "RESOLVED" || ticket.status === "CLOSED") && (
              <div
                className="mt-4 flex items-center gap-2.5 rounded-md border border-primary/25 bg-primary/10 p-3.5 text-xs text-foreground"
                role="status"
              >
                <CheckCircle2 className="size-4 shrink-0 text-primary" />
                <span>
                  This ticket is <strong>{ticket.status}</strong>. Full conversation history is
                  preserved above.
                </span>
              </div>
            )}
          </section>

          {latestAnalysis && (
            <section className="rounded-md border border-chart-2/40 bg-chart-2/5 p-5 sm:p-6 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-chart-2 font-semibold">
                  <Sparkles className="size-5" />
                  <h3>Latest AI Analysis Result</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
                      latestAnalysis.decision_source === "groq" ||
                      latestAnalysis.decision_source === "fallback"
                        ? "border-chart-3/40 bg-chart-3/15 text-foreground"
                        : "border-primary/25 bg-primary/10 text-primary"
                    }`}
                  >
                    {latestAnalysis.decision_source === "groq"
                      ? "Fallback analysis – Groq (Gemini unavailable)"
                      : latestAnalysis.decision_source === "fallback"
                        ? "Fallback analysis – Gemini API quota exceeded."
                        : latestAnalysis.decision_source === "rule"
                          ? "Automated rule-based escalation"
                          : "Analyzed by Gemini"}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {latestAnalysis.latency_ms} ms
                  </span>
                </div>
              </div>
              <p className="whitespace-pre-line text-xs sm:text-sm leading-6 text-foreground">
                {latestAnalysis.response}
              </p>
              {latestAnalysis.escalation_reason && (
                <p className="text-xs font-medium text-destructive">
                  Escalation reason: {latestAnalysis.escalation_reason}
                </p>
              )}
            </section>
          )}
        </div>

        <div className="space-y-5">
          <section className="rounded-md border border-border bg-card p-5 sm:p-6 space-y-4">
            <SectionTitle
              title="Agent Risk & Triage"
              detail="Assessment from LangGraph triage workflow."
            />
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Assessed Urgency Risk</span>
                <span
                  className={`font-semibold ${
                    ticket.risk === "Critical" || ticket.risk === "High"
                      ? "text-destructive"
                      : "text-primary"
                  }`}
                >
                  {ticket.risk ? `${ticket.risk} Risk` : "Not assessed"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Agent Decision</span>
                <span className="font-semibold text-foreground">
                  {ticket.final_decision ?? "Pending analysis"}
                </span>
              </div>
              {latestAnalysis?.confidence !== null && latestAnalysis?.confidence !== undefined && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Confidence</span>
                  <span className="font-semibold text-foreground">
                    {Math.round(latestAnalysis.confidence * 100)}%
                  </span>
                </div>
              )}
              {ticket.status === "ESCALATED" && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
                  Escalated to human IT support for review.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-md border border-border bg-card p-5 sm:p-6">
            <SectionTitle
              title="Ticket Timeline"
              detail="State transitions across the support lifecycle."
            />
            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <span className="size-2 rounded-full bg-primary mt-1.5" />
                <div>
                  <p className="font-medium text-foreground">NEW &bull; Ticket submitted</p>
                  <p className="text-muted-foreground">{ticket.created}</p>
                </div>
              </div>
              {ticket.final_decision && (
                <div className="flex items-start gap-2.5">
                  <span className="size-2 rounded-full bg-chart-4 mt-1.5" />
                  <div>
                    <p className="font-medium text-foreground">
                      AI Triage &bull; {ticket.final_decision}
                    </p>
                    <p className="text-muted-foreground">{ticket.updated}</p>
                  </div>
                </div>
              )}
              {ticket.status === "ESCALATED" && (
                <div className="flex items-start gap-2.5">
                  <span className="size-2 rounded-full bg-destructive mt-1.5" />
                  <div>
                    <p className="font-medium text-foreground">
                      ESCALATED &bull; Assigned to IT Support
                    </p>
                    <p className="text-muted-foreground">{ticket.updated}</p>
                  </div>
                </div>
              )}
              {ticket.status === "RESOLVED" && (
                <div className="flex items-start gap-2.5">
                  <span className="size-2 rounded-full bg-primary mt-1.5" />
                  <div>
                    <p className="font-medium text-foreground">RESOLVED</p>
                    <p className="text-muted-foreground">{ticket.updated}</p>
                  </div>
                </div>
              )}
              {ticket.status === "CLOSED" && (
                <div className="flex items-start gap-2.5">
                  <span className="size-2 rounded-full bg-chart-2 mt-1.5" />
                  <div>
                    <p className="font-medium text-foreground">CLOSED</p>
                    <p className="text-muted-foreground">{ticket.updated}</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {isStaffView && (
            <StaffTicketControls
              ticketId={id}
              ticketStatus={ticket.status}
              role={role as "admin" | "support"}
            />
          )}
        </div>
      </div>
    </>
  );
}

function StaffTicketControls({
  ticketId,
  ticketStatus,
  role,
}: {
  ticketId: string;
  ticketStatus: TicketStatus;
  role: "admin" | "support";
}) {
  const escalationQuery = useTicketEscalation(ticketId, true);
  const agentRunsQuery = useTicketAgentRuns(ticketId, true);
  const staffQuery = useStaffAssignees();
  const assignMutation = useAssignEscalation();
  const updateStatusMutation = useUpdateTicketStatus(ticketId);

  const [selectedAssignee, setSelectedAssignee] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus>(ticketStatus);

  useEffect(() => {
    setSelectedStatus(ticketStatus);
  }, [ticketStatus]);

  const isClosed = ticketStatus === "CLOSED";

  const escalation = escalationQuery.data;
  const agentRuns = agentRunsQuery.data ?? [];
  const staffList = staffQuery.data ?? [];

  const handleAssign = async () => {
    if (!escalation || !selectedAssignee || assignMutation.isPending) return;
    try {
      await assignMutation.mutateAsync({
        escalationId: escalation.id,
        ticketId,
        payload: { assigned_to: selectedAssignee },
      });
      toast.success("Escalation assigned.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to assign escalation.");
    }
  };

  const handleStatusChange = async (nextStatus: TicketStatus) => {
    if (updateStatusMutation.isPending) return;
    try {
      await updateStatusMutation.mutateAsync({ status: nextStatus });
      setSelectedStatus(nextStatus);
      toast.success(`Ticket status updated to ${nextStatus}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to update ticket status.");
    }
  };

  return (
    <>
      <section className="rounded-md border border-border bg-card p-5 sm:p-6 space-y-4">
        <SectionTitle
          title="Operations & Status"
          detail="Manage ticket lifecycle and escalation assignment."
        />
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Update ticket status</Label>
            <div className="flex gap-2">
              <Select
                value={selectedStatus}
                onValueChange={(value) => setSelectedStatus(value as TicketStatus)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ticketStatuses.map((item) => (
                    <SelectItem key={item} value={item}>
                      {statusLabels[item]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={
                  isClosed || updateStatusMutation.isPending || selectedStatus === ticketStatus
                }
                onClick={() => void handleStatusChange(selectedStatus)}
              >
                {updateStatusMutation.isPending ? "Saving..." : "Update"}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {ticketStatus !== "RESOLVED" && ticketStatus !== "CLOSED" && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={updateStatusMutation.isPending}
                onClick={() => void handleStatusChange("RESOLVED")}
              >
                Mark resolved
              </Button>
            )}
            {ticketStatus !== "CLOSED" && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={updateStatusMutation.isPending}
                onClick={() => void handleStatusChange("CLOSED")}
              >
                Close ticket
              </Button>
            )}
          </div>
        </div>

        {escalation && (
          <div className="space-y-3 border-t border-border pt-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Escalation status</span>
              <span className="font-semibold text-foreground">{escalation.status}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Assigned team</span>
              <span className="font-medium text-foreground">
                {escalation.assigned_team ?? "IT Support"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Assigned technician</span>
              <span className="font-medium text-foreground">
                {escalation.assigned_to_name ?? "Unassigned"}
              </span>
            </div>
            <p className="rounded-md border border-border bg-muted/40 p-2.5 text-muted-foreground">
              <strong className="text-foreground">Reason:</strong> {escalation.reason}
            </p>

            {role === "admin" && (
              <div className="space-y-1.5 pt-1">
                <Label className="text-xs text-muted-foreground">Assign technician</Label>
                <div className="flex gap-2">
                  <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Select technician" />
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
                    disabled={assignMutation.isPending || !selectedAssignee}
                    onClick={() => void handleAssign()}
                  >
                    {assignMutation.isPending ? "Assigning..." : "Assign"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="rounded-md border border-border bg-card p-5 sm:p-6 space-y-3">
        <SectionTitle
          title="Agent Run History"
          detail={`${agentRuns.length} recorded run(s) in agent_runs.`}
        />
        {agentRunsQuery.isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : agentRuns.length === 0 ? (
          <p className="text-xs text-muted-foreground">No AI runs recorded for this ticket yet.</p>
        ) : (
          <div className="space-y-2.5 text-xs">
            {agentRuns.map((run) => (
              <div
                key={run.id}
                className="rounded-md border border-border bg-muted/30 p-2.5 space-y-1"
              >
                <div className="flex items-center justify-between font-medium text-foreground">
                  <span>{run.decision}</span>
                  <span className="font-mono text-muted-foreground">
                    {run.latency_ms !== null ? `${run.latency_ms} ms` : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    Confidence:{" "}
                    {run.confidence !== null ? `${Math.round(run.confidence * 100)}%` : "—"}
                    {run.retrieval_score !== null
                      ? ` · KB: ${Math.round(run.retrieval_score * 100)}%`
                      : ""}
                  </span>
                  <span>{new Date(run.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export function EmployeeProfile() {
  const navigate = useNavigate();
  const { user, fullName, role, signOut } = useAuth();
  const displayName = fullName ?? user?.email ?? "Employee";
  const initials = getInitials(displayName);
  const memberSince = (() => {
    if (!user?.created_at) return "—";
    const parsed = parseISO(user.created_at);
    return isValid(parsed) ? format(parsed, "MMMM yyyy") : "—";
  })();

  const handleSignOut = async () => {
    await signOut();
    await navigate({ to: "/login" });
  };

  return (
    <>
      <PageHeading
        eyebrow="Account"
        title="My profile"
        description="Your authenticated employee account details."
      />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(260px,0.7fr)]">
        <section className="rounded-md border border-border bg-card p-5 sm:p-7">
          <div className="flex items-center gap-4 border-b border-border pb-6">
            <span className="grid size-14 place-items-center rounded-full bg-accent text-base font-semibold text-accent-foreground">
              {initials}
            </span>
            <div>
              <h2 className="font-semibold">{displayName}</h2>
              <p className="mt-1 text-sm text-muted-foreground capitalize">
                {role ?? "employee"} account
              </p>
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
              <dt className="text-xs text-muted-foreground">Account role</dt>
              <dd className="mt-1 text-sm font-medium capitalize">{role ?? "employee"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Member since</dt>
              <dd className="mt-1 text-sm font-medium">{memberSince}</dd>
            </div>
          </dl>
        </section>
        <div className="space-y-4">
          <section className="rounded-md border border-border bg-card p-5">
            <h2 className="text-sm font-semibold">Account session</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Signed in as {displayName}.
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <Button variant="outline" size="sm" onClick={() => void handleSignOut()}>
                <LogOut className="mr-1.5 size-3.5" />
                Sign out
              </Button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

export function TicketFilters({
  query,
  onQueryChange,
  status,
  onStatusChange,
}: {
  query: string;
  onQueryChange: (query: string) => void;
  status: TicketStatus | "all";
  onStatusChange: (status: TicketStatus | "all") => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
      <Input
        type="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Search by ticket or title"
        aria-label="Search by ticket or title"
        className="h-10 w-full sm:max-w-xs"
      />
      <Select
        value={status}
        onValueChange={(value) => onStatusChange(value as TicketStatus | "all")}
      >
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
  );
}

export function filterTickets(
  tickets: TicketRecord[],
  query: string,
  status: TicketStatus | "all",
) {
  return tickets.filter(
    (ticket) =>
      `${ticket.id} ${ticket.title}`.toLowerCase().includes(query.toLowerCase()) &&
      (status === "all" || ticket.status === status),
  );
}

export function TicketListEmpty() {
  return (
    <EmptyState
      title="No tickets yet"
      description="Create your first support request to get started."
      action={
        <Button asChild>
          <Link to="/employee/tickets/new">
            <Plus />
            Create a ticket
          </Link>
        </Button>
      }
    />
  );
}
