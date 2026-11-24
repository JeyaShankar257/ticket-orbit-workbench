import { createFileRoute } from "@tanstack/react-router";

import { AdminTickets } from "@/features/triage/admin-screens";
import { pageHead } from "@/features/triage/metadata";

export const Route = createFileRoute("/admin/tickets")({
  head: () => pageHead("All tickets", "Search and filter the sample TriageAgent support queue."),
  component: AdminTickets,
});