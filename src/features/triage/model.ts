export type TicketStatus =
  | "NEW"
  | "ANALYZING"
  | "WAITING_FOR_USER"
  | "SOLUTION_SUGGESTED"
  | "ESCALATED"
  | "RESOLVED"
  | "CLOSED";

export type TicketPriority = "Low" | "Medium" | "High" | "Critical";

export type Ticket = {
  id: string;
  title: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  created: string;
  updated: string;
  employee: string;
  team?: string;
  risk?: "Low" | "Medium" | "High";
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