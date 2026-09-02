import { Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { Panel, PanelHeader } from "@/components/lifeos/states";
import { Sparkline } from "@/components/lifeos/charts";
import type {
  MovementTrend,
  PersonalRecord,
  Readiness,
  SessionLog,
  TrainingDay,
} from "@/lib/gym/types";
import { cn } from "@/lib/utils";

export function TrainingWeek({ days, todayISO }: { days: TrainingDay[]; todayISO: string }) {
  const strength = days.filter((d) => d.kind === "strength");
  const doneStrength = strength.filter((d) => d.done).length;
  return (
    <Panel>
      <PanelHeader title="Training week" hint="Current schedule" />
      <ul>
        {days.map((d) => {
          const isToday = d.date === todayISO;
          return (
            <li
              key={d.date}
              className={cn(
                "grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-border py-2 last:border-b-0",
                isToday && "-mx-2 rounded-md bg-accent/50 px-2",
              )}
            >
              <span className="num text-[11px] tracking-widest text-muted-foreground uppercase">
                {d.weekday}
              </span>
              <span
                className={cn(
                  "truncate text-sm",
                  d.kind === "rest" || d.kind === "recovery"
                    ? "text-muted-foreground"
                    : "text-foreground",
                )}
              >
                {d.label}
                {isToday ? (
                  <span className="ml-2 text-[11px] tracking-wide text-primary uppercase">
                    today
                  </span>
                ) : null}
              </span>
              <span className="text-xs text-muted-foreground">
                {d.done ? <span className="text-success">✓ done</span> : ""}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">
        {doneStrength} of {strength.length} strength sessions completed
      </p>
    </Panel>
  );
}

export function ReadinessPanel({ readiness }: { readiness: Readiness }) {
  const hours = Math.floor(readiness.sleepMinutes / 60);
  const mins = readiness.sleepMinutes % 60;
  const rows: [string, string][] = [
    ["Sleep", `${hours}h ${String(mins).padStart(2, "0")}m`],
    ["Energy", `${readiness.energy}/5`],
    ["Soreness", readiness.soreness === "low" ? "Low" : readiness.soreness === "moderate" ? "Moderate" : "High"],
  ];
  return (
    <Panel>
      <PanelHeader title="Readiness" hint="From your daily check-in" />
      <div className="flex items-end gap-3">
        <p className="num text-3xl text-foreground">{readiness.score}%</p>
        <div
          className="mb-2 h-1 flex-1 rounded-full bg-muted"
          role="img"
          aria-label={`Readiness ${readiness.score} percent`}
        >
          <div
            className="h-1 rounded-full bg-primary"
            style={{ width: `${readiness.score}%` }}
          />
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-3">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt className="text-[11px] tracking-widest text-muted-foreground uppercase">{k}</dt>
            <dd className="num mt-0.5 text-sm text-foreground">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs text-muted-foreground">{readiness.guidance}</p>
    </Panel>
  );
}

export function RecentPerformance({ trends }: { trends: MovementTrend[] }) {
  return (
    <Panel>
      <PanelHeader title="Recent performance" hint="Estimated 1RM, last 30 days" />
      <ul>
        {trends.map((m) => (
          <li
            key={m.id}
            className="grid grid-cols-[minmax(0,1fr)_5.5rem] items-center gap-3 border-b border-border py-2.5 last:border-b-0"
          >
            <div className="min-w-0">
              <p className="truncate text-sm text-foreground">{m.name}</p>
              <p className="num mt-0.5 text-xs text-muted-foreground">
                {m.current} kg ·{" "}
                <span className={m.change30d >= 0 ? "text-success" : "text-muted-foreground"}>
                  {m.change30d >= 0 ? "+" : "−"}
                  {Math.abs(m.change30d)} kg
                </span>
              </p>
            </div>
            <div className="h-8">
              <Sparkline data={m.history} color="var(--muted-foreground)" />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">
        Twelve-week working-weight trend for the three main lifts. All three are moving up.
      </p>
    </Panel>
  );
}

export function PersonalRecords({ records }: { records: PersonalRecord[] }) {
  return (
    <Panel>
      <PanelHeader
        title="Personal records"
        hint="Recent bests"
        action={
          <Link to="/gym" className="text-xs text-muted-foreground hover:text-foreground">
            View all
          </Link>
        }
      />
      <ul>
        {records.slice(0, 3).map((pr) => (
          <li
            key={pr.id}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 border-b border-border py-2 last:border-b-0"
          >
            <span className="truncate text-sm text-foreground">{pr.movement}</span>
            <span className="num text-xs text-muted-foreground">
              <span className="text-primary">{pr.load} kg</span> ·{" "}
              {format(parseISO(pr.date), "d MMM")}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function RecentSessions({ sessions }: { sessions: SessionLog[] }) {
  return (
    <Panel>
      <PanelHeader title="Training log" hint="Last three sessions" />
      <ul>
        {sessions.map((s) => (
          <li
            key={s.id}
            className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-border py-2.5 last:border-b-0"
          >
            <span className="num text-xs text-muted-foreground">
              {format(parseISO(s.date), "d MMM")}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm text-foreground">
                {s.name}
                <span className="ml-2 text-[11px] text-success">✓ completed</span>
              </p>
              <p className="num mt-0.5 text-xs text-muted-foreground">
                {s.durationMinutes} min · {s.exerciseCount} exercises · {s.totalSets} sets
              </p>
            </div>
            <span className="num text-xs text-muted-foreground">
              {s.volumeKg.toLocaleString()} kg
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
