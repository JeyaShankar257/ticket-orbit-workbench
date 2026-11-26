import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProtectedRoute } from "@/components/protected-route";
import { AdminTickets, AgentActivity, Escalations } from "@/features/triage/admin-screens";
import { TriageShell } from "@/features/triage/triage-shell";
import { ApiError } from "@/lib/api/client";
import type { BackendTicket } from "@/lib/api/types";

const mockNavigate = vi.fn();
const mockSignOut = vi.fn();
const mockUseTickets = vi.fn();
const mockUseEscalations = vi.fn();
const mockUseStaffAssignees = vi.fn();
const mockAssignMutateAsync = vi.fn();
const mockUseAuth = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />,
  useNavigate: () => mockNavigate,
  useRouterState: () => "/admin/tickets",
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/lib/api", () => ({
  useTickets: () => mockUseTickets(),
  useEscalations: () => mockUseEscalations(),
  useStaffAssignees: () => mockUseStaffAssignees(),
  useAssignEscalation: () => ({
    mutateAsync: mockAssignMutateAsync,
    isPending: false,
  }),
}));

const sampleTickets: BackendTicket[] = [
  {
    id: "ticket-open-1",
    user_id: "11111111-1111-1111-1111-111111111111",
    title: "Printer offline on 3rd floor",
    description: "Network printer not responding",
    category: "Hardware",
    reported_priority: "Medium",
    status: "NEW",
    risk_level: "MEDIUM",
    final_decision: null,
    created_at: "2026-11-25T08:00:00Z",
    updated_at: "2026-11-25T08:10:00Z",
  },
  {
    id: "ticket-esc-1",
    user_id: "22222222-2222-2222-2222-222222222222",
    title: "Unauthorized Okta login alert",
    description: "Suspicious login from unknown IP",
    category: "Account/Access",
    reported_priority: "Critical",
    status: "ESCALATED",
    risk_level: "CRITICAL",
    final_decision: "ESCALATED",
    created_at: "2026-11-25T09:00:00Z",
    updated_at: "2026-11-25T09:05:00Z",
  },
];

