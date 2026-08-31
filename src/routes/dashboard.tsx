import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/lifeos/app-shell";
import { AuthGate } from "@/components/lifeos/auth-gate";
import {
  ErrorState,
  LoadingRows,
  Panel,
  PanelHeader,
  PartialDataNotice,
} from "@/components/lifeos/states";
import { Stat } from "@/components/lifeos/stat";
import { AdherenceTrend, AreaBalanceChart, MoodEnergyChart } from "@/components/lifeos/charts";
import { entriesQuery, goalsQuery, habitsQuery, journalQuery, tasksQuery } from "@/lib/queries";
import {
  areaBalance,
  dailyAdherence,
  moodSeries,
  summarizeTrend,
} from "@/lib/analytics";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Insights — LifeOS" },
      {
        name: "description",
        content:
          "Adherence trends, mood and energy, and how your attention is spread across life areas.",
      },
      { property: "og:title", content: "Insights — LifeOS" },
      {
        property: "og:description",
        content: "Charts and plain-language summaries of how the last two months actually went.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <AuthGate>
      <AppShell title="Insights" subtitle="What the last sixty days actually looked like">
        <DashboardBody />
      </AppShell>
    </AuthGate>
  );
}

function DashboardBody() {
  const habits = useQuery(habitsQuery);
  const entries = useQuery(entriesQuery);
  const journal = useQuery(journalQuery);
  const tasks = useQuery(tasksQuery);
  const goals = useQuery(goalsQuery);

  const loading = habits.isPending || entries.isPending || journal.isPending;
  const failed = habits.isError || entries.isError;

  if (loading) {
    return (
      <div className="space-y-6">
        <Panel>
          <LoadingRows rows={2} />
        </Panel>
        <Panel>
          <LoadingRows rows={6} />
        </Panel>
      </div>
    );
  }

  if (failed) {
    return (
      <ErrorState
        title="Insights are unavailable"
        error={habits.error ?? entries.error}
        onRetry={() => {
          habits.refetch();
          entries.refetch();
        }}
      />
    );
  }

  const activeHabits = habits.data!.filter((h) => !h.archived);
  const trend = dailyAdherence(activeHabits, entries.data!, 60);
  const avg = Math.round(trend.reduce((s, d) => s + d.rate, 0) / (trend.length || 1));
  const mood = journal.isSuccess ? moodSeries(journal.data, 30) : [];
  const logged = mood.filter((m) => m.mood !== null);
  const avgMood = logged.length
    ? (logged.reduce((s, m) => s + (m.mood ?? 0), 0) / logged.length).toFixed(1)
    : "—";
  const avgFocus = logged.length
    ? Math.round(logged.reduce((s, m) => s + (m.focus ?? 0), 0) / logged.length)
    : 0;
  const balance =
    tasks.isSuccess && journal.isSuccess
      ? areaBalance(tasks.data, journal.data, activeHabits, entries.data!)
      : [];
  const activeGoals = goals.data?.filter((g) => g.status === "active") ?? [];

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Adherence" value={`${avg}%`} hint="60-day average" />
        <Stat label="Mood" value={String(avgMood)} hint={`${logged.length} of 30 days logged`} />
        <Stat label="Focus" value={`${avgFocus}m`} hint="average logged day" />
        <Stat
          label="Active goals"
          value={String(activeGoals.length)}
          hint={
            activeGoals.length
              ? `${Math.round(
                  activeGoals.reduce((s, g) => s + g.progress, 0) / activeGoals.length,
                )}% average progress`
              : "nothing in flight"
          }
        />
      </section>

      <Panel>
        <PanelHeader title="Habit adherence" hint="Share of scheduled habits completed each day" />
        <AdherenceTrend data={trend} summary={summarizeTrend(trend.map((d) => d.rate))} height={260} />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="Mood and energy" hint="Self-reported, one to five" />
          {journal.isError ? (
            <ErrorState
              title="Check-ins didn't load"
              error={journal.error}
              onRetry={() => journal.refetch()}
            />
          ) : (
            <>
              <MoodEnergyChart
                data={mood}
                summary={`Mood averaged ${avgMood} across ${logged.length} logged days; the line breaks on days with no check-in.`}
              />
              {logged.length < mood.length ? (
                <div className="mt-3">
                  <PartialDataNotice>
                    {mood.length - logged.length} of the last 30 days have no check-in. Gaps are left
                    empty rather than interpolated.
                  </PartialDataNotice>
                </div>
              ) : null}
            </>
          )}
        </Panel>

        <Panel>
          <PanelHeader title="Area balance" hint="Weighted habit and task activity, last 28 days" />
          {tasks.isError ? (
            <ErrorState title="Tasks didn't load" error={tasks.error} onRetry={() => tasks.refetch()} />
          ) : (
            <AreaBalanceChart
              data={balance}
              summary={
                balance.length
                  ? `Most attention went to ${
                      [...balance].sort((a, b) => b.value - a.value)[0]!.label
                    }; least to ${[...balance].sort((a, b) => a.value - b.value)[0]!.label}.`
                  : "No activity recorded in the last 28 days."
              }
            />
          )}
        </Panel>
      </div>
    </div>
  );
}
