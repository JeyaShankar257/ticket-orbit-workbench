import { createFileRoute } from "@tanstack/react-router";

import { ProtectedRoute } from "@/components/protected-route";
import { AgentActivity } from "@/features/triage/admin-screens";
import { pageHead } from "@/features/triage/metadata";

export const Route = createFileRoute("/admin/activity")({
  head: () =>
    pageHead(
      "Agent activity",
      "Agent metrics are available here when a live support service is connected.",
    ),
  component: AdminActivityRoute,
});

function AdminActivityRoute() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AgentActivity />
    </ProtectedRoute>
  );
}
