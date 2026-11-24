import { createFileRoute } from "@tanstack/react-router";

import { AgentActivity } from "@/features/triage/admin-screens";
import { pageHead } from "@/features/triage/metadata";

export const Route = createFileRoute("/admin/activity")({
  head: () => pageHead("Agent activity", "Agent metrics are available here when a live support service is connected."),
  component: AgentActivity,
});