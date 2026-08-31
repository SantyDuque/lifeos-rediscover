import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format, isSameDay, parseISO } from "date-fns";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/lifeos/app-shell";
import { AuthGate } from "@/components/lifeos/auth-gate";
import {
  EmptyState,
  ErrorState,
  LoadingRows,
  Panel,
  PanelHeader,
  PartialDataNotice,
} from "@/components/lifeos/states";
import { TaskItem } from "@/components/lifeos/task-item";
import { HabitRow } from "@/components/lifeos/habit-row";
import { Stat } from "@/components/lifeos/stat";
import { AreaDot } from "@/components/lifeos/area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  entriesQuery,
  eventsQuery,
  habitsQuery,
  journalQuery,
  tasksQuery,
  useCreateTask,
  useDeleteTask,
  useToggleHabit,
  useUpdateTask,
} from "@/lib/queries";
import {
  completionRate,
  currentStreak,
  isDone,
  isScheduled,
  overdueTasks,
  tasksForDay,
  toISODate,
} from "@/lib/analytics";
import { LIFE_AREAS, type LifeArea } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today — LifeOS" },
      {
        name: "description",
        content:
          "One screen for the day: scheduled habits, the tasks that matter, and what's already on the calendar.",
      },
      { property: "og:title", content: "Today — LifeOS" },
      {
        property: "og:description",
        content: "Scheduled habits, today's tasks and your calendar in one calm view.",
      },
    ],
  }),
  component: TodayPage,
});

