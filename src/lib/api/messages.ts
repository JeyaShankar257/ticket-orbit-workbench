import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch, type ApiError } from "./client";
import { ticketKeys } from "./query-keys";
import type { BackendMessageResponse, MessageCreateRequest } from "./types";

export function fetchTicketMessages(ticketId: string): Promise<BackendMessageResponse[]> {
  return apiFetch<BackendMessageResponse[]>(`/api/v1/tickets/${ticketId}/messages`);
}

export function sendTicketMessage(
  ticketId: string,
  payload: MessageCreateRequest,
): Promise<BackendMessageResponse> {
  return apiFetch<BackendMessageResponse>(`/api/v1/tickets/${ticketId}/messages`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function useTicketMessages(ticketId: string | undefined) {
  const query = useQuery<BackendMessageResponse[], ApiError>({
    queryKey: ticketKeys.messages(ticketId ?? ""),
    queryFn: () => fetchTicketMessages(ticketId as string),
    enabled: Boolean(ticketId),
  });

  return {
    ...query,
    isEmpty: !query.isLoading && !query.isError && (query.data?.length ?? 0) === 0,
  };
}

export function useSendTicketMessage(ticketId: string) {
  const queryClient = useQueryClient();

  return useMutation<BackendMessageResponse, ApiError, MessageCreateRequest>({
    mutationFn: (payload) => sendTicketMessage(ticketId, payload),
    onSuccess: (createdMessage) => {
      queryClient.setQueryData<BackendMessageResponse[]>(
        ticketKeys.messages(ticketId),
        (existing) => {
          if (!existing) return [createdMessage];
          if (existing.some((item) => item.id === createdMessage.id)) return existing;
          return [...existing, createdMessage];
        },
      );
      void queryClient.invalidateQueries({ queryKey: ticketKeys.messages(ticketId) });
      void queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
    },
  });
}
