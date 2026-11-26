export const ticketKeys = {
  all: ["tickets"] as const,
  lists: () => [...ticketKeys.all, "list"] as const,
  details: () => [...ticketKeys.all, "detail"] as const,
  detail: (ticketId: string) => [...ticketKeys.details(), ticketId] as const,
  messages: (ticketId: string) => [...ticketKeys.detail(ticketId), "messages"] as const,
  escalation: (ticketId: string) => [...ticketKeys.detail(ticketId), "escalation"] as const,
  agentRuns: (ticketId: string) => [...ticketKeys.detail(ticketId), "agent-runs"] as const,
  escalations: () => [...ticketKeys.all, "escalations"] as const,
  staffAssignees: () => [...ticketKeys.all, "staff-assignees"] as const,
};
