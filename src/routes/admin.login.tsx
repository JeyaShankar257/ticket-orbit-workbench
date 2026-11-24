import { createFileRoute } from "@tanstack/react-router";

import { AdminLoginScreen } from "@/features/auth/auth-screens";
import { pageHead } from "@/features/triage/metadata";

export const Route = createFileRoute("/admin/login")({
  head: () =>
    pageHead(
      "Operations Sign In",
      "Restricted administrative sign-in for IT operations and security.",
    ),
  component: AdminLoginScreen,
});