function TodayPage() {
  return (
    <AuthGate>
      <AppShell
        title={greeting()}
        subtitle={format(new Date(), "EEEE d MMMM yyyy")}
        actions={
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <Link to="/review">Weekly review</Link>
          </Button>
        }
      >
        <TodayBody />
      </AppShell>
    </AuthGate>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function TodayBody() {
  const today = new Date();
  const todayKey = toISODate(today);

  const habits = useQuery(habitsQuery);
  const entries = useQuery(entriesQuery);
  const tasks = useQuery(tasksQuery);
  const events = useQuery(eventsQuery);
  const journal = useQuery(journalQuery);

  const toggleHabit = useToggleHabit();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const createTask = useCreateTask();

  const [draft, setDraft] = useState("");
  const [draftArea, setDraftArea] = useState<LifeArea>("craft");

  const scheduledHabits = (habits.data ?? []).filter((h) => !h.archived && isScheduled(h, today));
  const doneCount =
    entries.data && scheduledHabits.length
      ? scheduledHabits.filter((h) => isDone(entries.data, h.id, today)).length
      : 0;

  const dayTasks = tasks.data ? tasksForDay(tasks.data, today) : [];
  const openTasks = dayTasks.filter((t) => !t.done);
  const overdue = tasks.data ? overdueTasks(tasks.data) : [];
  const todayEvents = (events.data ?? [])
    .filter((e) => isSameDay(parseISO(e.start), today))
    .sort((a, b) => a.start.localeCompare(b.start));
  const todayJournal = journal.data?.find((j) => j.date === todayKey);

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          label="Habits"
          value={`${doneCount}/${scheduledHabits.length || 0}`}
          hint="scheduled for today"
        />
        <Stat label="Tasks left" value={String(openTasks.length)} hint={`${dayTasks.length} due today`} />
        <Stat label="Overdue" value={String(overdue.length)} hint="carried from earlier" />
        <Stat
          label="Focus"
          value={todayJournal ? `${todayJournal.focusMinutes}m` : "—"}
          hint={todayJournal ? "logged today" : "not logged yet"}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="space-y-6">
          <Panel>
            <PanelHeader
              title="Today's habits"
              hint={
                scheduledHabits.length
                  ? `${doneCount} of ${scheduledHabits.length} done`
                  : "Nothing scheduled for this weekday"
              }
              action={
                <Button asChild variant="ghost" size="sm">
                  <Link to="/habits">All habits</Link>
                </Button>
              }
            />
            {habits.isPending || entries.isPending ? (
              <LoadingRows rows={4} />
            ) : habits.isError || entries.isError ? (
              <ErrorState
                error={habits.error ?? entries.error}
                onRetry={() => {
                  habits.refetch();
                  entries.refetch();
                }}
              />
            ) : scheduledHabits.length === 0 ? (
              <EmptyState
                title="No habits scheduled today"
                description="Rest days are part of the system. Add or edit cadences from the Habits page."
                action={
                  <Button asChild size="sm" variant="outline">
                    <Link to="/habits">Open habits</Link>
                  </Button>
                }
              />
            ) : (
              <ul>
                {scheduledHabits.map((h) => (
                  <HabitRow
                    key={h.id}
                    habit={h}
                    done={isDone(entries.data!, h.id, today)}
                    streak={currentStreak(h, entries.data!)}
                    rate={completionRate(h, entries.data!)}
                    pending={toggleHabit.isPending && toggleHabit.variables?.habitId === h.id}
                    onToggle={() => toggleHabit.mutate({ habitId: h.id, date: todayKey })}
                  />
                ))}
              </ul>
            )}
          </Panel>

          <Panel>
            <PanelHeader title="Today's tasks" hint="Due today, plus anything you add now" />

            <form
              className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:grid-cols-[minmax(0,1fr)_9rem_auto]"
              onSubmit={(e) => {
                e.preventDefault();
                if (!draft.trim()) return;
                createTask.mutate({
                  title: draft.trim(),
                  area: draftArea,
                  priority: "normal",
                  dueDate: todayKey,
                });
                setDraft("");
              }}
            >
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Add a task for today…"
                aria-label="New task title"
              />
              <Select value={draftArea} onValueChange={(v) => setDraftArea(v as LifeArea)}>
                <SelectTrigger className="hidden sm:flex" aria-label="Life area">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LIFE_AREAS.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="submit" size="icon" disabled={createTask.isPending} aria-label="Add task">
                <Plus className="size-4" />
              </Button>
            </form>

            {tasks.isPending ? (
              <LoadingRows rows={4} />
            ) : tasks.isError ? (
              <ErrorState error={tasks.error} onRetry={() => tasks.refetch()} />
            ) : dayTasks.length === 0 ? (
              <EmptyState
                title="Nothing due today"
                description="A clear day is a valid outcome. Pull something forward if you have room."
              />
            ) : (
              <ul>
                {dayTasks.map((t) => (
                  <TaskItem
                    key={t.id}
                    task={t}
                    pending={updateTask.isPending && updateTask.variables?.id === t.id}
                    onToggle={(done) => updateTask.mutate({ id: t.id, patch: { done } })}
                    onDelete={() => deleteTask.mutate(t.id)}
                  />
                ))}
              </ul>
            )}

            {overdue.length > 0 ? (
              <div className="mt-5 border-t border-border pt-4">
                <p className="mb-2 text-[11px] tracking-widest text-muted-foreground uppercase">
                  Overdue
                </p>
                <ul>
                  {overdue.map((t) => (
                    <TaskItem
                      key={t.id}
                      task={t}
                      onToggle={(done) => updateTask.mutate({ id: t.id, patch: { done } })}
                      onDelete={() => deleteTask.mutate(t.id)}
                    />
                  ))}
                </ul>
              </div>
            ) : null}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel>
            <PanelHeader
              title="Schedule"
              hint={todayEvents.length ? `${todayEvents.length} events` : undefined}
              action={
                <Button asChild variant="ghost" size="sm">
                  <Link to="/calendar">Week</Link>
                </Button>
              }
            />
            {events.isPending ? (
              <LoadingRows rows={3} />
            ) : events.isError ? (
              <ErrorState error={events.error} onRetry={() => events.refetch()} />
            ) : todayEvents.length === 0 ? (
              <EmptyState title="No events today" description="An open calendar. Use it well." />
            ) : (
              <ol className="space-y-3">
                {todayEvents.map((e) => (
                  <li key={e.id} className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-3">
                    <span className="num pt-0.5 text-xs text-muted-foreground">
                      {format(parseISO(e.start), "HH:mm")}
                    </span>
                    <div className="min-w-0 border-l border-border pl-3">
                      <p className="truncate text-sm">{e.title}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <AreaDot area={e.area} />
                        {format(parseISO(e.start), "HH:mm")}–{format(parseISO(e.end), "HH:mm")}
                        {e.location ? ` · ${e.location}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Panel>

          <Panel>
            <PanelHeader title="Daily check-in" hint="Mood, energy and focus feed your insights" />
            {journal.isPending ? (
              <LoadingRows rows={2} />
            ) : todayJournal ? (
              <dl className="grid grid-cols-3 gap-3 text-center">
                {[
                  ["Mood", `${todayJournal.mood}/5`],
                  ["Energy", `${todayJournal.energy}/5`],
                  ["Focus", `${todayJournal.focusMinutes}m`],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-md border border-border py-3">
                    <dt className="text-[11px] tracking-widest text-muted-foreground uppercase">{k}</dt>
                    <dd className="num mt-1 text-lg">{v}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <PartialDataNotice>
                Today's check-in is still empty, so today is excluded from mood and focus averages.
                You can log it during the weekly review.
              </PartialDataNotice>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
