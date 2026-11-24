import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { pageHead } from "@/features/triage/metadata";

export const Route = createFileRoute("/unauthorized")({
  head: () => pageHead("Access unavailable", "This preview page is not protected by a live sign-in service."),
  component: Unauthorized,
});

function Unauthorized() {
  return <main className="grid min-h-screen place-items-center bg-background px-5"><section className="max-w-md text-center"><span className="mx-auto grid size-12 place-items-center rounded-full bg-muted text-muted-foreground"><ShieldAlert className="size-5" /></span><h1 className="mt-5 text-2xl font-semibold">Access unavailable</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Role checks and protected access require a connected authentication service. This is a frontend preview.</p><Button className="mt-6" asChild><Link to="/employee/dashboard">Return to workspace</Link></Button></section></main>;
}