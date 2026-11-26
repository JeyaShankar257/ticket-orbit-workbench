import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";

import { ProtectedRoute } from "@/components/protected-route";
import { TriageShell } from "@/features/triage/triage-shell";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Keep public auth routes nested under /admin (e.g. /admin/login) accessible without a session
  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
    return <Outlet />;
  }

  return (
    <ProtectedRoute allowedRoles={["admin", "support"]}>
      <TriageShell audience="admin">
        <Outlet />
      </TriageShell>
    </ProtectedRoute>
  );
}
