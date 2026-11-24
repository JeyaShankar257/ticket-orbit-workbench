import { createFileRoute } from "@tanstack/react-router";

import { RegisterScreen } from "@/features/auth/auth-screens";
import { pageHead } from "@/features/triage/metadata";

export const Route = createFileRoute("/register")({
  head: () =>
    pageHead(
      "Employee Registration",
      "Create your employee account for the TriageAgent support workspace.",
    ),
  component: RegisterScreen,
});
