import { Outlet, createFileRoute } from "@tanstack/react-router";

import { TriageShell } from "@/features/triage/triage-shell";

export const Route = createFileRoute("/employee")({
  component: EmployeeLayout,
});

function EmployeeLayout() {
  return <TriageShell audience="employee"><Outlet /></TriageShell>;
}