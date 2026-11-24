import { createFileRoute } from "@tanstack/react-router";

import { AdminDashboard } from "@/features/triage/admin-screens";
import { pageHead } from "@/features/triage/metadata";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => pageHead("Operations dashboard", "Illustrative support queue metrics and ticket activity for TriageAgent."),
  component: AdminDashboard,
});