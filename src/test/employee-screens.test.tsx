import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EmployeeDashboard, NewTicket, TicketDetails } from "@/features/triage/employee-screens";
import {
  mapBackendMessageToDisplay,
  mapBackendTicketToDisplay,
  toBackendCategory,
  toDisplayCategory,
  toDisplayRisk,
  toDisplaySender,
} from "@/features/triage/mappers";
import { ApiError } from "@/lib/api/client";
import type { BackendMessageResponse, BackendTicket } from "@/lib/api/types";

const mockNavigate = vi.fn();
const mockUseTickets = vi.fn();
const mockUseTicket = vi.fn();
const mockUseTicketMessages = vi.fn();
const mockCreateMutateAsync = vi.fn();
const mockSendMutateAsync = vi.fn();
const mockAnalyzeMutateAsync = vi.fn();
const mockResolveMutateAsync = vi.fn();
const mockUpdateStatusMutateAsync = vi.fn();
const mockAssignMutateAsync = vi.fn();
const mockUseSendTicketMessage = vi.fn();
const mockUseAnalyzeTicket = vi.fn();

const mockUseTicketEscalation = vi.fn();
const mockUseTicketAgentRuns = vi.fn();
const mockUseStaffAssignees = vi.fn();
const mockUseAuth = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
  useNavigate: () => mockNavigate,
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/lib/api", () => ({
  useTickets: () => mockUseTickets(),
  useTicket: (id: string) => mockUseTicket(id),
  useTicketMessages: (id: string) => mockUseTicketMessages(id),
  useCreateTicket: () => ({
    mutateAsync: mockCreateMutateAsync,
    isPending: false,
  }),
  useSendTicketMessage: () => mockUseSendTicketMessage(),
  useAnalyzeTicket: () => mockUseAnalyzeTicket(),
  useResolveTicket: () => ({
    mutateAsync: mockResolveMutateAsync,
    isPending: false,
    isError: false,
    error: null,
  }),
  useUpdateTicketStatus: () => ({
    mutateAsync: mockUpdateStatusMutateAsync,
    isPending: false,
  }),
  useTicketEscalation: () => mockUseTicketEscalation(),
  useTicketAgentRuns: () => mockUseTicketAgentRuns(),
  useStaffAssignees: () => mockUseStaffAssignees(),
  useAssignEscalation: () => ({
    mutateAsync: mockAssignMutateAsync,
    isPending: false,
  }),
}));

const sampleBackendTicket: BackendTicket = {
  id: "123e4567-e89b-12d3-a456-426614174001",
  user_id: "123e4567-e89b-12d3-a456-426614174000",
  title: "GlobalProtect VPN disconnects",
  description: "Drops every 5 minutes during video calls on home fiber.",
  category: "Network/VPN",
  reported_priority: "High",
  status: "WAITING_FOR_USER",
  risk_level: "HIGH",
  final_decision: "REQUEST_MORE_INFORMATION",
  created_at: "2026-11-25T09:00:00Z",
  updated_at: "2026-11-25T09:15:00Z",
};

describe("triage mappers", () => {
  it("maps backend categories, risk levels, and message senders accurately", () => {
    expect(toBackendCategory("Network / VPN")).toBe("Network/VPN");
    expect(toDisplayCategory("Network/VPN")).toBe("Network / VPN");
    expect(toDisplayRisk("LOW")).toBe("Low");
    expect(toDisplayRisk("MEDIUM")).toBe("Medium");
    expect(toDisplayRisk("HIGH")).toBe("High");
    expect(toDisplayRisk("CRITICAL")).toBe("Critical");
    expect(toDisplayRisk("UNKNOWN")).toBe("Unknown");
    expect(toDisplayRisk(null)).toBeUndefined();
    expect(toDisplaySender("EMPLOYEE")).toBe("user");
    expect(toDisplaySender("AGENT")).toBe("agent");
    expect(toDisplaySender("SUPPORT")).toBe("human_support");
  });

  it("maps backend ticket without inventing employee names", () => {
    const mapped = mapBackendTicketToDisplay(sampleBackendTicket);
    expect(mapped.priority).toBe("High");
    expect(mapped.risk).toBe("High");
    expect(mapped.category).toBe("Network / VPN");
    expect(mapped.employee).toBe("User 123e4567");
  });

  it("maps backend message to display message", () => {
    const backendMsg: BackendMessageResponse = {
      id: "msg-1",
      ticket_id: sampleBackendTicket.id,
      sender: "AGENT",
      sender_id: null,
      message: "Which VPN client version are you running?",
      created_at: "2026-11-25T09:05:00Z",
    };
    const mapped = mapBackendMessageToDisplay(backendMsg);
    expect(mapped.sender).toBe("agent");
    expect(mapped.message).toBe("Which VPN client version are you running?");
  });
});

