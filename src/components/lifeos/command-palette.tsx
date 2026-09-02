import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CalendarDays,
  CheckCircle2,
  Flag,
  Gauge,
  ListTodo,
  Moon,
  NotebookPen,
  Dumbbell,
  Repeat,
  Settings as SettingsIcon,
  Sun,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { habitsQuery, tasksQuery, useToggleHabit, useUpdateTask } from "@/lib/queries";
import { toISODate } from "@/lib/analytics";
import { useTheme } from "@/components/lifeos/theme";

export function useCommandPalette() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  return { open, setOpen };
}

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const habits = useQuery({ ...habitsQuery, enabled: open });
  const tasks = useQuery({ ...tasksQuery, enabled: open });
  const toggleHabit = useToggleHabit();
  const updateTask = useUpdateTask();

  const run = (fn: () => void) => {
    onOpenChange(false);
    fn();
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <CommandInput placeholder="Search pages, habits and tasks…" />
      <CommandList>
        <CommandEmpty>Nothing matches that.</CommandEmpty>
        <CommandGroup heading="Go to">
          <CommandItem onSelect={() => run(() => navigate({ to: "/" }))}>
            <ListTodo /> Today <CommandShortcut>G T</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(() => navigate({ to: "/habits" }))}>
            <Repeat /> Habits
          </CommandItem>
          <CommandItem onSelect={() => run(() => navigate({ to: "/gym" }))}>
            <Dumbbell /> Gym
          </CommandItem>
          <CommandItem onSelect={() => run(() => navigate({ to: "/dashboard" }))}>
            <Gauge /> Insights
          </CommandItem>
          <CommandItem onSelect={() => run(() => navigate({ to: "/review" }))}>
            <NotebookPen /> Weekly review
          </CommandItem>
          <CommandItem onSelect={() => run(() => navigate({ to: "/goals" }))}>
            <Flag /> Goals
          </CommandItem>
          <CommandItem onSelect={() => run(() => navigate({ to: "/calendar" }))}>
            <CalendarDays /> Calendar
          </CommandItem>
          <CommandItem onSelect={() => run(() => navigate({ to: "/settings" }))}>
            <SettingsIcon /> Settings
          </CommandItem>
        </CommandGroup>

        {habits.data?.length ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Mark habit done today">
              {habits.data
                .filter((h) => !h.archived)
                .map((h) => (
                  <CommandItem
                    key={h.id}
                    value={`habit ${h.name}`}
                    onSelect={() =>
                      run(() => {
                        toggleHabit.mutate({ habitId: h.id, date: toISODate(new Date()) });
                        toast.success(`Toggled "${h.name}" for today`);
                      })
                    }
                  >
                    <CheckCircle2 /> {h.name}
                  </CommandItem>
                ))}
            </CommandGroup>
          </>
        ) : null}

        {tasks.data?.filter((t) => !t.done).length ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Complete a task">
              {tasks.data
                .filter((t) => !t.done)
                .slice(0, 8)
                .map((t) => (
                  <CommandItem
                    key={t.id}
                    value={`task ${t.title}`}
                    onSelect={() =>
                      run(() => {
                        updateTask.mutate({ id: t.id, patch: { done: true } });
                        toast.success(`Completed "${t.title}"`);
                      })
                    }
                  >
                    <CheckCircle2 /> {t.title}
                  </CommandItem>
                ))}
            </CommandGroup>
          </>
        ) : null}

        <CommandSeparator />
        <CommandGroup heading="Preferences">
          <CommandItem
            onSelect={() => run(() => setTheme(theme === "dark" ? "light" : "dark"))}
          >
            {theme === "dark" ? <Sun /> : <Moon />}
            Switch to {theme === "dark" ? "light" : "dark"} mode
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
