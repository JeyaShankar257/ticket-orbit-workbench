import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getHomeRouteForRole } from "@/components/protected-route";
import {
  AdminLoginScreen,
  EmployeeLoginScreen,
  RegisterScreen,
} from "@/features/auth/auth-screens";

if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

const mockNavigate = vi.fn();
const mockRefreshProfile = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn();
const mockFrom = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />,
  useNavigate: () => mockNavigate,
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    session: null,
    user: null,
    role: null,
    fullName: null,
    loading: false,
    profileError: null,
    signOut: mockSignOut,
    refreshProfile: mockRefreshProfile,
  }),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
      signUp: (...args: unknown[]) => mockSignUp(...args),
      resetPasswordForEmail: vi.fn(),
    },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

function mockProfileQuery(result: {
  data: { role: string; full_name: string } | null;
  error: unknown;
}) {
  const maybeSingle = vi.fn().mockResolvedValue(result);
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq });
  mockFrom.mockReturnValue({ select });
}

describe("getHomeRouteForRole", () => {
  it("maps each trusted role to its expected workspace", () => {
    expect(getHomeRouteForRole("employee")).toBe("/employee/dashboard");
    expect(getHomeRouteForRole("support")).toBe("/admin/tickets");
    expect(getHomeRouteForRole("admin")).toBe("/admin/dashboard");
    expect(getHomeRouteForRole(null)).toBe("/unauthorized");
  });
});

