import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Check } from "lucide-react";
import { AppShell } from "@/components/lifeos/app-shell";
import { AuthGate } from "@/components/lifeos/auth-gate";
import { EmptyState, ErrorState, LoadingRows, Panel } from "@/components/lifeos/states";
import { AreaTag } from "@/components/lifeos/area";
import { Button } from "@/components/ui/button";
import { goalsQuery, tasksQuery } from "@/lib/queries";
import type { GoalStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/goals")({
  head: () => ({
    meta: [
      { title: "Goals — LifeOS" },
      {
        name: "description",
        content: "Long-horizon goals with milestones, progress and the tasks feeding them.",
      },
      { property: "og:title", content: "Goals — LifeOS" },
      {
        property: "og:description",
        content: "Milestones, progress and linked tasks for the things that take months.",
      },
    ],
  }),
  component: GoalsPage,
});

function GoalsPage() {
  return (
    <AuthGate>
      <AppShell title="Goals" subtitle="The things that take months, not days">
        <GoalsBody />
      </AppShell>
    </AuthGate>
  );
}

const STATUSES: { id: GoalStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "paused", label: "Paused" },
  { id: "done", label: "Done" },
];

function GoalsBody() {
  const goals = useQuery(goalsQuery);
  const tasks = useQuery(tasksQuery);
  const [status, setStatus] = useState<GoalStatus | "all">("active");

  if (goals.isPending) return <LoadingRows rows={4} />;
  if (goals.isError) return <ErrorState error={goals.error} onRetry={() => goals.refetch()} />;

  const list = status === "all" ? goals.data : goals.data.filter((g) => g.status === status);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-1">
        {STATUSES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStatus(s.id)}
            aria-pressed={status === s.id}
            className={cn(
              "rounded-full border px-3 py-1 text-[11px] tracking-wide uppercase transition-colors",
              status === s.id
                ? "border-primary/50 text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState
          title="Nothing here"
          description="No goals with this status right now."
          action={
            <Button size="sm" variant="outline" onClick={() => setStatus("all")}>
              Show all
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {list.map((g) => {
            const linked = (tasks.data ?? []).filter((t) => t.goalId === g.id);
            return (
              <Panel key={g.id} as="article">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <div className="min-w-0">
                    <h2 className="text-base leading-snug">{g.title}</h2>
                    {g.why ? (
                      <p className="mt-1 text-xs text-muted-foreground italic">{g.why}</p>
                    ) : null}
                  </div>
                  <span className="num shrink-0 text-sm text-muted-foreground">{g.progress}%</span>
                </div>

                <div className="mt-3 h-1 w-full rounded-full bg-muted">
                  <div className="h-1 rounded-full bg-primary" style={{ width: `${g.progress}%` }} />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <AreaTag area={g.area} />
                  <span className="rounded-full border border-border px-2 py-0.5 tracking-wide uppercase">
                    {g.status}
                  </span>
                  <span>
                    {g.targetDate ? `Target ${format(parseISO(g.targetDate), "d MMM yyyy")}` : "No target date"}
                  </span>
                </div>

                <ul className="mt-4 space-y-2">
                  {g.milestones.map((m) => (
                    <li key={m.id} className="flex items-start gap-2 text-sm">
                      <span
                        className={cn(
                          "mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border",
                          m.done ? "border-transparent bg-primary text-primary-foreground" : "border-border-strong",
                        )}
                      >
                        {m.done ? <Check className="size-2.5" /> : null}
                      </span>
                      <span className={cn("min-w-0", m.done && "text-muted-foreground line-through")}>
                        {m.title}
                      </span>
                    </li>
                  ))}
                </ul>

                {linked.length > 0 ? (
                  <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
                    {linked.filter((t) => t.done).length} of {linked.length} linked tasks complete
                  </p>
                ) : null}
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}