describe("Employee workflow screens", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      session: { access_token: "token" },
      user: {
        id: "user-12345678",
        email: "employee@example.com",
        created_at: "2026-01-01T00:00:00Z",
      },
      role: "employee",
      fullName: "Jordan Rivera",
      loading: false,
      profileError: null,
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    });
    mockUseTicketEscalation.mockReturnValue({ data: null, isLoading: false });
    mockUseTicketAgentRuns.mockReturnValue({ data: [], isLoading: false });
    mockUseStaffAssignees.mockReturnValue({ data: [], isLoading: false });
    mockUseSendTicketMessage.mockReturnValue({
      mutateAsync: mockSendMutateAsync,
      isPending: false,
      isError: false,
      error: null,
    });
    mockUseAnalyzeTicket.mockReturnValue({
      mutateAsync: mockAnalyzeMutateAsync,
      isPending: false,
      isError: false,
      error: null,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("EmployeeDashboard renders live ticket counts and does not fall back to demo data on error", () => {
    const refetch = vi.fn();
    mockUseTickets.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new ApiError(500, "Backend unavailable"),
      refetch,
    });

    render(<EmployeeDashboard />);

    expect(screen.getByRole("alert")).toHaveTextContent("Backend unavailable");
    expect(screen.queryByText("TA-2841")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(refetch).toHaveBeenCalled();
  });

  it("NewTicket submits through useCreateTicket and navigates to the created ticket", async () => {
    mockCreateMutateAsync.mockResolvedValue({
      ticket_id: "new-ticket-uuid",
      title: "Cannot access finance drive",
      status: "NEW",
      created_at: "2026-11-25T10:00:00Z",
    });

    render(<NewTicket />);

    fireEvent.change(screen.getByLabelText(/problem title/i), {
      target: { value: "Cannot access finance drive" },
    });
    fireEvent.change(screen.getByLabelText(/what’s happening/i), {
      target: { value: "Getting network path not found error on Windows 11." },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit ticket/i }));

    await waitFor(() => {
      expect(mockCreateMutateAsync).toHaveBeenCalledWith({
        title: "Cannot access finance drive",
        description: "Getting network path not found error on Windows 11.",
        category: "Network/VPN",
        reported_priority: "Medium",
      });
      expect(mockNavigate).toHaveBeenCalledWith({
        to: "/employee/tickets/$id",
        params: { id: "new-ticket-uuid" },
      });
    });
  });

  it("TicketDetails loads live ticket, sends messages, and triggers AI analysis", async () => {
    mockUseTicket.mockReturnValue({
      data: sampleBackendTicket,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseTicketMessages.mockReturnValue({
      data: [
        {
          id: "m-1",
          ticket_id: sampleBackendTicket.id,
          sender: "AGENT",
          sender_id: null,
          message: "Please confirm your GlobalProtect version.",
          created_at: "2026-11-25T09:05:00Z",
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    mockSendMutateAsync.mockResolvedValue({
      id: "m-2",
      ticket_id: sampleBackendTicket.id,
      sender: "EMPLOYEE",
      sender_id: sampleBackendTicket.user_id,
      message: "Using v6.1",
      created_at: "2026-11-25T09:10:00Z",
    });
    mockAnalyzeMutateAsync.mockResolvedValue({
      ticket_id: sampleBackendTicket.id,
      decision: "ESCALATED",
      status: "ESCALATED",
      risk_level: "CRITICAL",
      confidence: 1.0,
      retrieval_score: 0.9,
      response: "Escalating critical issue.",
      escalation_reason: "Repeated VPN disconnects on production calls",
      decision_source: "gemini",
      fallback_reason: null,
      latency_ms: 350,
    });

    render(<TicketDetails id={sampleBackendTicket.id} />);

    expect(screen.getByText("GlobalProtect VPN disconnects")).toBeInTheDocument();
    expect(screen.getByText("Please confirm your GlobalProtect version.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/reply to agent clarification/i), {
      target: { value: "Using v6.1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(mockSendMutateAsync).toHaveBeenCalledWith({ message: "Using v6.1" });
    });

    fireEvent.click(screen.getByRole("button", { name: /analyze with ai/i }));

    await waitFor(() => {
      expect(mockAnalyzeMutateAsync).toHaveBeenCalled();
      expect(screen.getByText("Escalating critical issue.")).toBeInTheDocument();
      expect(screen.getByText("Analyzed by Gemini")).toBeInTheDocument();
      expect(screen.getByText("100%")).toBeInTheDocument();
    });
  });

  it("TicketDetails clearly indicates fallback analysis when Gemini quota is exceeded", async () => {
    mockUseTicket.mockReturnValue({
      data: sampleBackendTicket,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseTicketMessages.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    mockAnalyzeMutateAsync.mockResolvedValue({
      ticket_id: sampleBackendTicket.id,
      decision: "REQUEST_MORE_INFORMATION",
      status: "WAITING_FOR_USER",
      risk_level: "HIGH",
      confidence: 0.75,
      retrieval_score: null,
      response: "Network/VPN troubleshooting: Please restart your VPN client.",
      escalation_reason: null,
      decision_source: "groq",
      fallback_reason: "Gemini unavailable (GoogleRateLimitError); handled by Groq fallback.",
      latency_ms: 45,
    });

    render(<TicketDetails id={sampleBackendTicket.id} />);
    fireEvent.click(screen.getByRole("button", { name: /analyze with ai/i }));

    await waitFor(() => {
      expect(screen.getByText("Fallback analysis – Groq (Gemini unavailable)")).toBeInTheDocument();
      expect(
        screen.getByText("Network/VPN troubleshooting: Please restart your VPN client."),
      ).toBeInTheDocument();
    });
  });

  it("automatically triggers exactly one AI analysis after owner submits clarification on WAITING_FOR_USER ticket", async () => {
    const ownedWaitingTicket: BackendTicket = {
      ...sampleBackendTicket,
      user_id: "user-12345678",
      status: "WAITING_FOR_USER",
    };

    mockUseTicket.mockReturnValue({
      data: ownedWaitingTicket,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseTicketMessages.mockReturnValue({
      data: [
        {
          id: "m-1",
          ticket_id: ownedWaitingTicket.id,
          sender: "AGENT",
          sender_id: null,
          message: "Are you using the approved VPN client?",
          created_at: "2026-11-25T09:05:00Z",
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    mockSendMutateAsync.mockResolvedValue({
      id: "m-2",
      ticket_id: ownedWaitingTicket.id,
      sender: "EMPLOYEE",
      sender_id: "user-12345678",
      message: "approved VPN client",
      created_at: "2026-11-25T09:10:00Z",
    });
    mockAnalyzeMutateAsync.mockResolvedValue({
      ticket_id: ownedWaitingTicket.id,
      decision: "SOLUTION_SUGGESTED",
      status: "SOLUTION_SUGGESTED",
      risk_level: "HIGH",
      confidence: 0.9,
      retrieval_score: 0.85,
      response: "Please reset your VPN profile and reconnect.",
      escalation_reason: null,
      decision_source: "gemini",
      fallback_reason: null,
      latency_ms: 210,
    });

    render(<TicketDetails id={ownedWaitingTicket.id} />);

    fireEvent.change(screen.getByLabelText(/reply to agent clarification/i), {
      target: { value: "approved VPN client" },
    });

    const sendButton = screen.getByRole("button", { name: /send/i });
    fireEvent.click(sendButton);
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockSendMutateAsync).toHaveBeenCalledTimes(1);
      expect(mockSendMutateAsync).toHaveBeenCalledWith({ message: "approved VPN client" });
      expect(mockAnalyzeMutateAsync).toHaveBeenCalledTimes(1);
      expect(screen.getByText("Please reset your VPN profile and reconnect.")).toBeInTheDocument();
    });
  });

  it("does not trigger analysis when message submission fails", async () => {
    const ownedWaitingTicket: BackendTicket = {
      ...sampleBackendTicket,
      user_id: "user-12345678",
      status: "WAITING_FOR_USER",
    };

    mockUseTicket.mockReturnValue({
      data: ownedWaitingTicket,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseTicketMessages.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    mockSendMutateAsync.mockRejectedValue(new ApiError(500, "Failed to save message"));

    render(<TicketDetails id={ownedWaitingTicket.id} />);

    fireEvent.change(screen.getByLabelText(/reply to agent clarification/i), {
      target: { value: "approved VPN client" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(mockSendMutateAsync).toHaveBeenCalledTimes(1);
    });
    expect(mockAnalyzeMutateAsync).not.toHaveBeenCalled();
  });

  it("triggers automatic AI follow-up when owner sends a message on ESCALATED ticket", async () => {
    const escalatedTicket: BackendTicket = {
      ...sampleBackendTicket,
      user_id: "user-12345678",
      status: "ESCALATED",
    };

    mockUseTicket.mockReturnValue({
      data: escalatedTicket,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseTicketMessages.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    mockSendMutateAsync.mockResolvedValue({
      id: "m-2",
      ticket_id: escalatedTicket.id,
      sender: "EMPLOYEE",
      sender_id: "user-12345678",
      message: "why this issue arise",
      created_at: "2026-11-25T09:10:00Z",
    });
    mockAnalyzeMutateAsync.mockResolvedValue({
      ticket_id: escalatedTicket.id,
      decision: "ESCALATED",
      status: "ESCALATED",
      risk_level: "HIGH",
      confidence: 0.9,
      retrieval_score: 0.7,
      response: "Boot loops can be caused by OS corruption, RAM/SSD faults, or firmware updates.",
      escalation_reason: "Suspected hardware failure",
      decision_source: "gemini",
      fallback_reason: null,
      latency_ms: 150,
    });

    render(<TicketDetails id={escalatedTicket.id} />);

    fireEvent.change(screen.getByLabelText(/reply to agent clarification/i), {
      target: { value: "why this issue arise" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(mockSendMutateAsync).toHaveBeenCalledTimes(1);
      expect(mockAnalyzeMutateAsync).toHaveBeenCalledTimes(1);
      expect(
        screen.getByText(
          "Boot loops can be caused by OS corruption, RAM/SSD faults, or firmware updates.",
        ),
      ).toBeInTheDocument();
    });
  });

  it("does not trigger automatic analysis for non-owner replies", async () => {
    const nonOwnerTicket: BackendTicket = {
      ...sampleBackendTicket,
      user_id: "different-user-id",
      status: "WAITING_FOR_USER",
    };

    mockUseTicket.mockReturnValue({
      data: nonOwnerTicket,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseTicketMessages.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    mockSendMutateAsync.mockResolvedValue({
      id: "m-2",
      ticket_id: nonOwnerTicket.id,
      sender: "SUPPORT",
      sender_id: "user-12345678",
      message: "IT Support is looking into this.",
      created_at: "2026-11-25T09:10:00Z",
    });

    render(<TicketDetails id={nonOwnerTicket.id} />);

    fireEvent.change(screen.getByLabelText(/reply to agent clarification/i), {
      target: { value: "IT Support is looking into this." },
    });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(mockSendMutateAsync).toHaveBeenCalledTimes(1);
    });
    expect(mockAnalyzeMutateAsync).not.toHaveBeenCalled();
  });

  it("preserves saved reply and allows manual retry when automatic analysis fails", async () => {
    const ownedWaitingTicket: BackendTicket = {
      ...sampleBackendTicket,
      user_id: "user-12345678",
      status: "WAITING_FOR_USER",
    };

    mockUseTicket.mockReturnValue({
      data: ownedWaitingTicket,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseTicketMessages.mockReturnValue({
      data: [
        {
          id: "m-2",
          ticket_id: ownedWaitingTicket.id,
          sender: "EMPLOYEE",
          sender_id: "user-12345678",
          message: "approved VPN client",
          created_at: "2026-11-25T09:10:00Z",
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseAnalyzeTicket.mockReturnValue({
      mutateAsync: mockAnalyzeMutateAsync,
      isPending: false,
      isError: true,
      error: new ApiError(503, "AI provider temporarily unavailable"),
    });
    mockSendMutateAsync.mockResolvedValue({
      id: "m-2",
      ticket_id: ownedWaitingTicket.id,
      sender: "EMPLOYEE",
      sender_id: "user-12345678",
      message: "approved VPN client",
      created_at: "2026-11-25T09:10:00Z",
    });
    mockAnalyzeMutateAsync
      .mockRejectedValueOnce(new ApiError(503, "AI provider temporarily unavailable"))
      .mockResolvedValueOnce({
        ticket_id: ownedWaitingTicket.id,
        decision: "SOLUTION_SUGGESTED",
        status: "SOLUTION_SUGGESTED",
        risk_level: "HIGH",
        confidence: 0.88,
        retrieval_score: 0.8,
        response: "Resolved after retry.",
        escalation_reason: null,
        decision_source: "gemini",
        fallback_reason: null,
        latency_ms: 180,
      });

    render(<TicketDetails id={ownedWaitingTicket.id} />);

    const input = screen.getByLabelText(/reply to agent clarification/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "approved VPN client" } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(mockSendMutateAsync).toHaveBeenCalledTimes(1);
      expect(mockAnalyzeMutateAsync).toHaveBeenCalledTimes(1);
      expect(input.value).toBe("");
      expect(screen.getByText("approved VPN client")).toBeInTheDocument();
      expect(screen.getByText("AI analysis failed")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /retry/i }));

    await waitFor(() => {
      expect(mockAnalyzeMutateAsync).toHaveBeenCalledTimes(2);
      expect(screen.getByText("Resolved after retry.")).toBeInTheDocument();
    });
  });

  it("shows loading feedback and disables reply controls while analysis is pending", () => {
    const ownedWaitingTicket: BackendTicket = {
      ...sampleBackendTicket,
      user_id: "user-12345678",
      status: "WAITING_FOR_USER",
    };

    mockUseTicket.mockReturnValue({
      data: ownedWaitingTicket,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseTicketMessages.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseAnalyzeTicket.mockReturnValue({
      mutateAsync: mockAnalyzeMutateAsync,
      isPending: true,
      isError: false,
      error: null,
    });

    render(<TicketDetails id={ownedWaitingTicket.id} />);

    expect(screen.getByText("TriageAgent AI is reviewing your reply...")).toBeInTheDocument();
    expect(screen.getByLabelText(/reply to agent clarification/i)).toBeDisabled();
    expect(screen.getAllByRole("button", { name: /analyzing/i })).toHaveLength(2);
  });

  it("automatically triggers AI analysis on load for an owned NEW ticket with no messages", async () => {
    const ownedNewTicket: BackendTicket = {
      ...sampleBackendTicket,
      user_id: "user-12345678",
      status: "NEW",
      final_decision: null,
    };

    mockUseTicket.mockReturnValue({
      data: ownedNewTicket,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseTicketMessages.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    mockAnalyzeMutateAsync.mockResolvedValue({
      ticket_id: ownedNewTicket.id,
      decision: "SOLUTION_SUGGESTED",
      status: "SOLUTION_SUGGESTED",
      risk_level: "HIGH",
      confidence: 0.92,
      retrieval_score: 0.88,
      response: "Root cause: expired VPN cert. Solution: renew certificate.",
      escalation_reason: null,
      decision_source: "gemini",
      fallback_reason: null,
      latency_ms: 240,
    });

    render(<TicketDetails id={ownedNewTicket.id} />);

    await waitFor(() => {
      expect(mockAnalyzeMutateAsync).toHaveBeenCalledTimes(1);
      expect(
        screen.getByText("Root cause: expired VPN cert. Solution: renew certificate."),
      ).toBeInTheDocument();
    });
  });

  it("automatically triggers AI analysis when owner clicks Send on SOLUTION_SUGGESTED ticket", async () => {
    const ownedSuggestedTicket: BackendTicket = {
      ...sampleBackendTicket,
      user_id: "user-12345678",
      status: "SOLUTION_SUGGESTED",
      final_decision: "SOLUTION_SUGGESTED",
    };

    mockUseTicket.mockReturnValue({
      data: ownedSuggestedTicket,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseTicketMessages.mockReturnValue({
      data: [
        {
          id: "m-1",
          ticket_id: ownedSuggestedTicket.id,
          sender: "AGENT",
          sender_id: null,
          message: "Try restarting GlobalProtect.",
          created_at: "2026-11-25T09:05:00Z",
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    mockSendMutateAsync.mockResolvedValue({
      id: "m-2",
      ticket_id: ownedSuggestedTicket.id,
      sender: "EMPLOYEE",
      sender_id: "user-12345678",
      message: "I restarted it but still see error 403.",
      created_at: "2026-11-25T09:10:00Z",
    });
    mockAnalyzeMutateAsync.mockResolvedValue({
      ticket_id: ownedSuggestedTicket.id,
      decision: "SOLUTION_SUGGESTED",
      status: "SOLUTION_SUGGESTED",
      risk_level: "HIGH",
      confidence: 0.9,
      retrieval_score: 0.85,
      response: "Error 403 indicates SSO token expiry. Sign out and re-authenticate.",
      escalation_reason: null,
      decision_source: "gemini",
      fallback_reason: null,
      latency_ms: 190,
    });

    render(<TicketDetails id={ownedSuggestedTicket.id} />);

    fireEvent.change(screen.getByLabelText(/reply to agent clarification/i), {
      target: { value: "I restarted it but still see error 403." },
    });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(mockSendMutateAsync).toHaveBeenCalledWith({
        message: "I restarted it but still see error 403.",
      });
      expect(mockAnalyzeMutateAsync).toHaveBeenCalledTimes(1);
      expect(
        screen.getByText("Error 403 indicates SSO token expiry. Sign out and re-authenticate."),
      ).toBeInTheDocument();
    });
  });

  it("runs initial analysis only once per NEW ticket even across component remounts", async () => {
    const ownedNewTicket: BackendTicket = {
      ...sampleBackendTicket,
      id: "new-ticket-remount-once",
      user_id: "user-12345678",
      status: "NEW",
      final_decision: null,
    };

    mockUseTicket.mockReturnValue({
      data: ownedNewTicket,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseTicketMessages.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    mockAnalyzeMutateAsync.mockResolvedValue({
      ticket_id: ownedNewTicket.id,
      decision: "SOLUTION_SUGGESTED",
      status: "SOLUTION_SUGGESTED",
      risk_level: "HIGH",
      confidence: 0.9,
      retrieval_score: 0.85,
      response: "Initial analysis complete.",
      escalation_reason: null,
      decision_source: "gemini",
      fallback_reason: null,
      latency_ms: 150,
    });

    const firstRender = render(<TicketDetails id={ownedNewTicket.id} />);
    await waitFor(() => {
      expect(mockAnalyzeMutateAsync).toHaveBeenCalledTimes(1);
    });
    firstRender.unmount();

    render(<TicketDetails id={ownedNewTicket.id} />);
    await waitFor(() => {
      expect(mockAnalyzeMutateAsync).toHaveBeenCalledTimes(1);
    });
  });

  it("disables Analyze with AI button during message submission and prevents rapid duplicate clicks", async () => {
    const ownedWaitingTicket: BackendTicket = {
      ...sampleBackendTicket,
      user_id: "user-12345678",
      status: "WAITING_FOR_USER",
    };

    mockUseTicket.mockReturnValue({
      data: ownedWaitingTicket,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseTicketMessages.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseSendTicketMessage.mockReturnValue({
      mutateAsync: mockSendMutateAsync,
      isPending: true,
      isError: false,
      error: null,
    });

    const { rerender } = render(<TicketDetails id={ownedWaitingTicket.id} />);
    expect(screen.getByRole("button", { name: /analyze with ai/i })).toBeDisabled();

    mockUseSendTicketMessage.mockReturnValue({
      mutateAsync: mockSendMutateAsync,
      isPending: false,
      isError: false,
      error: null,
    });
    let resolveAnalyze!: (value: unknown) => void;
    mockAnalyzeMutateAsync.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAnalyze = resolve;
        }),
    );

    rerender(<TicketDetails id={ownedWaitingTicket.id} />);
    const analyzeBtn = screen.getByRole("button", { name: /analyze with ai/i });
    fireEvent.click(analyzeBtn);
    fireEvent.click(analyzeBtn);

    expect(mockAnalyzeMutateAsync).toHaveBeenCalledTimes(1);
    resolveAnalyze({
      ticket_id: ownedWaitingTicket.id,
      decision: "SOLUTION_SUGGESTED",
      status: "SOLUTION_SUGGESTED",
      risk_level: "HIGH",
      confidence: 0.9,
      retrieval_score: 0.85,
      response: "Done.",
      escalation_reason: null,
      decision_source: "gemini",
      fallback_reason: null,
      latency_ms: 100,
    });
  });

  it("supports consecutive multi-turn Send -> analyze cycles on the same ticket", async () => {
    const ownedWaitingTicket: BackendTicket = {
      ...sampleBackendTicket,
      user_id: "user-12345678",
      status: "WAITING_FOR_USER",
    };

    mockUseTicket.mockReturnValue({
      data: ownedWaitingTicket,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseTicketMessages.mockReturnValue({
      data: [
        {
          id: "m-1",
          ticket_id: ownedWaitingTicket.id,
          sender: "AGENT",
          sender_id: null,
          message: "Which VPN client are you using?",
          created_at: "2026-11-25T09:05:00Z",
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    mockSendMutateAsync
      .mockResolvedValueOnce({
        id: "m-2",
        ticket_id: ownedWaitingTicket.id,
        sender: "EMPLOYEE",
        sender_id: "user-12345678",
        message: "GlobalProtect 6.1",
        created_at: "2026-11-25T09:10:00Z",
      })
      .mockResolvedValueOnce({
        id: "m-4",
        ticket_id: ownedWaitingTicket.id,
        sender: "EMPLOYEE",
        sender_id: "user-12345678",
        message: "I see error 403 after login",
        created_at: "2026-11-25T09:12:00Z",
      });
    mockAnalyzeMutateAsync
      .mockResolvedValueOnce({
        ticket_id: ownedWaitingTicket.id,
        decision: "REQUEST_MORE_INFORMATION",
        status: "WAITING_FOR_USER",
        risk_level: "HIGH",
        confidence: 0.75,
        retrieval_score: 0.6,
        response: "What error code appears in GlobalProtect 6.1?",
        escalation_reason: null,
        decision_source: "gemini",
        fallback_reason: null,
        latency_ms: 150,
      })
      .mockResolvedValueOnce({
        ticket_id: ownedWaitingTicket.id,
        decision: "SOLUTION_SUGGESTED",
        status: "SOLUTION_SUGGESTED",
        risk_level: "HIGH",
        confidence: 0.92,
        retrieval_score: 0.85,
        response: "Error 403 indicates SSO token expiry. Re-authenticate your SSO session.",
        escalation_reason: null,
        decision_source: "gemini",
        fallback_reason: null,
        latency_ms: 170,
      });

    render(<TicketDetails id={ownedWaitingTicket.id} />);

    const input = screen.getByLabelText(/reply to agent clarification/i);
    fireEvent.change(input, { target: { value: "GlobalProtect 6.1" } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(mockAnalyzeMutateAsync).toHaveBeenCalledTimes(1);
      expect(screen.getByText("What error code appears in GlobalProtect 6.1?")).toBeInTheDocument();
    });

    fireEvent.change(input, { target: { value: "I see error 403 after login" } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(mockSendMutateAsync).toHaveBeenCalledTimes(2);
      expect(mockAnalyzeMutateAsync).toHaveBeenCalledTimes(2);
      expect(
        screen.getByText("Error 403 indicates SSO token expiry. Re-authenticate your SSO session."),
      ).toBeInTheDocument();
    });
  });

  it("hides the top-level Analyze with AI button for employee active conversations while keeping it for admin/support", () => {
    const ownedActiveTicket: BackendTicket = {
      ...sampleBackendTicket,
      user_id: "user-12345678",
      status: "WAITING_FOR_USER",
    };

    mockUseTicket.mockReturnValue({
      data: ownedActiveTicket,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseTicketMessages.mockReturnValue({
      data: [
        {
          id: "m-1",
          ticket_id: ownedActiveTicket.id,
          sender: "AGENT",
          sender_id: null,
          message: "Which VPN client are you using?",
          created_at: "2026-11-25T09:05:00Z",
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    const { rerender } = render(<TicketDetails id={ownedActiveTicket.id} />);
    expect(screen.queryByRole("button", { name: /analyze with ai/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send/i })).toBeInTheDocument();

    rerender(<TicketDetails id={ownedActiveTicket.id} backTo="/admin/tickets" />);
    expect(screen.getByRole("button", { name: /analyze with ai/i })).toBeInTheDocument();
  });

  it("allows employee to confirm Issue resolved or report Still not resolved after AI response", async () => {
    const ownedSuggestedTicket: BackendTicket = {
      ...sampleBackendTicket,
      user_id: "user-12345678",
      status: "SOLUTION_SUGGESTED",
      final_decision: "SOLUTION_SUGGESTED",
    };

    mockUseTicket.mockReturnValue({
      data: ownedSuggestedTicket,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseTicketMessages.mockReturnValue({
      data: [
        {
          id: "m-1",
          ticket_id: ownedSuggestedTicket.id,
          sender: "AGENT",
          sender_id: null,
          message: "1. Reset your VPN profile. 2. Reconnect.",
          created_at: "2026-11-25T09:05:00Z",
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    mockResolveMutateAsync.mockResolvedValue({
      ticket_id: ownedSuggestedTicket.id,
      status: "RESOLVED",
      feedback_id: "fb-1",
      rating: 5,
      feedback: "Employee confirmed issue resolved.",
      created_at: "2026-11-25T09:10:00Z",
    });

    render(<TicketDetails id={ownedSuggestedTicket.id} />);

    fireEvent.click(screen.getByRole("button", { name: /issue resolved/i }));
    await waitFor(() => {
      expect(mockResolveMutateAsync).toHaveBeenCalledWith({
        rating: 5,
        feedback: "Employee confirmed issue resolved.",
      });
    });

    mockSendMutateAsync.mockResolvedValue({
      id: "m-2",
      ticket_id: ownedSuggestedTicket.id,
      sender: "EMPLOYEE",
      sender_id: "user-12345678",
      message:
        "The suggested solution did not resolve my issue. Please investigate further or escalate.",
      created_at: "2026-11-25T09:11:00Z",
    });
    mockAnalyzeMutateAsync.mockResolvedValue({
      ticket_id: ownedSuggestedTicket.id,
      decision: "ESCALATED",
      status: "ESCALATED",
      risk_level: "HIGH",
      confidence: 0.9,
      retrieval_score: 0.7,
      response: "Escalating to IT Support.",
      escalation_reason: "Troubleshooting unsuccessful",
      decision_source: "gemini",
      fallback_reason: null,
      latency_ms: 150,
    });

    fireEvent.click(screen.getByRole("button", { name: /still not resolved/i }));
    await waitFor(() => {
      expect(mockSendMutateAsync).toHaveBeenCalledTimes(1);
      expect(mockAnalyzeMutateAsync).toHaveBeenCalledTimes(1);
    });
  });

  it("hides Issue resolved and Still not resolved when no solution has been suggested", () => {
    const waitingTicket: BackendTicket = {
      ...sampleBackendTicket,
      user_id: "user-12345678",
      status: "WAITING_FOR_USER",
    };

    mockUseTicket.mockReturnValue({
      data: waitingTicket,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseTicketMessages.mockReturnValue({
      data: [
        {
          id: "m-1",
          ticket_id: waitingTicket.id,
          sender: "AGENT",
          sender_id: null,
          message: "Which OS version are you running?",
          created_at: "2026-11-25T09:05:00Z",
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<TicketDetails id={waitingTicket.id} />);
    expect(screen.queryByRole("button", { name: /issue resolved/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /still not resolved/i })).not.toBeInTheDocument();
  });

  it("allows retrying Issue resolved when the first confirmation fails", async () => {
    const ownedSuggestedTicket: BackendTicket = {
      ...sampleBackendTicket,
      user_id: "user-12345678",
      status: "SOLUTION_SUGGESTED",
    };

    mockUseTicket.mockReturnValue({
      data: ownedSuggestedTicket,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseTicketMessages.mockReturnValue({
      data: [
        {
          id: "m-1",
          ticket_id: ownedSuggestedTicket.id,
          sender: "AGENT",
          sender_id: null,
          message: "Restart VPN client.",
          created_at: "2026-11-25T09:05:00Z",
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    mockResolveMutateAsync
      .mockRejectedValueOnce(new ApiError(500, "Unable to confirm ticket resolution."))
      .mockResolvedValueOnce({
        ticket_id: ownedSuggestedTicket.id,
        status: "RESOLVED",
        feedback_id: "fb-2",
        rating: 5,
        feedback: "Employee confirmed issue resolved.",
        created_at: "2026-11-25T09:10:00Z",
      });

    render(<TicketDetails id={ownedSuggestedTicket.id} />);
    const resolveBtn = screen.getByRole("button", { name: /issue resolved/i });

    fireEvent.click(resolveBtn);
    await waitFor(() => {
      expect(mockResolveMutateAsync).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(resolveBtn);
    await waitFor(() => {
      expect(mockResolveMutateAsync).toHaveBeenCalledTimes(2);
    });
  });

  it("Still not resolved triggers exactly one AI analysis even on rapid double-click", async () => {
    const ownedSuggestedTicket: BackendTicket = {
      ...sampleBackendTicket,
      user_id: "user-12345678",
      status: "SOLUTION_SUGGESTED",
    };

    mockUseTicket.mockReturnValue({
      data: ownedSuggestedTicket,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseTicketMessages.mockReturnValue({
      data: [
        {
          id: "m-1",
          ticket_id: ownedSuggestedTicket.id,
          sender: "AGENT",
          sender_id: null,
          message: "Restart VPN client.",
          created_at: "2026-11-25T09:05:00Z",
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    mockSendMutateAsync.mockResolvedValue({
      id: "m-2",
      ticket_id: ownedSuggestedTicket.id,
      sender: "EMPLOYEE",
      sender_id: "user-12345678",
      message:
        "The suggested solution did not resolve my issue. Please investigate further or escalate.",
      created_at: "2026-11-25T09:10:00Z",
    });
    mockAnalyzeMutateAsync.mockResolvedValue({
      ticket_id: ownedSuggestedTicket.id,
      decision: "ESCALATED",
      status: "ESCALATED",
      risk_level: "HIGH",
      confidence: 0.9,
      retrieval_score: 0.7,
      response: "Escalating to IT Support.",
      escalation_reason: "Troubleshooting unsuccessful",
      decision_source: "gemini",
      fallback_reason: null,
      latency_ms: 140,
    });

    render(<TicketDetails id={ownedSuggestedTicket.id} />);
    const unresolvedBtn = screen.getByRole("button", { name: /still not resolved/i });
    fireEvent.click(unresolvedBtn);
    fireEvent.click(unresolvedBtn);

    await waitFor(() => {
      expect(mockSendMutateAsync).toHaveBeenCalledTimes(1);
      expect(mockAnalyzeMutateAsync).toHaveBeenCalledTimes(1);
    });
  });

  it("renders StaffTicketControls with agent run history and status update for admin, and hides it from employees", async () => {
    const escalatedTicket: BackendTicket = {
      ...sampleBackendTicket,
      status: "ESCALATED",
      final_decision: "ESCALATED",
    };

    mockUseTicket.mockReturnValue({
      data: escalatedTicket,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseTicketMessages.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseTicketEscalation.mockReturnValue({
      data: {
        id: "esc-1",
        ticket_id: escalatedTicket.id,
        reason: "Suspected hardware boot loop",
        assigned_team: "IT Support",
        assigned_to: null,
        assigned_to_name: null,
        status: "OPEN",
        created_at: "2026-11-26T09:00:00Z",
        updated_at: "2026-11-26T09:00:00Z",
      },
      isLoading: false,
    });
    mockUseTicketAgentRuns.mockReturnValue({
      data: [
        {
          id: "run-1",
          ticket_id: escalatedTicket.id,
          decision: "ESCALATED",
          confidence: 0.95,
          retrieval_score: 0.52,
          latency_ms: 1911,
          created_at: "2026-11-26T09:00:00Z",
        },
      ],
      isLoading: false,
    });
    mockUseStaffAssignees.mockReturnValue({
      data: [{ id: "sup-1", full_name: "Alex Support", role: "support" }],
      isLoading: false,
    });

    // Employee does not see StaffTicketControls even if backTo="/admin/tickets"
    const { rerender } = render(<TicketDetails id={escalatedTicket.id} backTo="/admin/tickets" />);
    expect(screen.queryByText("Operations & Status")).not.toBeInTheDocument();
    expect(screen.queryByText("Agent Run History")).not.toBeInTheDocument();

    // Admin sees Operations & Status, Agent Run History, and can mark resolved
    mockUseAuth.mockReturnValue({
      session: { access_token: "token" },
      user: { id: "adm-1", email: "admin@example.com", created_at: "2026-01-01T00:00:00Z" },
      role: "admin",
      fullName: "Casey Admin",
      loading: false,
      profileError: null,
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    });
    mockUpdateStatusMutateAsync.mockResolvedValue({
      ticket_id: escalatedTicket.id,
      status: "RESOLVED",
    });

    rerender(<TicketDetails id={escalatedTicket.id} backTo="/admin/tickets" />);
    expect(screen.getByText("Operations & Status")).toBeInTheDocument();
    expect(screen.getByText("Agent Run History")).toBeInTheDocument();
    expect(screen.getByText("1911 ms")).toBeInTheDocument();
    expect(screen.getByText(/Suspected hardware boot loop/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /mark resolved/i }));
    await waitFor(() => {
      expect(mockUpdateStatusMutateAsync).toHaveBeenCalledWith({ status: "RESOLVED" });
    });
  });
});
