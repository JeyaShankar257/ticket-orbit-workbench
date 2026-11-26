import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProtectedRoute } from "@/components/protected-route";
import { AuthProvider } from "@/lib/auth-context";

type AuthCallback = (event: string, session: unknown) => void;

let authCallback: AuthCallback | null = null;
const mockGetSession = vi.fn();
const mockFetchTrustedProfile = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />,
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: (cb: AuthCallback) => {
        authCallback = cb;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
      signOut: vi.fn().mockResolvedValue(undefined),
    },
  },
}));

vi.mock("@/lib/auth-helpers", () => ({
  fetchTrustedProfile: (...args: unknown[]) => mockFetchTrustedProfile(...args),
}));

function StatefulWorkspaceChild() {
  const [draft, setDraft] = useState("unsaved-draft");
  return (
    <div>
      <span data-testid="workspace-mounted">{draft}</span>
      <button type="button" onClick={() => setDraft("edited-draft")}>
        Edit
      </button>
    </div>
  );
}

describe("AuthProvider and ProtectedRoute stability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authCallback = null;
  });

  afterEach(() => {
    cleanup();
  });

  it("keeps workspace mounted without loading flash on TOKEN_REFRESHED and repeated SIGNED_IN", async () => {
    const initialSession = {
      access_token: "token-1",
      user: { id: "emp-1", email: "emp@example.com" },
    };

    mockGetSession.mockResolvedValue({ data: { session: initialSession } });
    mockFetchTrustedProfile.mockResolvedValue({
      role: "employee",
      fullName: "Morgan Lee",
      error: null,
    });

    render(
      <AuthProvider>
        <ProtectedRoute allowedRoles={["employee"]}>
          <StatefulWorkspaceChild />
        </ProtectedRoute>
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("workspace-mounted")).toHaveTextContent("unsaved-draft");
    });

    // Mutate local state inside the protected workspace
    act(() => {
      screen.getByRole("button", { name: "Edit" }).click();
    });
    expect(screen.getByTestId("workspace-mounted")).toHaveTextContent("edited-draft");

    // Simulate browser tab focus triggering TOKEN_REFRESHED for the same user
    act(() => {
      authCallback?.("TOKEN_REFRESHED", {
        access_token: "token-2",
        user: { id: "emp-1", email: "emp@example.com" },
      });
    });

    expect(screen.queryByText("Verifying session...")).not.toBeInTheDocument();
    expect(screen.getByTestId("workspace-mounted")).toHaveTextContent("edited-draft");

    // Simulate repeated SIGNED_IN for the same user
    act(() => {
      authCallback?.("SIGNED_IN", {
        access_token: "token-3",
        user: { id: "emp-1", email: "emp@example.com" },
      });
    });

    expect(screen.queryByText("Verifying session...")).not.toBeInTheDocument();
    expect(screen.getByTestId("workspace-mounted")).toHaveTextContent("edited-draft");
  });

  it("redirects to /login when SIGNED_OUT fires", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: "token-1", user: { id: "emp-1" } } },
    });
    mockFetchTrustedProfile.mockResolvedValue({
      role: "employee",
      fullName: "Morgan Lee",
      error: null,
    });

    render(
      <AuthProvider>
        <ProtectedRoute allowedRoles={["employee"]}>
          <StatefulWorkspaceChild />
        </ProtectedRoute>
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("workspace-mounted")).toBeInTheDocument();
    });

    act(() => {
      authCallback?.("SIGNED_OUT", null);
    });

    await waitFor(() => {
      expect(screen.getByTestId("navigate")).toHaveAttribute("data-to", "/login");
    });
  });
});
