import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/lifeos/app-shell";
import { AuthGate } from "@/components/lifeos/auth-gate";
import { EmptyState, ErrorState, LoadingRows, Panel, PanelHeader } from "@/components/lifeos/states";
import { Stat } from "@/components/lifeos/stat";
import { HabitHeatmap, WeeklyBars } from "@/components/lifeos/charts";
import { AreaTag } from "@/components/lifeos/area";
import { Button } from "@/components/ui/button";
import { entriesQuery, habitsQuery, useToggleHabit } from "@/lib/queries";
import {
  completionRate,
  currentStreak,
  isDone,
  isScheduled,
  longestStreak,
  summarizeTrend,
  toISODate,
  weeklyAdherence,
} from "@/lib/analytics";

export const Route = createFileRoute("/habits/$habitId")({
  head: () => ({
    meta: [
      { title: "Habit detail — LifeOS" },
      {
        name: "description",
        content: "Streak history, weekly completion and the full log for a single habit.",
      },
      { property: "og:title", content: "Habit detail — LifeOS" },
      {
        property: "og:description",
        content: "See how one habit has actually behaved over the last six months.",
      },
    ],
  }),
  component: HabitDetailPage,
});

function HabitDetailPage() {
  return (
    <AuthGate>
      <HabitDetailBody />
    </AuthGate>
  );
}

function HabitDetailBody() {
  const { habitId } = Route.useParams();
  const habits = useQuery(habitsQuery);
  const entries = useQuery(entriesQuery);
  const toggle = useToggleHabit();
  const today = new Date();

  const habit = habits.data?.find((h) => h.id === habitId);

  if (habits.isPending || entries.isPending) {
    return (
      <AppShell title="Habit">
        <Panel>
          <LoadingRows rows={6} />
        </Panel>
      </AppShell>
    );
  }

  if (habits.isError || entries.isError) {
    return (
      <AppShell title="Habit">
        <ErrorState
          error={habits.error ?? entries.error}
          onRetry={() => {
            habits.refetch();
            entries.refetch();
          }}
        />
      </AppShell>
    );
  }

  if (!habit) {
    return (
      <AppShell title="Habit not found">
        <EmptyState
          title="That habit isn't here anymore"
          description="It may have been archived or deleted."
          action={
            <Button asChild size="sm" variant="outline">
              <Link to="/habits">Back to habits</Link>
            </Button>
          }
        />
      </AppShell>
    );
  }

  const weekly = weeklyAdherence([habit], entries.data, 12);
  const log = entries.data
    .filter((e) => e.habitId === habit.id)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 14);

  const heat = Array.from({ length: 126 }, (_, i) => {
    const day = subDays(today, 125 - i);
    return {
      date: toISODate(day),
      state: !isScheduled(habit, day)
        ? ("off" as const)
        : isDone(entries.data, habit.id, day)
          ? ("done" as const)
          : ("missed" as const),
    };
  });

  const doneCount = heat.filter((h) => h.state === "done").length;
  const scheduledCount = heat.filter((h) => h.state !== "off").length;
  const doneToday = isDone(entries.data, habit.id, today);

  return (
    <AppShell
      title={habit.name}
      subtitle={habit.description ?? `${habit.targetPerWeek} times per week`}
      actions={
        <Button
          size="sm"
          variant={doneToday ? "secondary" : "default"}
          onClick={() => toggle.mutate({ habitId: habit.id, date: toISODate(today) })}
          disabled={toggle.isPending}
        >
          {doneToday ? "Undo today" : "Mark done today"}
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/habits">
              <ArrowLeft className="size-3.5" />
              Habits
            </Link>
          </Button>
          <AreaTag area={habit.area} />
          <span className="text-xs text-muted-foreground">
            Scheduled {habit.daysOfWeek.length === 7 ? "every day" : `${habit.daysOfWeek.length} days a week`}
            {habit.targetAmount ? ` · target ${habit.targetAmount} ${habit.unit ?? ""}` : ""}
          </span>
        </div>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Current streak" value={String(currentStreak(habit, entries.data))} hint="scheduled days" />
          <Stat label="Longest streak" value={String(longestStreak(habit, entries.data))} hint="last 6 months" />
          <Stat
            label="30-day rate"
            value={`${Math.round(completionRate(habit, entries.data) * 100)}%`}
            hint="of scheduled days"
          />
          <Stat label="Total done" value={String(doneCount)} hint={`of ${scheduledCount} scheduled`} />
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Panel>
            <PanelHeader title="Weekly completion" hint="Last twelve weeks" />
            <WeeklyBars
              data={weekly}
              summary={summarizeTrend(weekly.map((w) => w.rate))}
            />
          </Panel>

          <Panel>
            <PanelHeader title="Eighteen-week grid" hint="Filled squares are completed days" />
            <HabitHeatmap
              days={heat}
              area={habit.area}
              summary={`${doneCount} of ${scheduledCount} scheduled days completed since ${format(
                subDays(today, 125),
                "d MMMM",
              )}. Faded squares are days this habit isn't scheduled.`}
            />
          </Panel>
        </div>

        <Panel>
          <PanelHeader title="Recent log" hint="Most recent completions" />
          {log.length === 0 ? (
            <EmptyState
              title="No completions logged yet"
              description="The first entry starts the streak."
            />
          ) : (
            <ul className="divide-y divide-border">
              {log.map((e) => (
                <li key={e.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-2.5 text-sm">
                  <span className="truncate text-muted-foreground">
                    {format(new Date(`${e.date}T00:00:00`), "EEEE d MMMM")}
                  </span>
                  <span className="num text-xs text-foreground">
                    {e.amount !== undefined ? `${e.amount} ${habit.unit ?? ""}` : "done"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}
