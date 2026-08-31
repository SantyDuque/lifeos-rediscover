import { Link } from "@tanstack/react-router";
import { Check, Flame } from "lucide-react";
import { AreaDot } from "@/components/lifeos/area";
import { cn } from "@/lib/utils";
import type { Habit } from "@/lib/types";

export function HabitRow({
  habit,
  done,
  streak,
  rate,
  onToggle,
  pending,
  scheduled = true,
}: {
  habit: Habit;
  done: boolean;
  streak: number;
  rate: number;
  onToggle: () => void;
  pending?: boolean;
  scheduled?: boolean;
}) {
  return (
    <li
      className={cn(
        "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border py-3 last:border-b-0",
        pending && "opacity-60",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={done}
        aria-label={`${done ? "Undo" : "Complete"} ${habit.name} for today`}
        className={cn(
          "grid size-7 place-items-center rounded-full border transition-colors",
          done
            ? "border-transparent bg-primary text-primary-foreground"
            : "border-border-strong text-transparent hover:border-primary",
        )}
      >
        <Check className="size-3.5" />
      </button>

      <div className="min-w-0">
        <Link
          to="/habits/$habitId"
          params={{ habitId: habit.id }}
          className="block truncate text-sm hover:underline"
        >
          {habit.name}
        </Link>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <AreaDot area={habit.area} />
            {habit.targetPerWeek}× per week
          </span>
          {!scheduled ? <span>Not scheduled today</span> : null}
          <span className="num">{Math.round(rate * 100)}% · 30d</span>
        </p>
      </div>

      <span
        className="num flex shrink-0 items-center gap-1 text-xs text-muted-foreground"
        title={`${streak} day streak`}
      >
        <Flame className={cn("size-3.5", streak > 0 && "text-primary")} />
        {streak}
      </span>
    </li>
  );
}
