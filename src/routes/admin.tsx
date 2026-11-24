import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";

import { TriageShell } from "@/features/triage/triage-shell";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // For administrative login, present the dedicated unnested auth barrier
  if (pathname === "/admin/login") {
    return <Outlet />;
  }

  return (
    <TriageShell audience="admin">
      <Outlet />
    </TriageShell>
  );
}
