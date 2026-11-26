export type TicketStatus =
  | "NEW"
  | "ANALYZING"
  | "WAITING_FOR_USER"
  | "SOLUTION_SUGGESTED"
  | "ESCALATED"
  | "RESOLVED"
  | "CLOSED";

export type TicketPriority = "Low" | "Medium" | "High" | "Critical";

export type TicketCategory =
  | "Network / VPN"
  | "Hardware"
  | "Software / Applications"
  | "Account / Access"
  | "Email / Outlook"
  | "Other";

export type AgentDecision = "SOLUTION_SUGGESTED" | "REQUEST_MORE_INFORMATION" | "ESCALATED";

export type Ticket = {
  id: string;
  title: string;
  description?: string;
  category: string;
  priority: TicketPriority;
  risk?: "Low" | "Medium" | "High" | "Critical" | "Unknown";
  status: TicketStatus;
  final_decision?: AgentDecision;
  created: string;
  updated: string;
  employee: string;
  team?: string;
};

export type TicketMessage = {
  id: string;
  ticket_id: string;
  sender: "user" | "agent" | "human_support";
  message: string;
  created_at: string;
  pii_masked?: boolean;
};

export type EscalationRecord = {
  id: string;
  ticket_id: string;
  reason: string;
  assigned_team: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  created_at: string;
};

export type AgentRunRecord = {
  id: string;
  ticket_id: string;
  decision: AgentDecision;
  confidence: number;
  retrieval_score: number;
  latency_ms: number;
  tools_invoked: string[];
  created_at: string;
};

export type TicketFeedbackRecord = {
  id: string;
  ticket_id: string;
  rating: number; // 1 to 5
  feedback: string;
  created_at: string;
};

export const statusLabels: Record<TicketStatus, string> = {
  NEW: "New",
  ANALYZING: "Analyzing",
  WAITING_FOR_USER: "Waiting for you",
  SOLUTION_SUGGESTED: "Solution suggested",
  ESCALATED: "Escalated",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export const ticketStatuses = Object.keys(statusLabels) as TicketStatus[];
