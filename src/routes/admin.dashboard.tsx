import { createFileRoute } from "@tanstack/react-router";

import { ProtectedRoute } from "@/components/protected-route";
import { AdminDashboard } from "@/features/triage/admin-screens";
import { pageHead } from "@/features/triage/metadata";

export const Route = createFileRoute("/admin/dashboard")({
  head: () =>
    pageHead(
      "Operations dashboard",
      "Illustrative support queue metrics and ticket activity for TriageAgent.",
    ),
  component: AdminDashboardRoute,
});

function AdminDashboardRoute() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminDashboard />
    </ProtectedRoute>
  );
}
