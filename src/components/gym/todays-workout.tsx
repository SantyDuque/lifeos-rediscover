import { Check, Pencil, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/lifeos/states";
import {
  completedSets,
  currentExercise,
  totalSets,
  volumeKg,
  type Workout,
} from "@/lib/gym/types";
import { cn } from "@/lib/utils";

function StatusPill({ status }: { status: Workout["status"] }) {
  const label =
    status === "planned"
      ? "Planned"
      : status === "in-progress"
        ? "In progress"
        : status === "completed"
          ? "Completed"
          : "Rest";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] tracking-wide uppercase",
        status === "completed"
          ? "border-success/40 text-success"
          : status === "in-progress"
            ? "border-primary/50 text-primary"
            : "border-border text-muted-foreground",
      )}
    >
      {status === "completed" ? <Check className="size-3" aria-hidden /> : null}
      {label}
    </span>
  );
}

function elapsedLabel(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function TodaysWorkout({
  workout,
  elapsedSeconds,
  onStart,
  onFinish,
  onToggleSet,
}: {
  workout: Workout;
  elapsedSeconds: number;
  onStart: () => void;
  onFinish: () => void;
  onToggleSet: (exerciseId: string, setId: string) => void;
}) {
  const active = workout.status === "in-progress";
  const done = workout.status === "completed";
  const current = active ? currentExercise(workout) : null;
  const doneSets = completedSets(workout);
  const allSets = totalSets(workout);

  return (
    <Panel>
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display truncate text-lg text-foreground">{workout.name}</h2>
            <StatusPill status={workout.status} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {workout.program} · {workout.block} · {workout.estimatedMinutes} min
            {active ? (
              <>
                {" "}
                · <span className="num text-primary">{elapsedLabel(elapsedSeconds)} elapsed</span>
              </>
            ) : null}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {done ? null : active ? (
            <Button size="sm" onClick={onFinish}>
              <Square className="size-3.5" />
              Finish workout
            </Button>
          ) : (
            <Button size="sm" onClick={onStart}>
              <Play className="size-3.5" />
              Start workout
            </Button>
          )}
          <Button size="sm" variant="ghost" className="text-muted-foreground">
            <Pencil className="size-3.5" />
            Edit
          </Button>
        </div>
      </header>

      {done ? (
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 border-t border-border pt-4 text-sm sm:grid-cols-4">
          {[
            ["Duration", `${workout.durationMinutes ?? Math.round(elapsedSeconds / 60)} min`],
            ["Sets", `${doneSets}/${allSets}`],
            ["Volume", `${volumeKg(workout).toLocaleString()} kg`],
            ["Exercises", String(workout.exercises.length)],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-[11px] tracking-widest text-muted-foreground uppercase">{k}</dt>
              <dd className="num mt-0.5 text-foreground">{v}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <ul className="mt-4 border-t border-border">
        {workout.exercises.map((ex, i) => {
          const exDone = ex.sets.every((s) => s.done);
          const isCurrent = current?.id === ex.id;
          return (
            <li
              key={ex.id}
              className={cn(
                "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border py-2.5",
                isCurrent && "-mx-2 rounded-md bg-accent/50 px-2",
              )}
            >
              <div className="min-w-0">
                <p
                  className={cn(
                    "truncate text-sm",
                    exDone ? "text-muted-foreground line-through" : "text-foreground",
                  )}
                >
                  <span className="num mr-2 text-muted-foreground">{i + 1}</span>
                  {ex.name}
                  {isCurrent ? (
                    <span className="ml-2 text-[11px] tracking-wide text-primary uppercase">
                      current
                    </span>
                  ) : null}
                </p>
                <p className="num mt-0.5 text-xs text-muted-foreground">
                  {ex.sets.length} × {ex.sets[0]?.reps} ·{" "}
                  {ex.sets[0]?.load ? `${ex.sets[0].load} kg` : "Bodyweight"}
                  {ex.lastLoad ? ` · Last: ${ex.lastLoad} kg` : ""}
                </p>
              </div>

              {active || done ? (
                <div className="flex shrink-0 items-center gap-1">
                  {ex.sets.map((s, si) => (
                    <button
                      key={s.id}
                      type="button"
                      disabled={done}
                      onClick={() => onToggleSet(ex.id, s.id)}
                      aria-pressed={s.done}
                      aria-label={`${ex.name} set ${si + 1}${s.done ? ", completed" : ""}`}
                      className={cn(
                        "num size-6 rounded-[4px] border text-[11px] transition-colors",
                        s.done
                          ? "border-success/50 bg-success/20 text-foreground"
                          : "border-border text-muted-foreground hover:border-border-strong",
                      )}
                    >
                      {si + 1}
                    </button>
                  ))}
                </div>
              ) : (
                <span className="num shrink-0 text-xs text-muted-foreground">
                  {ex.sets.length} sets
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-xs text-muted-foreground">
        {done
          ? (workout.note ?? "Session logged. Loads carry over to the next block.")
          : `${doneSets} of ${allSets} sets completed.`}
      </p>
    </Panel>
  );
}
