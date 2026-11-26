import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/client";
import { useSendTicketMessage, useTicketMessages } from "@/lib/api/messages";
import { ticketKeys } from "@/lib/api/query-keys";
import { useAnalyzeTicket, useCreateTicket, useTicket, useTickets } from "@/lib/api/tickets";
import type {
  BackendMessageResponse,
  BackendTicket,
  TicketAnalyzeResponse,
  TicketCreateResponse,
} from "@/lib/api/types";

const mockApiFetch = vi.fn();

vi.mock("@/lib/api/client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/client")>("@/lib/api/client");
  return {
    ...actual,
    apiFetch: (...args: unknown[]) => mockApiFetch(...args),
  };
});

function createTestWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("API TanStack Query hooks", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  it("useTickets fetches ticket list and reports empty state when empty", async () => {
    mockApiFetch.mockResolvedValueOnce([] satisfies BackendTicket[]);

    const { result } = renderHook(() => useTickets(), {
      wrapper: createTestWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiFetch).toHaveBeenCalledWith("/api/v1/tickets");
    expect(result.current.data).toEqual([]);
    expect(result.current.isEmpty).toBe(true);
  });

  it("useTickets surfaces ApiError on failure", async () => {
    mockApiFetch.mockRejectedValueOnce(new ApiError(401, "Authentication required."));

    const { result } = renderHook(() => useTickets(), {
      wrapper: createTestWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(ApiError);
    expect(result.current.error?.status).toBe(401);
    expect(result.current.isEmpty).toBe(false);
  });

  it("useTicket fetches ticket by id and stays disabled when id is undefined", async () => {
    const { result: disabledResult } = renderHook(() => useTicket(undefined), {
      wrapper: createTestWrapper(queryClient),
    });

    expect(disabledResult.current.fetchStatus).toBe("idle");
    expect(mockApiFetch).not.toHaveBeenCalled();

    const sampleTicket: BackendTicket = {
      id: "ticket-1",
      user_id: "user-1",
      title: "VPN drops",
      description: "GlobalProtect drops every 5 minutes",
      category: "Network/VPN",
      reported_priority: "High",
      status: "NEW",
      risk_level: null,
      final_decision: null,
      created_at: "2026-11-25T10:00:00Z",
    };

    mockApiFetch.mockResolvedValueOnce(sampleTicket);

    const { result } = renderHook(() => useTicket("ticket-1"), {
      wrapper: createTestWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiFetch).toHaveBeenCalledWith("/api/v1/tickets/ticket-1");
    expect(result.current.data).toEqual(sampleTicket);
  });

  it("useCreateTicket posts payload and invalidates ticket lists", async () => {
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const created: TicketCreateResponse = {
      ticket_id: "ticket-2",
      title: "Outlook broken",
      status: "NEW",
      created_at: "2026-11-25T11:00:00Z",
    };
    mockApiFetch.mockResolvedValueOnce(created);

    const { result } = renderHook(() => useCreateTicket(), {
      wrapper: createTestWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        title: "Outlook broken",
        description: "Outlook search returns no results",
        category: "Email/Outlook",
        reported_priority: "Medium",
      });
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/api/v1/tickets", {
      method: "POST",
      body: JSON.stringify({
        title: "Outlook broken",
        description: "Outlook search returns no results",
        category: "Email/Outlook",
        reported_priority: "Medium",
      }),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ticketKeys.lists() });
  });

  it("useTicketMessages fetches messages and reports empty state", async () => {
    const messages: BackendMessageResponse[] = [
      {
        id: "msg-1",
        ticket_id: "ticket-1",
        sender: "EMPLOYEE",
        sender_id: "user-1",
        message: "Still failing",
        created_at: "2026-11-25T10:05:00Z",
      },
    ];
    mockApiFetch.mockResolvedValueOnce(messages);

    const { result } = renderHook(() => useTicketMessages("ticket-1"), {
      wrapper: createTestWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiFetch).toHaveBeenCalledWith("/api/v1/tickets/ticket-1/messages");
    expect(result.current.data).toEqual(messages);
    expect(result.current.isEmpty).toBe(false);
  });

  it("useSendTicketMessage posts message and invalidates messages and ticket detail", async () => {
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const msg: BackendMessageResponse = {
      id: "msg-2",
      ticket_id: "ticket-1",
      sender: "EMPLOYEE",
      sender_id: "user-1",
      message: "Using GlobalProtect v6.1",
      created_at: "2026-11-25T10:06:00Z",
    };
    mockApiFetch.mockResolvedValueOnce(msg);

    const { result } = renderHook(() => useSendTicketMessage("ticket-1"), {
      wrapper: createTestWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ message: "Using GlobalProtect v6.1" });
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/api/v1/tickets/ticket-1/messages", {
      method: "POST",
      body: JSON.stringify({ message: "Using GlobalProtect v6.1" }),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ticketKeys.messages("ticket-1") });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ticketKeys.detail("ticket-1") });
  });

  it("useAnalyzeTicket posts analyze and invalidates lists, detail, and messages", async () => {
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const analysis: TicketAnalyzeResponse = {
      ticket_id: "ticket-1",
      decision: "ESCALATED",
      status: "ESCALATED",
      risk_level: "CRITICAL",
      confidence: 1.0,
      retrieval_score: 0.91,
      response: "Escalating to security team.",
      escalation_reason: "Suspicious login detected",
      latency_ms: 420,
    };
    mockApiFetch.mockResolvedValueOnce(analysis);

    const { result } = renderHook(() => useAnalyzeTicket("ticket-1"), {
      wrapper: createTestWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/api/v1/tickets/ticket-1/analyze", {
      method: "POST",
      timeoutMs: 45000,
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ticketKeys.lists() });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ticketKeys.detail("ticket-1") });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ticketKeys.messages("ticket-1") });
  });
});
