import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  Flag,
  Gauge,
  ListTodo,
  LogOut,
  NotebookPen,
  Repeat,
  Search,
  Settings as SettingsIcon,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { OfflineBanner } from "@/components/lifeos/states";
import { CommandPalette, useCommandPalette } from "@/components/lifeos/command-palette";
import { sessionQuery, useSignOut } from "@/lib/queries";
import { useOnline } from "@/hooks/use-online";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Today", icon: ListTodo },
  { to: "/habits", label: "Habits", icon: Repeat },
  { to: "/dashboard", label: "Insights", icon: Gauge },
  { to: "/review", label: "Review", icon: NotebookPen },
  { to: "/goals", label: "Goals", icon: Flag },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

const MOBILE_NAV = NAV.filter((n) =>
  ["/", "/habits", "/dashboard", "/review", "/settings"].includes(n.to),
);

export function AppShell({
  children,
  title,
  subtitle,
  actions,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  const { open, setOpen } = useCommandPalette();
  const online = useOnline();
  const session = useQuery(sessionQuery);
  const signOut = useSignOut();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const profile = session.data?.status === "signed-in" ? session.data.profile : undefined;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <CommandPalette open={open} onOpenChange={setOpen} />

      <div className="mx-auto flex w-full max-w-[1400px]">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border px-4 py-6 lg:flex">
          <Link to="/" className="mb-8 block px-2">
            <span className="font-display text-lg tracking-tight">LifeOS</span>
            <span className="mt-0.5 block text-[11px] tracking-widest text-muted-foreground uppercase">
              {format(new Date(), "EEEE d MMMM")}
            </span>
          </Link>

          <nav aria-label="Primary" className="flex flex-1 flex-col gap-0.5">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                    active
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="truncate">{label}</span>
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-6 flex items-center gap-2 rounded-md border border-border px-2.5 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <Search className="size-3.5" />
            <span className="flex-1 text-left">Search</span>
            <kbd className="num rounded border border-border px-1 py-0.5 text-[10px]">⌘K</kbd>
          </button>

          {profile ? (
            <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-t border-border pt-4">
              <div className="min-w-0">
                <p className="truncate text-xs text-foreground">{profile.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">{profile.email}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Sign out"
                onClick={() => signOut.mutate()}
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          ) : null}
        </aside>

        {/* Main column */}
        <div className="min-w-0 flex-1 pb-20 lg:pb-0">
          <OfflineBanner online={online} />

          <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
              <div className="min-w-0">
                <h1 className="truncate text-xl sm:text-2xl">{title}</h1>
                {subtitle ? (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {actions}
                <Button
                  variant="outline"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Open command palette"
                  onClick={() => setOpen(true)}
                >
                  <Search className="size-4" />
                </Button>
              </div>
            </div>
          </header>

          <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>

      {/* Mobile navigation */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 backdrop-blur lg:hidden"
      >
        <ul className="grid grid-cols-5">
          {MOBILE_NAV.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <li key={to}>
                <Link
                  to={to}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 text-[11px]",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
