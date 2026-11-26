import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch, type ApiError } from "./client";
import { ticketKeys } from "./query-keys";
import type { BackendEscalation, EscalationAssignRequest, StaffMember } from "./types";

export function fetchEscalations(): Promise<BackendEscalation[]> {
  return apiFetch<BackendEscalation[]>("/api/v1/escalations");
}

export function useEscalations() {
  return useQuery<BackendEscalation[], ApiError>({
    queryKey: ticketKeys.escalations(),
    queryFn: fetchEscalations,
  });
}

export function fetchStaffAssignees(): Promise<StaffMember[]> {
  return apiFetch<StaffMember[]>("/api/v1/escalations/assignees");
}

export function useStaffAssignees() {
  return useQuery<StaffMember[], ApiError>({
    queryKey: ticketKeys.staffAssignees(),
    queryFn: fetchStaffAssignees,
  });
}

export function assignEscalation(
  escalationId: string,
  payload: EscalationAssignRequest,
): Promise<BackendEscalation> {
  return apiFetch<BackendEscalation>(`/api/v1/escalations/${escalationId}/assign`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function useAssignEscalation() {
  const queryClient = useQueryClient();

  return useMutation<
    BackendEscalation,
    ApiError,
    { escalationId: string; ticketId: string; payload: EscalationAssignRequest }
  >({
    mutationFn: ({ escalationId, payload }) => assignEscalation(escalationId, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ticketKeys.escalations() });
      void queryClient.invalidateQueries({ queryKey: ticketKeys.escalation(variables.ticketId) });
      void queryClient.invalidateQueries({ queryKey: ticketKeys.detail(variables.ticketId) });
    },
  });
}
