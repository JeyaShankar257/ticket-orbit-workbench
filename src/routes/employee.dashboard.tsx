import { createFileRoute } from "@tanstack/react-router";

import { EmployeeDashboard } from "@/features/triage/employee-screens";
import { pageHead } from "@/features/triage/metadata";

export const Route = createFileRoute("/employee/dashboard")({
  head: () =>
    pageHead(
      "Employee dashboard",
      "A sample overview of support requests and updates in the TriageAgent employee workspace.",
    ),
  component: EmployeeDashboard,
});
