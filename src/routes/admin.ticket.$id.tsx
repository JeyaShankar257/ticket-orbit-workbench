import { createFileRoute } from "@tanstack/react-router";

import { TicketDetails } from "@/features/triage/employee-screens";
import { pageHead } from "@/features/triage/metadata";

export const Route = createFileRoute("/admin/ticket/$id")({
  head: () =>
    pageHead("Ticket details", "Inspect ticket conversation and AI triage in TriageAgent."),
  component: AdminTicketDetailRoute,
});

function AdminTicketDetailRoute() {
  const { id } = Route.useParams();
  return <TicketDetails id={id} backTo="/admin/tickets" />;
}
