import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  Bell,
  ChevronDown,
  Command,
  LayoutDashboard,
  Menu,
  Plus,
  Ticket,
  UserRound,
  LogOut,
  X,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { getInitials } from "./mappers";

type Audience = "employee" | "admin";
type NavPath =
  | "/employee/dashboard"
  | "/employee/tickets"
  | "/employee/tickets/new"
  | "/employee/profile"
  | "/admin/dashboard"
  | "/admin/tickets"
  | "/admin/escalations"
  | "/admin/activity"
  | "/admin/profile";
type NavItem = { label: string; to: NavPath; icon: LucideIcon; section?: string };

const employeeNav: NavItem[] = [
  { label: "Overview", to: "/employee/dashboard", icon: LayoutDashboard, section: "Workspace" },
  { label: "My tickets", to: "/employee/tickets", icon: Ticket },
  { label: "New request", to: "/employee/tickets/new", icon: Plus },
  { label: "My profile", to: "/employee/profile", icon: UserRound, section: "Account" },
];

const adminNav: NavItem[] = [
  { label: "Overview", to: "/admin/dashboard", icon: LayoutDashboard, section: "Operations" },
  { label: "All tickets", to: "/admin/tickets", icon: Ticket },
  { label: "Escalations", to: "/admin/escalations", icon: AlertTriangle },
  { label: "Agent activity", to: "/admin/activity", icon: Activity },
  { label: "My profile", to: "/admin/profile", icon: UserRound, section: "Account" },
];

const supportNav: NavItem[] = [
  { label: "All tickets", to: "/admin/tickets", icon: Ticket, section: "Support" },
  { label: "Escalations", to: "/admin/escalations", icon: AlertTriangle },
  { label: "My profile", to: "/admin/profile", icon: UserRound, section: "Account" },
];

export function TriageShell({ audience, children }: { audience: Audience; children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const { user, fullName, role, signOut } = useAuth();

  const isAdminAudience = audience === "admin";
  const isSupportRole = isAdminAudience && role === "support";
  const navItems = !isAdminAudience ? employeeNav : isSupportRole ? supportNav : adminNav;
  const homePath: NavPath = !isAdminAudience
    ? "/employee/dashboard"
    : isSupportRole
      ? "/admin/tickets"
      : "/admin/dashboard";
  const profilePath: NavPath = isAdminAudience ? "/admin/profile" : "/employee/profile";
  const displayName = fullName ?? user?.email ?? (isAdminAudience ? "Operator" : "Employee");
  const initials = getInitials(displayName);
  const roleLabel =
    role === "admin" ? "IT administrator" : role === "support" ? "IT support" : "Employee";
  const sectionHeader = !isAdminAudience ? "Workspace" : isSupportRole ? "Support" : "Operations";

  const handleSignOut = async () => {
    await signOut();
    await navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground md:flex">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[258px] flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200 md:sticky md:top-0 md:h-screen md:translate-x-0",
          collapsed && "md:w-[76px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div
          className={cn(
            "flex h-[76px] items-center justify-between border-b border-sidebar-border px-5",
            collapsed && "md:justify-center md:px-0",
          )}
        >
          <Link
            to={homePath}
            className="flex min-w-0 items-center gap-3"
            onClick={() => setMobileOpen(false)}
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
              <Command className="size-[18px]" aria-hidden="true" />
            </span>
            {!collapsed ? (
              <span className="min-w-0">
                <span className="block truncate text-[15px] font-semibold leading-5">
                  triageagent
                </span>
                <span className="block text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  Support workspace
                </span>
              </span>
            ) : null}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          >
            <X />
          </Button>
        </div>

        <div className={cn("px-3 pt-6", collapsed && "md:px-2")}>
          {!collapsed ? (
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
              {sectionHeader}
            </p>
          ) : null}
          <nav aria-label="Main navigation" className="space-y-1">
            {navItems.map((item) => {
              const active =
                pathname === item.to ||
                (item.to === "/employee/tickets" && pathname.startsWith("/employee/tickets")) ||
                (item.to === "/admin/tickets" && pathname.startsWith("/admin/ticket/"));
              return (
                <div key={item.to}>
                  {item.section && item.section !== sectionHeader ? (
                    !collapsed ? (
                      <p className="mb-2 mt-6 px-3 text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
                        {item.section}
                      </p>
                    ) : null
                  ) : null}
                  <Link
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                      collapsed && "md:justify-center md:px-0",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground",
                    )}
                  >
                    <item.icon className="size-[17px] shrink-0" aria-hidden="true" />
                    {!collapsed ? <span className="truncate">{item.label}</span> : null}
                    {active && !collapsed ? (
                      <span
                        className="ml-auto size-1.5 rounded-full bg-primary"
                        aria-hidden="true"
                      />
                    ) : null}
                  </Link>
                </div>
              );
            })}
          </nav>
        </div>

        <div className={cn("mt-auto border-t border-sidebar-border p-3", collapsed && "md:px-2")}>
          {!collapsed ? (
            <div className="mb-3 px-2.5 py-2">
              <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-foreground">
                <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
                Live workspace
              </div>
              <p className="text-xs leading-5 text-muted-foreground">
                Connected to TriageAgent API with Supabase authentication.
              </p>
            </div>
          ) : null}
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "sm"}
            className={cn(
              "mt-1.5 w-full text-muted-foreground hover:text-foreground",
              collapsed && "md:mx-auto",
            )}
            onClick={() => void handleSignOut()}
            title="Sign out"
          >
            <LogOut className="size-4" />
            {!collapsed ? <span>Sign out</span> : null}
          </Button>
        </div>
      </aside>

      {mobileOpen ? (
        <button
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-30 bg-foreground/30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2.5">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
            >
              <Menu />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:inline-flex"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={() => setCollapsed((current) => !current)}
            >
              <Menu />
            </Button>
            <span className="hidden h-5 w-px bg-border sm:block" />
            <span className="truncate text-sm font-medium text-muted-foreground">
              {!isAdminAudience
                ? "Employee workspace"
                : isSupportRole
                  ? "Support workspace"
                  : "Operations center"}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <span className="hidden items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary sm:inline-flex">
              <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
              Live
            </span>
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Notifications"
                title="Notifications"
                onClick={() => setNotificationsOpen((current) => !current)}
              >
                <Bell />
              </Button>
              {notificationsOpen ? (
                <div className="absolute right-0 top-12 z-50 w-[min(300px,calc(100vw-2rem))] rounded-md border border-border bg-popover p-4 shadow-lg">
                  <p className="text-sm font-semibold">All caught up</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    No new notifications.
                  </p>
                </div>
              ) : null}
            </div>
            <span className="hidden h-6 w-px bg-border sm:block" />
            <Link
              to={profilePath}
              className="flex items-center gap-2.5 rounded-md py-1 pl-1 pr-0.5 hover:bg-muted sm:pr-2"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                {initials}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-xs font-semibold leading-4">{displayName}</span>
                <span className="block text-[10px] leading-4 text-muted-foreground">
                  {roleLabel}
                </span>
              </span>
              <ChevronDown
                className="hidden size-3.5 text-muted-foreground sm:block"
                aria-hidden="true"
              />
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8 lg:px-9 lg:py-9">
          {children}
          <footer className="mt-12 border-t border-border pt-4 text-center text-[11px] text-muted-foreground">
            TriageAgent · Support &amp; Operations Workbench
          </footer>
        </main>
      </div>
    </div>
  );
}