describe("EmployeeLoginScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRefreshProfile.mockResolvedValue(undefined);
    mockSignOut.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
  });

  it("redirects employee to /employee/dashboard on valid login", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "emp-1", email: "emp@example.com" } },
      error: null,
    });
    mockProfileQuery({
      data: { role: "employee", full_name: "Morgan Lee" },
      error: null,
    });

    render(<EmployeeLoginScreen />);

    fireEvent.change(screen.getByLabelText("Work Email"), {
      target: { value: "emp@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "Password123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: "emp@example.com",
        password: "Password123!",
      });
      expect(mockRefreshProfile).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith({ to: "/employee/dashboard" });
    });
  });

  it("redirects support user to /admin/tickets when signing in via /login", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "sup-1", email: "support@example.com" } },
      error: null,
    });
    mockProfileQuery({
      data: { role: "support", full_name: "Sam Support" },
      error: null,
    });

    render(<EmployeeLoginScreen />);

    fireEvent.change(screen.getByLabelText("Work Email"), {
      target: { value: "support@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "Password123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: "/admin/tickets" });
    });
  });

  it("displays error and does not navigate on invalid credentials", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid login credentials" },
    });

    render(<EmployeeLoginScreen />);

    fireEvent.change(screen.getByLabelText("Work Email"), {
      target: { value: "wrong@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "badpass" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Invalid login credentials");
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("signs out and shows error when profile row is missing", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "no-prof", email: "noprof@example.com" } },
      error: null,
    });
    mockProfileQuery({
      data: null,
      error: null,
    });

    render(<EmployeeLoginScreen />);

    fireEvent.change(screen.getByLabelText("Work Email"), {
      target: { value: "noprof@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "Password123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(screen.getByRole("alert")).toHaveTextContent("User profile not found.");
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

describe("AdminLoginScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRefreshProfile.mockResolvedValue(undefined);
    mockSignOut.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
  });

  it("allows admin user and redirects to /admin/dashboard", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "adm-1", email: "admin@example.com" } },
      error: null,
    });
    mockProfileQuery({
      data: { role: "admin", full_name: "Casey Morgan" },
      error: null,
    });

    render(<AdminLoginScreen />);

    fireEvent.change(screen.getByLabelText("Administrator Email"), {
      target: { value: "admin@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Administrative Password"), {
      target: { value: "AdminPass123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /enter operations center/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: "/admin/dashboard" });
    });
  });

  it("blocks employee role from /admin/login and signs out", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "emp-1", email: "emp@example.com" } },
      error: null,
    });
    mockProfileQuery({
      data: { role: "employee", full_name: "Morgan Lee" },
      error: null,
    });

    render(<AdminLoginScreen />);

    fireEvent.change(screen.getByLabelText("Administrator Email"), {
      target: { value: "emp@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Administrative Password"), {
      target: { value: "Password123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /enter operations center/i }));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(screen.getByRole("alert")).toHaveTextContent(/insufficient permissions/i);
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

describe("RegisterScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRefreshProfile.mockResolvedValue(undefined);
    mockSignOut.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
  });

  function fillRegistrationForm() {
    fireEvent.change(screen.getByLabelText("Full Name"), {
      target: { value: "Alex Rivera" },
    });
    fireEvent.change(screen.getByLabelText("Work Email Address"), {
      target: { value: "alex.rivera@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "OrbitSecure#2026" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "OrbitSecure#2026" },
    });
  }

  it("handles email confirmation required (no session) without inserting into profiles", async () => {
    mockSignUp.mockResolvedValue({
      data: { user: { id: "new-1", email: "alex.rivera@example.com" }, session: null },
      error: null,
    });

    render(<RegisterScreen />);
    fillRegistrationForm();
    fireEvent.click(screen.getByRole("button", { name: /complete registration/i }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: "alex.rivera@example.com",
        password: "OrbitSecure#2026",
        options: {
          data: {
            full_name: "Alex Rivera",
            department: "Engineering",
          },
        },
      });
      expect(mockFrom).not.toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith({ to: "/login" });
    });
  });

  it("creates employee profile without unsupported email column when session is active and no trigger row exists", async () => {
    mockSignUp.mockResolvedValue({
      data: {
        user: { id: "new-2", email: "alex.rivera@example.com" },
        session: { access_token: "token" },
      },
      error: null,
    });

    const insertMock = vi.fn().mockResolvedValue({ error: null });
    const maybeSingle = vi
      .fn()
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: { role: "employee", full_name: "Alex Rivera" }, error: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    mockFrom.mockReturnValue({ select, insert: insertMock });

    render(<RegisterScreen />);
    fillRegistrationForm();
    fireEvent.click(screen.getByRole("button", { name: /complete registration/i }));

    await waitFor(() => {
      expect(insertMock).toHaveBeenCalledWith({
        id: "new-2",
        full_name: "Alex Rivera",
        role: "employee",
      });
      expect(mockRefreshProfile).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith({ to: "/employee/dashboard" });
    });
  });

  it("skips profile insert when database trigger already created the profile", async () => {
    mockSignUp.mockResolvedValue({
      data: {
        user: { id: "new-3", email: "alex.rivera@example.com" },
        session: { access_token: "token" },
      },
      error: null,
    });

    const insertMock = vi.fn();
    const maybeSingle = vi
      .fn()
      .mockResolvedValue({ data: { role: "employee", full_name: "Alex Rivera" }, error: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    mockFrom.mockReturnValue({ select, insert: insertMock });

    render(<RegisterScreen />);
    fillRegistrationForm();
    fireEvent.click(screen.getByRole("button", { name: /complete registration/i }));

    await waitFor(() => {
      expect(insertMock).not.toHaveBeenCalled();
      expect(mockRefreshProfile).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith({ to: "/employee/dashboard" });
    });
  });

  it("signs out and shows error clearly when profile creation fails", async () => {
    mockSignUp.mockResolvedValue({
      data: {
        user: { id: "new-4", email: "alex.rivera@example.com" },
        session: { access_token: "token" },
      },
      error: null,
    });

    const insertMock = vi.fn().mockResolvedValue({ error: { message: "RLS violation" } });
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    mockFrom.mockReturnValue({ select, insert: insertMock });

    render(<RegisterScreen />);
    fillRegistrationForm();
    fireEvent.click(screen.getByRole("button", { name: /complete registration/i }));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(screen.getByRole("alert")).toHaveTextContent(/profile setup failed/i);
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("signs out and shows error clearly when profile lookup returns a database error", async () => {
    mockSignUp.mockResolvedValue({
      data: {
        user: { id: "new-5", email: "alex.rivera@example.com" },
        session: { access_token: "token" },
      },
      error: null,
    });

    const insertMock = vi.fn();
    const maybeSingle = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: "DB connection error" } });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    mockFrom.mockReturnValue({ select, insert: insertMock });

    render(<RegisterScreen />);
    fillRegistrationForm();
    fireEvent.click(screen.getByRole("button", { name: /complete registration/i }));

    await waitFor(() => {
      expect(insertMock).not.toHaveBeenCalled();
      expect(mockSignOut).toHaveBeenCalled();
      expect(screen.getByRole("alert")).toHaveTextContent("Unable to verify user profile.");
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
