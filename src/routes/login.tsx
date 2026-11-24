import { createFileRoute } from "@tanstack/react-router";

import { EmployeeLoginScreen } from "@/features/auth/auth-screens";
import { pageHead } from "@/features/triage/metadata";

export const Route = createFileRoute("/login")({
  head: () =>
    pageHead(
      "Employee Sign In",
      "Sign in to your employee account in TriageAgent support workspace.",
    ),
  component: EmployeeLoginScreen,
});
