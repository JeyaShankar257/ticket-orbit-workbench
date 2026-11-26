import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch, type ApiError } from "./client";
import { ticketKeys } from "./query-keys";
import type {
  BackendAgentRun,
  BackendEscalation,
  BackendTicket,
  TicketAnalyzeResponse,
  TicketCreateRequest,
  TicketCreateResponse,
  TicketResolveRequest,
  TicketResolveResponse,
  TicketStatusUpdateRequest,
  TicketStatusUpdateResponse,
} from "./types";

export function fetchTickets(): Promise<BackendTicket[]> {
  return apiFetch<BackendTicket[]>("/api/v1/tickets");
}

export function fetchTicketById(ticketId: string): Promise<BackendTicket> {
  return apiFetch<BackendTicket>(`/api/v1/tickets/${ticketId}`);
}

export function createTicket(payload: TicketCreateRequest): Promise<TicketCreateResponse> {
  return apiFetch<TicketCreateResponse>("/api/v1/tickets", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

const ANALYZE_TIMEOUT_MS = 45_000;

export function analyzeTicket(ticketId: string): Promise<TicketAnalyzeResponse> {
  return apiFetch<TicketAnalyzeResponse>(`/api/v1/tickets/${ticketId}/analyze`, {
    method: "POST",
    timeoutMs: ANALYZE_TIMEOUT_MS,
  });
}

export function useTickets() {
  const query = useQuery<BackendTicket[], ApiError>({
    queryKey: ticketKeys.lists(),
    queryFn: fetchTickets,
  });

  return {
    ...query,
    isEmpty: !query.isLoading && !query.isError && (query.data?.length ?? 0) === 0,
  };
}

export function useTicket(ticketId: string | undefined) {
  return useQuery<BackendTicket, ApiError>({
    queryKey: ticketKeys.detail(ticketId ?? ""),
    queryFn: () => fetchTicketById(ticketId as string),
    enabled: Boolean(ticketId),
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation<TicketCreateResponse, ApiError, TicketCreateRequest>({
    mutationFn: createTicket,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
}

export function useAnalyzeTicket(ticketId: string) {
  const queryClient = useQueryClient();

  return useMutation<TicketAnalyzeResponse, ApiError, void>({
    mutationFn: () => analyzeTicket(ticketId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
      void queryClient.invalidateQueries({ queryKey: ticketKeys.messages(ticketId) });
      void queryClient.invalidateQueries({ queryKey: ticketKeys.agentRuns(ticketId) });
      void queryClient.invalidateQueries({ queryKey: ticketKeys.escalation(ticketId) });
      void queryClient.invalidateQueries({ queryKey: ticketKeys.escalations() });
    },
  });
}

export function resolveTicket(
  ticketId: string,
  payload: TicketResolveRequest = {},
): Promise<TicketResolveResponse> {
  return apiFetch<TicketResolveResponse>(`/api/v1/tickets/${ticketId}/resolve`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function useResolveTicket(ticketId: string) {
  const queryClient = useQueryClient();

  return useMutation<TicketResolveResponse, ApiError, TicketResolveRequest | undefined>({
    mutationFn: (payload) => resolveTicket(ticketId, payload ?? {}),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
      void queryClient.invalidateQueries({ queryKey: ticketKeys.escalation(ticketId) });
      void queryClient.invalidateQueries({ queryKey: ticketKeys.escalations() });
    },
  });
}

export function updateTicketStatus(
  ticketId: string,
  payload: TicketStatusUpdateRequest,
): Promise<TicketStatusUpdateResponse> {
  return apiFetch<TicketStatusUpdateResponse>(`/api/v1/tickets/${ticketId}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function useUpdateTicketStatus(ticketId: string) {
  const queryClient = useQueryClient();

  return useMutation<TicketStatusUpdateResponse, ApiError, TicketStatusUpdateRequest>({
    mutationFn: (payload) => updateTicketStatus(ticketId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
      void queryClient.invalidateQueries({ queryKey: ticketKeys.escalation(ticketId) });
      void queryClient.invalidateQueries({ queryKey: ticketKeys.escalations() });
    },
  });
}

export function fetchTicketEscalation(ticketId: string): Promise<BackendEscalation | null> {
  return apiFetch<BackendEscalation | null>(`/api/v1/tickets/${ticketId}/escalation`);
}

export function useTicketEscalation(ticketId: string | undefined, enabled = true) {
  return useQuery<BackendEscalation | null, ApiError>({
    queryKey: ticketKeys.escalation(ticketId ?? ""),
    queryFn: () => fetchTicketEscalation(ticketId as string),
    enabled: Boolean(ticketId) && enabled,
  });
}

export function fetchTicketAgentRuns(ticketId: string): Promise<BackendAgentRun[]> {
  return apiFetch<BackendAgentRun[]>(`/api/v1/tickets/${ticketId}/agent-runs`);
}

export function useTicketAgentRuns(ticketId: string | undefined, enabled = true) {
  return useQuery<BackendAgentRun[], ApiError>({
    queryKey: ticketKeys.agentRuns(ticketId ?? ""),
    queryFn: () => fetchTicketAgentRuns(ticketId as string),
    enabled: Boolean(ticketId) && enabled,
  });
}
