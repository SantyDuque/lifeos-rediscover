import { format, parseISO } from "date-fns";
import { Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { AreaTag } from "@/components/lifeos/area";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/types";

export function TaskItem({
  task,
  onToggle,
  onDelete,
  pending,
}: {
  task: Task;
  onToggle: (done: boolean) => void;
  onDelete?: () => void;
  pending?: boolean;
}) {
  return (
    <li
      className={cn(
        "group grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 border-b border-border py-3 last:border-b-0",
        pending && "opacity-60",
      )}
    >
      <Checkbox
        id={`task-${task.id}`}
        checked={task.done}
        onCheckedChange={(v) => onToggle(Boolean(v))}
        className="mt-0.5"
        aria-label={`Mark "${task.title}" ${task.done ? "not done" : "done"}`}
      />
      <div className="min-w-0">
        <label
          htmlFor={`task-${task.id}`}
          className={cn(
            "block cursor-pointer text-sm leading-snug",
            task.done && "text-muted-foreground line-through",
          )}
        >
          {task.title}
        </label>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <AreaTag area={task.area} />
          {task.priority === "high" ? (
            <span className="rounded-full border border-primary/40 px-2 py-0.5 tracking-wide text-primary uppercase">
              High
            </span>
          ) : null}
          {task.estimateMinutes ? <span className="num">{task.estimateMinutes} min</span> : null}
          {task.dueDate ? <span>{format(parseISO(task.dueDate), "d MMM")}</span> : null}
        </div>
      </div>
      {onDelete ? (
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Delete "${task.title}"`}
          className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          onClick={onDelete}
        >
          <Trash2 className="size-3.5" />
        </Button>
      ) : (
        <span />
      )}
    </li>
  );
}
