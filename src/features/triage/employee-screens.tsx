import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  Check,
  CheckCircle2,
  CircleHelp,
  Clock3,
  FileText,
  Laptop,
  LogOut,
  Plus,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
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
import { Textarea } from "@/components/ui/textarea";
import { demoFeedback, demoTicketMessages, demoTickets } from "./demo-data";
import {
  EmptyState,
  Metric,
  PageHeading,
  PreviewNotice,
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

export function EmployeeDashboard() {
  return (
    <>
      <PreviewNotice>
        You're viewing a sample workspace. Ticket counts and updates are illustrative, not live
        records.
      </PreviewNotice>
      <PageHeading
        eyebrow="Tuesday · employee workspace"
        title="Good morning, Morgan"
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
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total requests" value="06" note="Across all statuses" icon={Ticket} />
        <Metric
          label="In progress"
          value="02"
          note="Being reviewed by support"
          icon={Clock3}
          tone="blue"
        />
        <Metric
          label="Waiting for you"
          value="01"
          note="A response may be needed"
          icon={CircleHelp}
          tone="warning"
        />
        <Metric label="Resolved" value="01" note="Recently completed" icon={CheckCircle2} />
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
          <TicketTable tickets={demoTickets.slice(0, 4)} />
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
            Two requests are moving through the support process. One is waiting for a reply from
            you.
          </p>
          <div className="mt-5 space-y-4">
            <div className="flex items-center gap-3 border-t border-border pt-4">
              <span className="grid size-9 place-items-center rounded-md bg-chart-2/10 text-chart-2">
                <Laptop className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">VPN connection</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Latest update · 12 min ago</p>
              </div>
              <StatusBadge status="ANALYZING" />
            </div>
            <div className="flex items-center gap-3 border-t border-border pt-4">
              <span className="grid size-9 place-items-center rounded-md bg-chart-3/15 text-foreground">
                <FileText className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">Shared drive access</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Latest update · 38 min ago</p>
              </div>
              <StatusBadge status="WAITING_FOR_USER" />
            </div>
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
              Tell us what's going on and we'll get the right support moving.
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
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const filtered = demoTickets.filter((ticket) => {
    const matchesQuery = `${ticket.id} ${ticket.title}`.toLowerCase().includes(query.toLowerCase());
    return (
      matchesQuery &&
      (status === "all" || ticket.status === status) &&
      (priority === "all" || ticket.priority === priority)
    );
  });
  return (
    <>
      <PreviewNotice>
        These sample tickets are included to preview the interface. No personal ticket data is
        connected.
      </PreviewNotice>
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
        <TicketTable tickets={filtered} />
        <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
          Showing {filtered.length} of {demoTickets.length} sample tickets
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
  const [selectedPriority, setSelectedPriority] = useState<TicketPriority>("Medium");
  const [previewReady, setPreviewReady] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(categories[0] ?? "Other");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (title.trim().length < 4 || description.trim().length < 20) {
      setError("Add a clear title and at least 20 characters describing the issue.");
      setPreviewReady(false);
      return;
    }
    setError("");
    setPreviewReady(true);
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
                minLength={4}
                maxLength={120}
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
                minLength={20}
                maxLength={2000}
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
            {previewReady ? (
              <div
                className="rounded-md border border-chart-3/30 bg-chart-3/10 px-4 py-3 text-sm"
                role="status"
              >
                <p className="font-semibold">Your request preview is ready.</p>
                <p className="mt-1 text-muted-foreground">
                  This frontend preview cannot submit or save a ticket. Nothing was sent.
                </p>
              </div>
            ) : null}
            <div className="flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" asChild>
                <Link to="/employee/dashboard">Cancel</Link>
              </Button>
              <Button type="submit">
                Preview request
                <ArrowRight />
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
          <PreviewNotice>
            Submitting is disabled in this preview. A live support service is not connected.
          </PreviewNotice>
        </aside>
      </div>
    </>
  );
}

export function TicketDetails({ id }: { id: string }) {
  const initialTicket = demoTickets.find((item) => item.id === id) ?? demoTickets[0];
  const [ticket, setTicket] = useState(initialTicket);
  const [messages, setMessages] = useState(demoTicketMessages[id] ?? []);
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  if (!ticket)
    return (
      <EmptyState
        title="Ticket not found"
        description="This sample ticket is not part of the preview data."
      />
    );

  const handleSendClarification = (e: FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    const newMsg = {
      id: `msg-${Date.now()}`,
      ticket_id: ticket.id,
      sender: "user" as const,
      message: replyText.trim(),
      created_at: "Just now",
    };

    setMessages((prev) => [...prev, newMsg]);
    setReplyText("");
    setIsSubmittingReply(true);

    toast.info("Clarification submitted. PII masking active.");

    setTimeout(() => {
      setIsSubmittingReply(false);
      const agentReply = {
        id: `msg-${Date.now() + 1}`,
        ticket_id: ticket.id,
        sender: "agent" as const,
        message:
          "Clarification received. The agent workflow has resumed context analysis and is querying the ChromaDB knowledge base for matching solutions.",
        created_at: "Just now",
      };
      setMessages((prev) => [...prev, agentReply]);
      toast.success("Agent re-evaluated ticket context.");
    }, 1000);
  };

  const handleConfirmResolution = () => {
    setTicket((prev) => (prev ? { ...prev, status: "RESOLVED" } : prev));
    toast.success("Ticket confirmed as RESOLVED. Thank you for closing the loop!");
  };

  const handleFeedbackSubmit = () => {
    setFeedbackSubmitted(true);
    toast.success("Feedback recorded in Supabase PostgreSQL!");
  };

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="mb-5 px-2">
        <Link to="/employee/tickets">
          <ArrowRight className="rotate-180" />
          Back to tickets
        </Link>
      </Button>
      <PageHeading
        eyebrow={`Ticket ${ticket.id}`}
        title={ticket.title}
        description="Request details and agentic support conversation for this ticket."
        actions={<StatusBadge status={ticket.status} />}
      />

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(310px,0.8fr)]">
        <div className="space-y-5">
          {/* Request details with PII Masking Note (FR-01 to FR-04) */}
          <section className="rounded-md border border-border bg-card p-5 sm:p-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <SectionTitle title="Request details" detail={`Reported by ${ticket.employee}`} />
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                <ShieldCheck className="size-3.5" />
                PII Masking Active
              </span>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">
              {ticket.description ??
                "My VPN connection drops every few minutes while I’m on calls. I’ve restarted the client, but the issue keeps coming back."}
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

          {/* Support Conversation & Clarification Thread (FR-08, FR-09, FR-17) */}
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

            {messages.length === 0 ? (
              <EmptyState
                icon={CircleHelp}
                title="No conversation thread yet"
                description="Agent questions or support replies will appear here once analysis commences."
              />
            ) : (
              <div className="mt-4 space-y-4">
                {messages.map((msg) => {
                  const isAgent = msg.sender === "agent";
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${
                        isAgent ? "items-start" : "items-start flex-row-reverse"
                      }`}
                    >
                      <span
                        className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                          isAgent
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isAgent ? <Bot className="size-4" /> : "ML"}
                      </span>
                      <div
                        className={`max-w-[85%] rounded-lg p-3.5 text-xs sm:text-sm leading-relaxed ${
                          isAgent
                            ? "border border-border bg-muted/30 text-foreground"
                            : "bg-primary text-primary-foreground"
                        }`}
                      >
                        <div
                          className={`flex items-center gap-2 mb-1 text-[11px] font-semibold ${
                            isAgent ? "text-primary" : "text-primary-foreground/80"
                          }`}
                        >
                          <span>{isAgent ? "TriageAgent AI" : "Morgan Lee (You)"}</span>
                          <span className="font-normal opacity-70">· {msg.created_at}</span>
                          {msg.pii_masked && (
                            <span className="ml-auto rounded bg-primary/20 px-1.5 py-0.2 text-[10px] uppercase font-bold text-primary">
                              PII Protected
                            </span>
                          )}
                        </div>
                        <p className="whitespace-pre-line">{msg.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Clarification Input Box (FR-08, FR-09) */}
            {ticket.status !== "RESOLVED" && ticket.status !== "CLOSED" && (
              <form onSubmit={handleSendClarification} className="mt-5 border-t border-border pt-4">
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
                    disabled={isSubmittingReply}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="gap-1.5 shrink-0"
                    disabled={isSubmittingReply || !replyText.trim()}
                  >
                    <Send className="size-3.5" />
                    <span>Send</span>
                  </Button>
                </div>
              </form>
            )}
          </section>

          {/* Solution Suggestion & User Confirmation (FR-14, FR-19, FR-20) */}
          {(ticket.status === "SOLUTION_SUGGESTED" || ticket.status === "RESOLVED") && (
            <section className="rounded-md border border-chart-2/40 bg-chart-2/5 p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 text-chart-2 font-semibold">
                <Sparkles className="size-5" />
                <h3>Knowledge-Grounded Solution</h3>
              </div>
              <p className="text-xs sm:text-sm leading-6 text-foreground">
                The agent evaluated matching documentation from ChromaDB RAG (Score: 0.95) and
                synthesized the verified resolution steps above.
              </p>

              {ticket.status !== "RESOLVED" ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-md border border-border bg-card p-4">
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold">
                      Did this solve your problem?
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Confirming resolution officially closes the ticket.
                    </p>
                  </div>
                  <Button onClick={handleConfirmResolution} className="gap-1.5 shrink-0">
                    <Check className="size-4" />
                    Confirm Resolution
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border border-primary/20 bg-primary/10 p-4">
                  <div className="flex items-center gap-2 text-primary text-sm font-semibold">
                    <CheckCircle2 className="size-4" />
                    <span>Ticket confirmed RESOLVED by employee</span>
                  </div>

                  {!feedbackSubmitted ? (
                    <div className="mt-3 pt-3 border-t border-primary/20 space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Rate this resolution (FR-19 Feedback):
                      </p>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setRating(s)}
                            className="p-1 hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`size-4 ${
                                s <= rating ? "text-chart-4 fill-chart-4" : "text-muted-foreground"
                              }`}
                            />
                          </button>
                        ))}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleFeedbackSubmit}
                          className="ml-3 h-7 text-xs"
                        >
                          Submit Rating
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">
                      ★ Feedback submitted. Thank you for helping improve our AI triage models!
                    </p>
                  )}
                </div>
              )}
            </section>
          )}
        </div>

        {/* Sidebar Activity & Status (FR-06, FR-15, FR-16) */}
        <div className="space-y-5">
          <section className="rounded-md border border-border bg-card p-5 sm:p-6 space-y-4">
            <SectionTitle
              title="Agent Risk & Triage"
              detail="Independent assessment from LangGraph context node."
            />
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Assessed Urgency Risk</span>
                <span
                  className={`font-semibold ${
                    ticket.risk === "High"
                      ? "text-destructive"
                      : ticket.risk === "Medium"
                        ? "text-chart-4"
                        : "text-primary"
                  }`}
                >
                  {ticket.risk ?? "Low"} Risk
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Agent Decision</span>
                <span className="font-semibold text-foreground">
                  {ticket.final_decision ?? "ANALYZING"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Assigned Human Team</span>
                <span className="font-semibold text-foreground">
                  {ticket.team ?? "AI Auto-Triage"}
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-md border border-border bg-card p-5 sm:p-6">
            <SectionTitle
              title="Ticket Timeline"
              detail="State transitions across the SDLC lifecycle."
            />
            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <span className="size-2 rounded-full bg-primary mt-1.5" />
                <div>
                  <p className="font-medium text-foreground">NEW &bull; Ticket submitted</p>
                  <p className="text-muted-foreground">{ticket.created}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="size-2 rounded-full bg-chart-4 mt-1.5" />
                <div>
                  <p className="font-medium text-foreground">ANALYZING &bull; Context evaluated</p>
                  <p className="text-muted-foreground">PII masked, risk calculated</p>
                </div>
              </div>
              {ticket.status === "WAITING_FOR_USER" && (
                <div className="flex items-start gap-2.5">
                  <span className="size-2 rounded-full bg-chart-3 mt-1.5" />
                  <div>
                    <p className="font-medium text-foreground">
                      WAITING_FOR_USER &bull; Clarification asked
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
                      ESCALATED &bull; Assigned to {ticket.team}
                    </p>
                    <p className="text-muted-foreground">{ticket.updated}</p>
                  </div>
                </div>
              )}
              {ticket.status === "RESOLVED" && (
                <div className="flex items-start gap-2.5">
                  <span className="size-2 rounded-full bg-primary mt-1.5" />
                  <div>
                    <p className="font-medium text-foreground">RESOLVED &bull; User confirmed</p>
                    <p className="text-muted-foreground">Just now</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

export function EmployeeProfile() {
  return (
    <>
      <PageHeading
        eyebrow="Account"
        title="My profile"
        description="Your employee account details for this preview workspace."
      />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(260px,0.7fr)]">
        <section className="rounded-md border border-border bg-card p-5 sm:p-7">
          <div className="flex items-center gap-4 border-b border-border pb-6">
            <span className="grid size-14 place-items-center rounded-full bg-accent text-base font-semibold text-accent-foreground">
              ML
            </span>
            <div>
              <h2 className="font-semibold">Morgan Lee</h2>
              <p className="mt-1 text-sm text-muted-foreground">Employee account · Preview</p>
            </div>
          </div>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-5 pt-6 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Full name</dt>
              <dd className="mt-1 text-sm font-medium">Morgan Lee</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Email address</dt>
              <dd className="mt-1 break-all text-sm font-medium">morgan.lee@example.com</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Account role</dt>
              <dd className="mt-1 text-sm font-medium">Employee</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Member since</dt>
              <dd className="mt-1 text-sm font-medium">September 2025</dd>
            </div>
          </dl>
        </section>
        <div className="space-y-4">
          <PreviewNotice>
            This profile represents sample employee credentials. Use the session controls below to
            test sign-in or register another profile.
          </PreviewNotice>
          <section className="rounded-md border border-border bg-card p-5">
            <h2 className="text-sm font-semibold">Account session</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              You are currently viewing the workspace as Morgan Lee.
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <Button variant="outline" size="sm" asChild>
                <Link to="/login">
                  <LogOut className="mr-1.5 size-3.5" />
                  Sign out
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/register">Create new account</Link>
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
      description="Your support requests will appear here when a ticket service is connected."
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
