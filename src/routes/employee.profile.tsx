import { createFileRoute } from "@tanstack/react-router";

import { EmployeeProfile } from "@/features/triage/employee-screens";
import { pageHead } from "@/features/triage/metadata";

export const Route = createFileRoute("/employee/profile")({
  head: () => pageHead("Employee profile", "Sample employee account details in the TriageAgent preview workspace."),
  component: EmployeeProfile,
});