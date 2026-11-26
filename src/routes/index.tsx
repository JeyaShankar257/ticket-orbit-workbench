import { createFileRoute, Navigate } from "@tanstack/react-router";

import { pageHead } from "@/features/triage/metadata";

export const Route = createFileRoute("/")({
  head: () =>
    pageHead(
      "Support workspace",
      "TriageAgent is a clear support workspace preview for employee requests and IT operations.",
    ),
  component: () => <Navigate to="/employee/dashboard" />,
});
