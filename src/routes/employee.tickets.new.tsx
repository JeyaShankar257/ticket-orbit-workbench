import { createFileRoute } from "@tanstack/react-router";

import { NewTicket } from "@/features/triage/employee-screens";
import { pageHead } from "@/features/triage/metadata";

export const Route = createFileRoute("/employee/tickets/new")({
  head: () => pageHead("Create a ticket", "Preview the structured support ticket form for TriageAgent."),
  component: NewTicket,
});