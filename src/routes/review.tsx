import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { addDays, format, isWithinInterval, parseISO, startOfWeek, subWeeks } from "date-fns";
import { toast } from "sonner";
import { AppShell } from "@/components/lifeos/app-shell";
import { AuthGate } from "@/components/lifeos/auth-gate";
import { EmptyState, ErrorState, LoadingRows, Panel, PanelHeader } from "@/components/lifeos/states";
import { Stat } from "@/components/lifeos/stat";
import { WeeklyBars } from "@/components/lifeos/charts";
import { AreaDot } from "@/components/lifeos/area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  entriesQuery,
  habitsQuery,
  journalQuery,
  reviewsQuery,
  tasksQuery,
  useSaveReview,
} from "@/lib/queries";
import { completionRate, isDone, isScheduled, summarizeTrend, toISODate, weeklyAdherence } from "@/lib/analytics";

export const Route = createFileRoute("/review")({
  head: () => ({
    meta: [
      { title: "Weekly review — LifeOS" },
      {
        name: "description",
        content: "Close the week: what worked, what got in the way, and the single focus for next week.",
      },
      { property: "og:title", content: "Weekly review — LifeOS" },
      {
        property: "og:description",
        content: "A structured weekly close-out built on your real habit and task data.",
      },
    ],
  }),
  component: ReviewPage,
});

function ReviewPage() {
  return (
    <AuthGate>
      <AppShell title="Weekly review" subtitle="Fifteen quiet minutes to close the loop">
        <ReviewBody />
      </AppShell>
    </AuthGate>
  );
}

