/**
 * TypeScript types matching the FastAPI backend schemas and Supabase row shapes.
 */

export type BackendTicketCategory =
  | "Network/VPN"
  | "Hardware"
  | "Software/Applications"
  | "Account/Access"
  | "Email/Outlook"
  | "Other";

export type BackendTicketPriority = "Low" | "Medium" | "High" | "Critical";

export type BackendTicketStatus =
  | "NEW"
  | "ANALYZING"
  | "WAITING_FOR_USER"
  | "SOLUTION_SUGGESTED"
  | "ESCALATED"
  | "RESOLVED"
  | "CLOSED";

export type BackendAgentDecision = "SOLUTION_SUGGESTED" | "REQUEST_MORE_INFORMATION" | "ESCALATED";

export type BackendRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "UNKNOWN";

export type BackendMessageSender = "EMPLOYEE" | "AGENT" | "SUPPORT";

export interface TicketCreateRequest {
  title: string;
  description: string;
  category: BackendTicketCategory;
  reported_priority: BackendTicketPriority;
}

export interface TicketCreateResponse {
  ticket_id: string;
  title: string;
  status: BackendTicketStatus;
  created_at: string;
}

export interface BackendTicket {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: BackendTicketCategory | string;
  reported_priority: BackendTicketPriority;
  status: BackendTicketStatus;
  risk_level: BackendRiskLevel | null;
  final_decision: BackendAgentDecision | null;
  clarification_count?: number;
  created_at: string;
  updated_at?: string | null;
}

export interface MessageCreateRequest {
  message: string;
}

export interface BackendMessageResponse {
  id: string;
  ticket_id: string;
  sender: BackendMessageSender;
  sender_id: string | null;
  message: string;
  created_at: string;
}

export type BackendDecisionSource = "gemini" | "groq" | "fallback" | "rule";

export interface TicketAnalyzeResponse {
  ticket_id: string;
  decision: BackendAgentDecision;
  status: BackendTicketStatus;
  risk_level: BackendRiskLevel | null;
  confidence: number | null;
  retrieval_score: number | null;
  response: string;
  escalation_reason: string | null;
  decision_source?: BackendDecisionSource;
  fallback_reason?: string | null;
  latency_ms: number;
}

export interface TicketResolveRequest {
  rating?: number;
  feedback?: string;
}

export interface TicketResolveResponse {
  ticket_id: string;
  status: BackendTicketStatus;
  feedback_id: string;
  rating: number;
  feedback: string | null;
  created_at: string;
}

export interface TicketStatusUpdateRequest {
  status: BackendTicketStatus;
}

export interface TicketStatusUpdateResponse {
  ticket_id: string;
  status: BackendTicketStatus;
}

export type BackendEscalationStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";

export interface BackendEscalation {
  id: string;
  ticket_id: string;
  reason: string;
  assigned_team: string | null;
  assigned_to: string | null;
  assigned_to_name: string | null;
  status: BackendEscalationStatus;
  created_at: string;
  updated_at: string;
  ticket_title: string | null;
  ticket_description: string | null;
  ticket_category: string | null;
  ticket_priority: BackendTicketPriority | string | null;
  ticket_risk_level: BackendRiskLevel | null;
  ticket_status: BackendTicketStatus | null;
  employee_id: string | null;
  employee_name: string | null;
}

export interface EscalationAssignRequest {
  assigned_to?: string | null;
  assigned_team?: string | null;
}

export interface StaffMember {
  id: string;
  full_name: string;
  role: "support" | "admin" | string;
}

export interface BackendAgentRun {
  id: string;
  ticket_id: string;
  decision: BackendAgentDecision | string;
  confidence: number | null;
  retrieval_score: number | null;
  latency_ms: number | null;
  created_at: string;
}
