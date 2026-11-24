import { createFileRoute } from "@tanstack/react-router";

import { EmployeeTickets } from "@/features/triage/employee-screens";
import { pageHead } from "@/features/triage/metadata";

export const Route = createFileRoute("/employee/tickets/")({
  head: () => pageHead("My tickets", "Review and filter sample support tickets in the TriageAgent employee workspace."),
  component: EmployeeTickets,
});