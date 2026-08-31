import type { ReactNode } from "react";
import { AlertTriangle, Inbox, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function Panel({
  children,
  className,
  as: As = "section",
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "article";
}) {
  return <As className={cn("panel p-4 sm:p-5", className)}>{children}</As>;
}

export function PanelHeader({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
      <div className="min-w-0">
        <h2 className="truncate text-base text-foreground">{title}</h2>
        {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function LoadingRows({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-2.5", className)} role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-11 w-full rounded-md bg-muted" />
      ))}
      <span className="sr-only">Loading content</span>
    </div>
  );
}

export function ChartSkeleton({ height = 220 }: { height?: number }) {
  return (
    <div role="status" aria-label="Loading chart">
      <Skeleton className="w-full rounded-md bg-muted" style={{ height }} />
      <span className="sr-only">Loading chart</span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border px-6 py-10 text-center">
      <div className="mb-3 text-muted-foreground">{icon ?? <Inbox className="size-5" />}</div>
      <p className="text-sm text-foreground">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = "Couldn't load this",
  error,
  onRetry,
}: {
  title?: string;
  error?: unknown;
  onRetry?: () => void;
}) {
  const message =
    error instanceof Error ? error.message : "Something went wrong while fetching your data.";
  return (
    <div
      role="alert"
      className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-4 text-sm"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
        <div className="min-w-0 flex-1">
          <p className="text-foreground">{title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{message}</p>
          {onRetry ? (
            <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
              <RefreshCw className="size-3.5" />
              Try again
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function PartialDataNotice({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
      {children}
    </p>
  );
}

export function OfflineBanner({ online }: { online: boolean }) {
  if (online) return null;
  return (
    <div
      role="status"
      className="flex items-center gap-2 border-b border-border bg-warning/15 px-4 py-2 text-xs text-foreground"
    >
      <WifiOff className="size-3.5" />
      You're offline. Changes are held locally and will sync when the connection returns.
    </div>
  );
}
