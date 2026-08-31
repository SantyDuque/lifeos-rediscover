import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { subDays } from "date-fns";
import { AppShell } from "@/components/lifeos/app-shell";
import { AuthGate } from "@/components/lifeos/auth-gate";
import { EmptyState, ErrorState, LoadingRows, Panel, PanelHeader } from "@/components/lifeos/states";
import { HabitRow } from "@/components/lifeos/habit-row";
import { Stat } from "@/components/lifeos/stat";
import { Sparkline } from "@/components/lifeos/charts";
import { Button } from "@/components/ui/button";
import { entriesQuery, habitsQuery, useToggleHabit } from "@/lib/queries";
import {
  completionRate,
  currentStreak,
  dailyAdherence,
  isDone,
  isScheduled,
  toISODate,
} from "@/lib/analytics";
import { LIFE_AREAS, type LifeArea } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/habits/")({
  head: () => ({
    meta: [
      { title: "Habits — LifeOS" },
      {
        name: "description",
        content: "Every habit with its streak, 30-day completion rate and today's status.",
      },
      { property: "og:title", content: "Habits — LifeOS" },
      {
        property: "og:description",
        content: "Streaks, cadences and completion rates for every habit you track.",
      },
    ],
  }),
  component: HabitsPage,
});

function HabitsPage() {
  return (
    <AuthGate>
      <AppShell title="Habits" subtitle="Cadence, streaks and the last thirty days">
        <HabitsBody />
      </AppShell>
    </AuthGate>
  );
}

function HabitsBody() {
  const habits = useQuery(habitsQuery);
  const entries = useQuery(entriesQuery);
  const toggle = useToggleHabit();
  const [filter, setFilter] = useState<LifeArea | "all">("all");
  const today = new Date();

  if (habits.isPending || entries.isPending) {
    return (
      <Panel>
        <LoadingRows rows={6} />
      </Panel>
    );
  }

  if (habits.isError || entries.isError) {
    return (
      <ErrorState
        error={habits.error ?? entries.error}
        onRetry={() => {
          habits.refetch();
          entries.refetch();
        }}
      />
    );
  }

  const all = habits.data.filter((h) => !h.archived);
  const list = filter === "all" ? all : all.filter((h) => h.area === filter);
  const trend = dailyAdherence(all, entries.data, 30);
  const avg = Math.round(trend.reduce((s, d) => s + d.rate, 0) / (trend.length || 1));
  const bestStreak = all.reduce(
    (best, h) => Math.max(best, currentStreak(h, entries.data)),
    0,
  );
  const dueToday = all.filter((h) => isScheduled(h, today));
  const doneToday = dueToday.filter((h) => isDone(entries.data, h.id, today)).length;

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Tracked" value={String(all.length)} hint="active habits" />
        <Stat label="Today" value={`${doneToday}/${dueToday.length}`} hint="completed" />
        <Stat label="30-day rate" value={`${avg}%`} hint="of scheduled days">
          <div className="mt-2">
            <Sparkline data={trend} />
          </div>
        </Stat>
        <Stat label="Best streak" value={String(bestStreak)} hint="consecutive scheduled days" />
      </section>

      <Panel>
        <PanelHeader
          title="All habits"
          hint={`${list.length} shown`}
          action={
            <div className="flex flex-wrap justify-end gap-1">
              {(["all", ...LIFE_AREAS.map((a) => a.id)] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f as LifeArea | "all")}
                  aria-pressed={filter === f}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] tracking-wide uppercase transition-colors",
                    filter === f
                      ? "border-primary/50 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {f === "all" ? "All" : LIFE_AREAS.find((a) => a.id === f)!.label}
                </button>
              ))}
            </div>
          }
        />
        {list.length === 0 ? (
          <EmptyState
            title="No habits in this area"
            description="Try another area filter, or keep this part of life unstructured on purpose."
            action={
              <Button size="sm" variant="outline" onClick={() => setFilter("all")}>
                Show all
              </Button>
            }
          />
        ) : (
          <ul>
            {list.map((h) => (
              <HabitRow
                key={h.id}
                habit={h}
                scheduled={isScheduled(h, today)}
                done={isDone(entries.data, h.id, today)}
                streak={currentStreak(h, entries.data)}
                rate={completionRate(h, entries.data)}
                pending={toggle.isPending && toggle.variables?.habitId === h.id}
                onToggle={() => toggle.mutate({ habitId: h.id, date: toISODate(today) })}
              />
            ))}
          </ul>
        )}
      </Panel>

      <p className="text-xs text-muted-foreground">
        Rates cover {toISODate(subDays(today, 29))} to {toISODate(today)} and count only days the
        habit was actually scheduled.
      </p>
    </div>
  );
}
