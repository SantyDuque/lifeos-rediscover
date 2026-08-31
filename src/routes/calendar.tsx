import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { addDays, addWeeks, format, isSameDay, isToday, parseISO, startOfWeek } from "date-fns";
import { AppShell } from "@/components/lifeos/app-shell";
import { AuthGate } from "@/components/lifeos/auth-gate";
import { EmptyState, ErrorState, LoadingRows, Panel } from "@/components/lifeos/states";
import { AreaDot } from "@/components/lifeos/area";
import { Button } from "@/components/ui/button";
import { eventsQuery, habitsQuery, tasksQuery } from "@/lib/queries";
import { isScheduled, tasksForDay } from "@/lib/analytics";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — LifeOS" },
      {
        name: "description",
        content: "A week view that puts events, due tasks and scheduled habits on the same grid.",
      },
      { property: "og:title", content: "Calendar — LifeOS" },
      {
        property: "og:description",
        content: "Events, tasks and habits on one week grid so the day is honest about its load.",
      },
    ],
  }),
  component: CalendarPage,
});

function CalendarPage() {
  return (
    <AuthGate>
      <AppShell title="Calendar" subtitle="Events, due tasks and scheduled habits together">
        <CalendarBody />
      </AppShell>
    </AuthGate>
  );
}

function CalendarBody() {
  const [weekOffset, setWeekOffset] = useState(0);
  const start = startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  const events = useQuery(eventsQuery);
  const tasks = useQuery(tasksQuery);
  const habits = useQuery(habitsQuery);

  if (events.isPending || tasks.isPending || habits.isPending) return <LoadingRows rows={6} />;
  if (events.isError)
    return <ErrorState error={events.error} onRetry={() => events.refetch()} />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <p className="min-w-0 truncate text-sm text-muted-foreground">
          {format(start, "d MMMM")} – {format(addDays(start, 6), "d MMMM yyyy")}
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={() => setWeekOffset((w) => w - 1)}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)} disabled={weekOffset === 0}>
            This week
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset((w) => w + 1)}>
            Next
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-7">
        {days.map((day) => {
          const dayEvents = (events.data ?? [])
            .filter((e) => isSameDay(parseISO(e.start), day))
            .sort((a, b) => a.start.localeCompare(b.start));
          const dayTasks = tasksForDay(tasks.data ?? [], day);
          const dayHabits = (habits.data ?? []).filter((h) => !h.archived && isScheduled(h, day));
          const empty = !dayEvents.length && !dayTasks.length && !dayHabits.length;

          return (
            <Panel
              key={day.toISOString()}
              as="article"
              className={cn("p-3", isToday(day) && "border-primary/50")}
            >
              <header className="mb-3 flex items-baseline justify-between">
                <span className="text-[11px] tracking-widest text-muted-foreground uppercase">
                  {format(day, "EEE")}
                </span>
                <span className={cn("num text-sm", isToday(day) ? "text-primary" : "text-foreground")}>
                  {format(day, "d")}
                </span>
              </header>

              {empty ? (
                <p className="text-xs text-muted-foreground">Clear</p>
              ) : (
                <div className="space-y-3">
                  {dayEvents.length ? (
                    <ul className="space-y-2">
                      {dayEvents.map((e) => (
                        <li key={e.id} className="rounded-md border border-border px-2 py-1.5">
                          <p className="num text-[10px] text-muted-foreground">
                            {format(parseISO(e.start), "HH:mm")}
                          </p>
                          <p className="mt-0.5 flex items-start gap-1.5 text-xs leading-snug">
                            <AreaDot area={e.area} className="mt-1.5" />
                            <span className="min-w-0">{e.title}</span>
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {dayTasks.length ? (
                    <ul className="space-y-1">
                      {dayTasks.map((t) => (
                        <li
                          key={t.id}
                          className={cn(
                            "flex items-start gap-1.5 text-xs",
                            t.done && "text-muted-foreground line-through",
                          )}
                        >
                          <AreaDot area={t.area} className="mt-1.5" />
                          <span className="min-w-0">{t.title}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {dayHabits.length ? (
                    <p className="border-t border-border pt-2 text-[11px] text-muted-foreground">
                      {dayHabits.length} habits scheduled
                    </p>
                  ) : null}
                </div>
              )}
            </Panel>
          );
        })}
      </div>

      {(events.data ?? []).length === 0 ? (
        <EmptyState title="No events on record" description="Connect a calendar source to see events here." />
      ) : null}
    </div>
  );
}