describe("Admin and Support workflows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignOut.mockResolvedValue(undefined);
    mockUseStaffAssignees.mockReturnValue({
      data: [{ id: "tech-1", full_name: "Alex Support", role: "support" }],
      isLoading: false,
    });
    mockUseAuth.mockReturnValue({
      session: { access_token: "token" },
      user: { id: "sup-1", email: "support@example.com" },
      role: "support",
      fullName: "Sam Support",
      loading: false,
      profileError: null,
      signOut: mockSignOut,
      refreshProfile: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("AdminTickets renders live tickets and shows error without demo fallback", () => {
    const refetch = vi.fn();
    mockUseTickets.mockReturnValueOnce({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new ApiError(500, "Support queue error"),
      refetch,
    });

    render(<AdminTickets />);
    expect(screen.getByRole("alert")).toHaveTextContent("Support queue error");
    expect(screen.queryByText("TA-2841")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(refetch).toHaveBeenCalled();

    cleanup();

    mockUseTickets.mockReturnValueOnce({
      data: sampleTickets,
      isLoading: false,
      isError: false,
      error: null,
      refetch,
    });

    render(<AdminTickets />);
    expect(screen.getByText("Printer offline on 3rd floor")).toBeInTheDocument();
    expect(screen.getByText("Unauthorized Okta login alert")).toBeInTheDocument();
  });

  it("Escalations renders live escalation records with reason, technician, and status", () => {
    mockUseEscalations.mockReturnValue({
      data: [
        {
          id: "esc-1",
          ticket_id: "ticket-esc-1",
          reason: "Suspicious login from unknown IP",
          assigned_team: "IT Support",
          assigned_to: "tech-1",
          assigned_to_name: "Alex Support",
          status: "IN_PROGRESS",
          created_at: "2026-11-25T09:00:00Z",
          updated_at: "2026-11-25T09:05:00Z",
          ticket_title: "Unauthorized Okta login alert",
          ticket_description: "Suspicious login from unknown IP",
          ticket_category: "Account/Access",
          ticket_priority: "Critical",
          ticket_risk_level: "CRITICAL",
          ticket_status: "ESCALATED",
          employee_id: "22222222-2222-2222-2222-222222222222",
          employee_name: "Taylor Employee",
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<Escalations />);

    expect(screen.getByText("Unauthorized Okta login alert")).toBeInTheDocument();
    expect(screen.getByText(/Alex Support/)).toBeInTheDocument();
    expect(screen.getByText(/Taylor Employee/)).toBeInTheDocument();
    expect(screen.queryByText("Printer offline on 3rd floor")).not.toBeInTheDocument();
    // Support role does not see admin-only assignment button
    expect(screen.queryByRole("button", { name: /^assign$/i })).not.toBeInTheDocument();
  });

  it("Escalations shows loading, error retry, and allows admin to assign a technician", async () => {
    mockUseAuth.mockReturnValue({
      session: { access_token: "token" },
      user: { id: "adm-1", email: "admin@example.com" },
      role: "admin",
      fullName: "Casey Morgan",
      loading: false,
      profileError: null,
      signOut: mockSignOut,
      refreshProfile: vi.fn(),
    });

    const refetch = vi.fn();
    mockUseEscalations.mockReturnValueOnce({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new ApiError(500, "Escalations service unavailable"),
      refetch,
    });

    const { rerender } = render(<Escalations />);
    expect(screen.getByRole("alert")).toHaveTextContent("Escalations service unavailable");
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(refetch).toHaveBeenCalled();

    mockUseEscalations.mockReturnValue({
      data: [
        {
          id: "esc-1",
          ticket_id: "ticket-esc-1",
          reason: "Hardware boot loop",
          assigned_team: "IT Support",
          assigned_to: "tech-1",
          assigned_to_name: "Alex Support",
          status: "OPEN",
          created_at: "2026-11-25T09:00:00Z",
          updated_at: "2026-11-25T09:05:00Z",
          ticket_title: "Laptop boot loop",
          ticket_description: "Restarts continuously",
          ticket_category: "Hardware",
          ticket_priority: "High",
          ticket_risk_level: "HIGH",
          ticket_status: "ESCALATED",
          employee_id: "22222222-2222-2222-2222-222222222222",
          employee_name: "Taylor Employee",
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
      refetch,
    });
    mockAssignMutateAsync.mockResolvedValue({});

    rerender(<Escalations />);
    fireEvent.click(screen.getByRole("button", { name: /^assign$/i }));
    expect(mockAssignMutateAsync).toHaveBeenCalledWith({
      escalationId: "esc-1",
      ticketId: "ticket-esc-1",
      payload: { assigned_to: "tech-1" },
    });
  });

  it("AgentActivity clearly labels demo data as preview only", () => {
    render(<AgentActivity />);
    expect(screen.getByText(/preview only/i)).toBeInTheDocument();
  });

  it("TriageShell hides admin-only links from support users", () => {
    render(
      <TriageShell audience="admin">
        <div>Content</div>
      </TriageShell>,
    );

    expect(screen.getByText("All tickets")).toBeInTheDocument();
    expect(screen.getByText("Escalations")).toBeInTheDocument();
    expect(screen.queryByText("Overview")).not.toBeInTheDocument();
    expect(screen.queryByText("Agent activity")).not.toBeInTheDocument();
  });

  it("TriageShell shows all operations links for admin users", () => {
    mockUseAuth.mockReturnValue({
      session: { access_token: "token" },
      user: { id: "adm-1", email: "admin@example.com" },
      role: "admin",
      fullName: "Casey Morgan",
      loading: false,
      profileError: null,
      signOut: mockSignOut,
      refreshProfile: vi.fn(),
    });

    render(
      <TriageShell audience="admin">
        <div>Content</div>
      </TriageShell>,
    );

    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Agent activity")).toBeInTheDocument();
    expect(screen.getByText("All tickets")).toBeInTheDocument();
  });

  it("ProtectedRoute enforces admin-only vs support+admin vs employee access", () => {
    // support cannot access admin-only routes
    const { rerender } = render(
      <ProtectedRoute allowedRoles={["admin"]}>
        <div>Admin Only</div>
      </ProtectedRoute>,
    );
    expect(screen.getByTestId("navigate")).toHaveAttribute("data-to", "/unauthorized");

    // support can access support+admin routes
    rerender(
      <ProtectedRoute allowedRoles={["admin", "support"]}>
        <div>Shared Queue</div>
      </ProtectedRoute>,
    );
    expect(screen.getByText("Shared Queue")).toBeInTheDocument();

    // employee cannot access support+admin routes
    mockUseAuth.mockReturnValue({
      session: { access_token: "token" },
      user: { id: "emp-1", email: "emp@example.com" },
      role: "employee",
      fullName: "Morgan Lee",
      loading: false,
      profileError: null,
      signOut: mockSignOut,
      refreshProfile: vi.fn(),
    });
    rerender(
      <ProtectedRoute allowedRoles={["admin", "support"]}>
        <div>Shared Queue</div>
      </ProtectedRoute>,
    );
    expect(screen.getByTestId("navigate")).toHaveAttribute("data-to", "/unauthorized");
  });
});
