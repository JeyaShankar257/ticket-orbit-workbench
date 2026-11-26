import { Outlet, createFileRoute } from "@tanstack/react-router";

import { ProtectedRoute } from "@/components/protected-route";
import { TriageShell } from "@/features/triage/triage-shell";

export const Route = createFileRoute("/employee")({
  component: EmployeeLayout,
});

function EmployeeLayout() {
  return (
    <ProtectedRoute allowedRoles={["employee"]}>
      <TriageShell audience="employee">
        <Outlet />
      </TriageShell>
    </ProtectedRoute>
  );
}
