import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";

import type {
  BackendMessageResponse,
  BackendMessageSender,
  BackendRiskLevel,
  BackendTicket,
  BackendTicketCategory,
} from "@/lib/api/types";
import type { Ticket, TicketMessage } from "./model";

const BACKEND_CATEGORY_MAP: Record<string, BackendTicketCategory> = {
  "Network / VPN": "Network/VPN",
  "Network/VPN": "Network/VPN",
  Hardware: "Hardware",
  "Software / Applications": "Software/Applications",
  "Software/Applications": "Software/Applications",
  "Account / Access": "Account/Access",
  "Account/Access": "Account/Access",
  "Email / Outlook": "Email/Outlook",
  "Email/Outlook": "Email/Outlook",
  Other: "Other",
};

const DISPLAY_CATEGORY_MAP: Record<string, string> = {
  "Network/VPN": "Network / VPN",
  "Software/Applications": "Software / Applications",
  "Account/Access": "Account / Access",
  "Email/Outlook": "Email / Outlook",
};

export function toBackendCategory(label: string): BackendTicketCategory {
  return BACKEND_CATEGORY_MAP[label] ?? "Other";
}

export function toDisplayCategory(backendCategory: string): string {
  return DISPLAY_CATEGORY_MAP[backendCategory] ?? backendCategory;
}

export function toDisplayRisk(
  riskLevel: BackendRiskLevel | string | null | undefined,
): Ticket["risk"] {
  switch (riskLevel) {
    case "LOW":
      return "Low";
    case "MEDIUM":
      return "Medium";
    case "HIGH":
      return "High";
    case "CRITICAL":
      return "Critical";
    case "UNKNOWN":
      return "Unknown";
    default:
      return undefined;
  }
}

export function toDisplaySender(sender: BackendMessageSender): TicketMessage["sender"] {
  switch (sender) {
    case "EMPLOYEE":
      return "user";
    case "AGENT":
      return "agent";
    case "SUPPORT":
      return "human_support";
  }
}

export function formatDisplayTimestamp(isoString: string | null | undefined): string {
  if (!isoString) return "—";
  const parsed = parseISO(isoString);
  if (!isValid(parsed)) return isoString;
  return format(parsed, "MMM d, h:mm a");
}

export function formatRelativeTimestamp(isoString: string | null | undefined): string {
  if (!isoString) return "—";
  const parsed = parseISO(isoString);
  if (!isValid(parsed)) return isoString;
  return formatDistanceToNow(parsed, { addSuffix: true });
}

export function getInitials(nameOrEmail: string | null | undefined): string {
  if (!nameOrEmail || !nameOrEmail.trim()) return "U";
  const parts = nameOrEmail
    .trim()
    .split(/[\s@._-]+/)
    .filter(Boolean);
  const [first, second] = parts;
  if (first && second) {
    return `${first.charAt(0)}${second.charAt(0)}`.toUpperCase();
  }
  return first ? first.slice(0, 2).toUpperCase() : "U";
}

export function mapBackendTicketToDisplay(
  ticket: BackendTicket,
  employeeLabel?: string | null,
): Ticket {
  const risk = toDisplayRisk(ticket.risk_level);
  return {
    id: ticket.id,
    title: ticket.title,
    description: ticket.description,
    category: toDisplayCategory(ticket.category),
    priority: ticket.reported_priority,
    ...(risk ? { risk } : {}),
    status: ticket.status,
    ...(ticket.final_decision ? { final_decision: ticket.final_decision } : {}),
    created: formatDisplayTimestamp(ticket.created_at),
    updated: formatRelativeTimestamp(ticket.updated_at ?? ticket.created_at),
    employee: employeeLabel?.trim() ? employeeLabel : `User ${ticket.user_id.slice(0, 8)}`,
  };
}

export function mapBackendMessageToDisplay(msg: BackendMessageResponse): TicketMessage {
  return {
    id: msg.id,
    ticket_id: msg.ticket_id,
    sender: toDisplaySender(msg.sender),
    message: msg.message,
    created_at: formatDisplayTimestamp(msg.created_at),
  };
}
