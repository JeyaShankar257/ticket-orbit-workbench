import { createFileRoute } from "@tanstack/react-router";

import { Escalations } from "@/features/triage/admin-screens";
import { pageHead } from "@/features/triage/metadata";

export const Route = createFileRoute("/admin/escalations")({
  head: () =>
    pageHead(
      "Escalations",
      "Review illustrative escalated support requests in the TriageAgent operations workspace.",
    ),
  component: Escalations,
});
