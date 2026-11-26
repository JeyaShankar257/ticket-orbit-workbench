import { createFileRoute } from "@tanstack/react-router";

import { AdminProfile } from "@/features/triage/admin-screens";
import { pageHead } from "@/features/triage/metadata";

export const Route = createFileRoute("/admin/profile")({
  head: () =>
    pageHead(
      "Administrator profile",
      "Sample administrator account details in the TriageAgent preview workspace.",
    ),
  component: AdminProfile,
});