function ReviewBody() {
  const [offset, setOffset] = useState(0); // 0 = this week
  const weekStart = startOfWeek(subWeeks(new Date(), offset), { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);
  const weekKey = toISODate(weekStart);

  const habits = useQuery(habitsQuery);
  const entries = useQuery(entriesQuery);
  const tasks = useQuery(tasksQuery);
  const journal = useQuery(journalQuery);
  const reviews = useQuery(reviewsQuery);
  const saveReview = useSaveReview();

  const saved = reviews.data?.find((r) => r.weekStart === weekKey);
  const [form, setForm] = useState({ wins: "", friction: "", nextFocus: "" });
  const values = {
    wins: form.wins || saved?.wins || "",
    friction: form.friction || saved?.friction || "",
    nextFocus: form.nextFocus || saved?.nextFocus || "",
  };

  const stats = useMemo(() => {
    if (!habits.data || !entries.data) return null;
    const active = habits.data.filter((h) => !h.archived);
    let scheduled = 0;
    let done = 0;
    const perHabit = active.map((h) => {
      let s = 0;
      let d = 0;
      for (let i = 0; i < 7; i++) {
        const day = addDays(weekStart, i);
        if (day > new Date()) break;
        if (!isScheduled(h, day)) continue;
        s++;
        if (isDone(entries.data!, h.id, day)) d++;
      }
      scheduled += s;
      done += d;
      return { habit: h, scheduled: s, done: d };
    });
    return { scheduled, done, perHabit };
  }, [habits.data, entries.data, weekStart]);

  const weekTasks = (tasks.data ?? []).filter(
    (t) => t.dueDate && isWithinInterval(parseISO(t.dueDate), { start: weekStart, end: weekEnd }),
  );
  const weekJournal = (journal.data ?? []).filter((j) =>
    isWithinInterval(parseISO(j.date), { start: weekStart, end: weekEnd }),
  );
  const focusMinutes = weekJournal.reduce((s, j) => s + j.focusMinutes, 0);
  const weekly = habits.data && entries.data ? weeklyAdherence(habits.data.filter((h) => !h.archived), entries.data, 10) : [];

  if (habits.isPending || entries.isPending || reviews.isPending) {
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <p className="min-w-0 truncate text-sm text-muted-foreground">
          Week of {format(weekStart, "d MMMM")} – {format(weekEnd, "d MMMM yyyy")}
          {saved?.submittedAt ? " · submitted" : " · draft"}
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={() => setOffset((o) => o + 1)}>
            Earlier
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={offset === 0}
            onClick={() => setOffset((o) => Math.max(0, o - 1))}
          >
            Later
          </Button>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          label="Habit rate"
          value={stats && stats.scheduled ? `${Math.round((stats.done / stats.scheduled) * 100)}%` : "—"}
          hint={stats ? `${stats.done} of ${stats.scheduled} scheduled` : "no data"}
        />
        <Stat
          label="Tasks"
          value={`${weekTasks.filter((t) => t.done).length}/${weekTasks.length}`}
          hint="completed this week"
        />
        <Stat label="Focus" value={`${focusMinutes}m`} hint={`${weekJournal.length} days logged`} />
        <Stat
          label="Mood"
          value={
            weekJournal.length
              ? (weekJournal.reduce((s, j) => s + j.mood, 0) / weekJournal.length).toFixed(1)
              : "—"
          }
          hint="average of logged days"
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <Panel>
          <PanelHeader title="Close the week" hint="Short answers beat thorough ones you never write" />
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              saveReview.mutate(
                {
                  weekStart: weekKey,
                  wins: values.wins,
                  friction: values.friction,
                  nextFocus: values.nextFocus,
                  submittedAt: new Date().toISOString(),
                },
                { onSuccess: () => toast.success("Weekly review saved") },
              );
            }}
          >
            {(
              [
                ["wins", "What went well?", "The two or three things you'd repeat."],
                ["friction", "What got in the way?", "Be specific and unsentimental."],
                ["nextFocus", "One focus for next week", "A single sentence you could act on Monday."],
              ] as const
            ).map(([key, label, hint]) => (
              <div key={key}>
                <Label htmlFor={key}>{label}</Label>
                <p className="mt-0.5 mb-2 text-xs text-muted-foreground">{hint}</p>
                <Textarea
                  id={key}
                  rows={key === "nextFocus" ? 2 : 3}
                  value={values[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder="…"
                />
              </div>
            ))}
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saveReview.isPending}>
                {saveReview.isPending ? "Saving…" : saved ? "Update review" : "Save review"}
              </Button>
              {saveReview.isError ? (
                <span className="text-xs text-destructive">Couldn't save. Try again.</span>
              ) : null}
            </div>
          </form>
        </Panel>

        <div className="space-y-6">
          <Panel>
            <PanelHeader title="Habit breakdown" hint="This week, by habit" />
            {!stats || stats.perHabit.length === 0 ? (
              <EmptyState title="No habits scheduled this week" />
            ) : (
              <ul className="space-y-3">
                {stats.perHabit.map(({ habit, scheduled, done }) => (
                  <li key={habit.id}>
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                      <span className="flex min-w-0 items-center gap-2 text-sm">
                        <AreaDot area={habit.area} />
                        <span className="truncate">{habit.name}</span>
                      </span>
                      <span className="num shrink-0 text-xs text-muted-foreground">
                        {done}/{scheduled || 0}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1 w-full rounded-full bg-muted">
                      <div
                        className="h-1 rounded-full bg-primary"
                        style={{ width: `${scheduled ? (done / scheduled) * 100 : 0}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel>
            <PanelHeader title="Ten-week context" hint="Is this week typical?" />
            <WeeklyBars data={weekly} summary={summarizeTrend(weekly.map((w) => w.rate))} height={180} />
          </Panel>

          <Panel>
            <PanelHeader title="Previous reviews" />
            {reviews.data && reviews.data.length > 0 ? (
              <ul className="space-y-4">
                {reviews.data.slice(0, 3).map((r) => (
                  <li key={r.id} className="border-l border-border pl-3">
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(r.weekStart), "d MMMM yyyy")}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed">{r.nextFocus}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No reviews yet" description="This one will be the first." />
            )}
          </Panel>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Best-performing habit this week:{" "}
        {stats && stats.perHabit.length
          ? [...stats.perHabit].sort(
              (a, b) => b.done / (b.scheduled || 1) - a.done / (a.scheduled || 1),
            )[0]!.habit.name
          : "—"}
        {habits.data && entries.data
          ? ` · 30-day leader: ${
              [...habits.data.filter((h) => !h.archived)].sort(
                (a, b) => completionRate(b, entries.data!) - completionRate(a, entries.data!),
              )[0]?.name ?? "—"
            }`
          : ""}
      </p>
    </div>
  );
}
