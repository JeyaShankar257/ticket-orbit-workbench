import { createFileRoute } from "@tanstack/react-router";

import { TicketDetails } from "@/features/triage/employee-screens";
import { pageHead } from "@/features/triage/metadata";

export const Route = createFileRoute("/employee/tickets/$id")({
  head: () =>
    pageHead(
      "Ticket details",
      "Review a sample support ticket and its available activity in TriageAgent.",
    ),
  component: TicketDetailRoute,
});

function TicketDetailRoute() {
  const { id } = Route.useParams();
  return <TicketDetails id={id} />;
}
