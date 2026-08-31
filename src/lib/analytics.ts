// Pure derivation helpers. No data fetching, no components — easy to test and
// to replace with server-computed values later.

import { differenceInCalendarDays, format, isSameDay, parseISO, startOfWeek, subDays } from "date-fns";
import type { Habit, HabitEntry, JournalEntry, LifeArea, Task } from "@/lib/types";

export const toISODate = (d: Date) => format(d, "yyyy-MM-dd");

export function isScheduled(habit: Habit, date: Date) {
  return habit.daysOfWeek.includes(date.getDay());
}

export function isDone(entries: HabitEntry[], habitId: string, date: Date) {
  const key = toISODate(date);
  return entries.some((e) => e.habitId === habitId && e.date === key && e.completed);
}

export function currentStreak(habit: Habit, entries: HabitEntry[], from = new Date()) {
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const day = subDays(from, i);
    if (!isScheduled(habit, day)) continue;
    if (isDone(entries, habit.id, day)) streak++;
    else if (i === 0) continue; // today still open
    else break;
  }
  return streak;
}

export function longestStreak(habit: Habit, entries: HabitEntry[], days = 180) {
  let best = 0;
  let run = 0;
  for (let i = days; i >= 0; i--) {
    const day = subDays(new Date(), i);
    if (!isScheduled(habit, day)) continue;
    if (isDone(entries, habit.id, day)) {
      run++;
      best = Math.max(best, run);
    } else run = 0;
  }
  return best;
}

export function completionRate(habit: Habit, entries: HabitEntry[], days = 30) {
  let scheduled = 0;
  let done = 0;
  for (let i = days - 1; i >= 0; i--) {
    const day = subDays(new Date(), i);
    if (!isScheduled(habit, day)) continue;
    scheduled++;
    if (isDone(entries, habit.id, day)) done++;
  }
  return scheduled === 0 ? 0 : done / scheduled;
}

/** Daily completion across all habits, for the trend chart. */
export function dailyAdherence(habits: Habit[], entries: HabitEntry[], days = 60) {
  const out: { date: string; label: string; rate: number; done: number; scheduled: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = subDays(new Date(), i);
    const scheduledHabits = habits.filter((h) => !h.archived && isScheduled(h, day));
    const done = scheduledHabits.filter((h) => isDone(entries, h.id, day)).length;
    out.push({
      date: toISODate(day),
      label: format(day, "d MMM"),
      rate: scheduledHabits.length ? Math.round((done / scheduledHabits.length) * 100) : 0,
      done,
      scheduled: scheduledHabits.length,
    });
  }
  return out;
}

export function weeklyAdherence(habits: Habit[], entries: HabitEntry[], weeks = 12) {
  const daily = dailyAdherence(habits, entries, weeks * 7);
  const buckets = new Map<string, { done: number; scheduled: number }>();
  for (const d of daily) {
    const key = toISODate(startOfWeek(parseISO(d.date), { weekStartsOn: 1 }));
    const b = buckets.get(key) ?? { done: 0, scheduled: 0 };
    b.done += d.done;
    b.scheduled += d.scheduled;
    buckets.set(key, b);
  }
  return [...buckets.entries()].map(([weekStart, b]) => ({
    weekStart,
    label: format(parseISO(weekStart), "d MMM"),
    rate: b.scheduled ? Math.round((b.done / b.scheduled) * 100) : 0,
    done: b.done,
    scheduled: b.scheduled,
  }));
}

export function moodSeries(journal: JournalEntry[], days = 30) {
  const out: { date: string; label: string; mood: number | null; energy: number | null; focus: number | null }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = subDays(new Date(), i);
    const key = toISODate(day);
    const j = journal.find((x) => x.date === key);
    out.push({
      date: key,
      label: format(day, "d MMM"),
      mood: j ? j.mood : null,
      energy: j ? j.energy : null,
      focus: j ? j.focusMinutes : null,
    });
  }
  return out;
}

export function areaBalance(tasks: Task[], journal: JournalEntry[], habits: Habit[], entries: HabitEntry[]) {
  const areas: LifeArea[] = ["health", "mind", "craft", "people", "money", "home"];
  const recent = entries.filter((e) => differenceInCalendarDays(new Date(), parseISO(e.date)) <= 28);
  return areas.map((area) => {
    const habitIds = habits.filter((h) => h.area === area).map((h) => h.id);
    const hits = recent.filter((e) => habitIds.includes(e.habitId)).length;
    const taskHits = tasks.filter((t) => t.area === area && t.done).length;
    return { area, label: area[0]!.toUpperCase() + area.slice(1), value: hits + taskHits * 2, hits, taskHits };
  });
}

export function tasksForDay(tasks: Task[], date: Date) {
  return tasks.filter((t) => t.dueDate && isSameDay(parseISO(t.dueDate), date));
}

export function overdueTasks(tasks: Task[], date = new Date()) {
  return tasks.filter(
    (t) => !t.done && t.dueDate && differenceInCalendarDays(date, parseISO(t.dueDate)) > 0,
  );
}

export function summarizeTrend(values: number[]) {
  if (values.length < 4) return "Not enough history yet to read a trend.";
  const half = Math.floor(values.length / 2);
  const first = values.slice(0, half);
  const second = values.slice(half);
  const avg = (a: number[]) => a.reduce((s, v) => s + v, 0) / (a.length || 1);
  const delta = Math.round(avg(second) - avg(first));
  if (Math.abs(delta) < 3) return `Holding steady around ${Math.round(avg(second))}%.`;
  return delta > 0
    ? `Up ${delta} points versus the earlier stretch, now averaging ${Math.round(avg(second))}%.`
    : `Down ${Math.abs(delta)} points versus the earlier stretch, now averaging ${Math.round(avg(second))}%.`;
}
