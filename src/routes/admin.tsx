import { Outlet, createFileRoute } from "@tanstack/react-router";

import { TriageShell } from "@/features/triage/triage-shell";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  return <TriageShell audience="admin"><Outlet /></TriageShell>;
}