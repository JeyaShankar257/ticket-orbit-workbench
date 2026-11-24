import { createFileRoute, Link } from "@tanstack/react-router";
import { Compass } from "lucide-react";

import { Button } from "@/components/ui/button";
import { pageHead } from "@/features/triage/metadata";

export const Route = createFileRoute("/404")({
  head: () => pageHead("Page not found", "The requested page is not available in the TriageAgent preview."),
  component: NotFoundPage,
});

function NotFoundPage() {
  return <main className="grid min-h-screen place-items-center bg-background px-5"><section className="max-w-md text-center"><span className="mx-auto grid size-12 place-items-center rounded-full bg-muted text-muted-foreground"><Compass className="size-5" /></span><p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-primary">404 · Page not found</p><h1 className="mt-2 text-2xl font-semibold">That page isn’t here</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">The link may be outdated, or the page may have moved.</p><Button className="mt-6" asChild><Link to="/employee/dashboard">Back to workspace</Link></Button></section></main>;
}