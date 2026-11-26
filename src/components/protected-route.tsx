import { Navigate } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { useAuth } from "@/hooks/use-auth";
import type { UserRole } from "@/lib/auth-context";

/**
 * Resolve the default landing route for a trusted user role.
 */
export function getHomeRouteForRole(role: UserRole | null): string {
  switch (role) {
    case "employee":
      return "/employee/dashboard";
    case "support":
      return "/admin/tickets";
    case "admin":
      return "/admin/dashboard";
    default:
      return "/unauthorized";
  }
}

/**
 * Client-side route guard compatible with TanStack Start SSR.
 * Renders a loading state during SSR and initial hydration so no premature
 * redirects occur before browser session state is resolved.
 */
export function ProtectedRoute({
  allowedRoles,
  children,
  redirectTo = "/login",
}: {
  allowedRoles: readonly UserRole[];
  children: ReactNode;
  redirectTo?: string;
}) {
  const { session, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to={redirectTo} replace />;
  }

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
