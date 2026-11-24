import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { pageHead } from "@/features/triage/metadata";

export const Route = createFileRoute("/unauthorized")({
  head: () =>
    pageHead("Access unavailable", "This preview page is not protected by a live sign-in service."),
  component: Unauthorized,
});

function Unauthorized() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-5">
      <section className="max-w-md text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
          <ShieldAlert className="size-5" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold">Access unavailable</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          This area requires verified authentication credentials. Please sign in or register to
          continue.
        </p>
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link to="/login">Employee Sign In</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/admin/login">Admin Console</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/register">Register</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
