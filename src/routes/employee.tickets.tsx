import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/employee/tickets")({
  component: () => <Outlet />,
});