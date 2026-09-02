// Deterministic gym demo data, kept out of components so it can be deleted
// wholesale once a real training backend is wired up.

import { addDays, format, startOfWeek, subDays } from "date-fns";
import type {
  Exercise,
  MovementTrend,
  PersonalRecord,
  Readiness,
  SessionLog,
  TrainingDay,
  Workout,
} from "./types";

const iso = (d: Date) => format(d, "yyyy-MM-dd");

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function sets(count: number, reps: number, load: number | null): Exercise["sets"] {
  return Array.from({ length: count }, (_, i) => ({
    id: `s${i + 1}`,
    reps,
    load,
    done: false,
  }));
}

export function buildTodaysWorkout(now = new Date()): Workout {
  return {
    id: "w_today",
    name: "Upper Body — Strength",
    program: "Strength Cycle",
    block: "Week 4",
    date: iso(now),
    estimatedMinutes: 65,
    status: "planned",
    exercises: [
      { id: "e_bench", name: "Bench press", sets: sets(4, 6, 80), lastLoad: 77.5 },
      { id: "e_pullup", name: "Pull-up", sets: sets(4, 8, null), lastLoad: null, note: "Bodyweight" },
      { id: "e_ohp", name: "Overhead press", sets: sets(3, 8, 45), lastLoad: 45 },
      { id: "e_row", name: "Chest-supported row", sets: sets(3, 10, 60), lastLoad: 57.5 },
      { id: "e_lat", name: "Lateral raise", sets: sets(3, 12, 10), lastLoad: 10 },
    ],
  };
}

export function buildTrainingWeek(now = new Date()): TrainingDay[] {
  const start = startOfWeek(now, { weekStartsOn: 1 });
  const plan: { label: string; kind: TrainingDay["kind"] }[] = [
    { label: "Upper", kind: "strength" },
    { label: "Lower", kind: "strength" },
    { label: "Recovery", kind: "recovery" },
    { label: "Upper", kind: "strength" },
    { label: "Lower", kind: "strength" },
    { label: "Conditioning", kind: "conditioning" },
    { label: "Rest", kind: "rest" },
  ];
  return plan.map((p, i) => {
    const date = addDays(start, i);
    return {
      date: iso(date),
      weekday: format(date, "EEE").toUpperCase(),
      label: p.label,
      kind: p.kind,
      done: date < now && iso(date) !== iso(now) && p.kind !== "rest",
    };
  });
}

function history(seed: number, base: number, gain: number) {
  const rand = rng(seed);
  return Array.from({ length: 12 }, (_, i) => ({
    label: `w${i + 1}`,
    rate: Math.round((base + (gain * i) / 11 + (rand() - 0.5) * gain * 0.9) * 10) / 10,
  }));
}

export const movementTrends: MovementTrend[] = [
  {
    id: "m_bench",
    name: "Bench press",
    current: 102.5,
    change30d: 5,
    history: history(11, 94, 8.5),
  },
  { id: "m_squat", name: "Squat", current: 140, change30d: 2.5, history: history(22, 132, 8) },
  { id: "m_dead", name: "Deadlift", current: 170, change30d: 5, history: history(33, 160, 10) },
];

export function buildPersonalRecords(now = new Date()): PersonalRecord[] {
  return [
    { id: "pr_1", movement: "Bench press", load: 100, reps: 1, date: iso(subDays(now, 5)) },
    { id: "pr_2", movement: "Back squat", load: 140, reps: 1, date: iso(subDays(now, 14)) },
    { id: "pr_3", movement: "Deadlift", load: 170, reps: 1, date: iso(subDays(now, 21)) },
    { id: "pr_4", movement: "Overhead press", load: 60, reps: 3, date: iso(subDays(now, 33)) },
  ];
}

export const readiness: Readiness = {
  score: 82,
  sleepMinutes: 452,
  energy: 4,
  soreness: "low",
  guidance: "Good day for planned strength work.",
};

export function buildRecentSessions(now = new Date()): SessionLog[] {
  return [
    {
      id: "sl_1",
      date: iso(subDays(now, 1)),
      name: "Lower Body",
      durationMinutes: 58,
      exerciseCount: 5,
      totalSets: 18,
      volumeKg: 11240,
    },
    {
      id: "sl_2",
      date: iso(subDays(now, 3)),
      name: "Upper Body",
      durationMinutes: 64,
      exerciseCount: 6,
      totalSets: 21,
      volumeKg: 9380,
    },
    {
      id: "sl_3",
      date: iso(subDays(now, 5)),
      name: "Conditioning",
      durationMinutes: 42,
      exerciseCount: 4,
      totalSets: 12,
      volumeKg: 4120,
    },
  ];
}
