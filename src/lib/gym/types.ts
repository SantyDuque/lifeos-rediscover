// Gym domain models. Frontend-owned, transport-agnostic — a future adapter maps
// whatever the backend returns into these shapes.

import type { ISODate } from "@/lib/types";

export type WorkoutStatus = "planned" | "in-progress" | "completed" | "rest";

export interface PlannedSet {
  id: string;
  reps: number;
  /** Target load in kg. Null means bodyweight. */
  load: number | null;
  done: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  sets: PlannedSet[];
  /** Reference load from the last time this movement was trained, in kg. */
  lastLoad: number | null;
  note?: string;
}

export interface Workout {
  id: string;
  name: string;
  program: string;
  block: string;
  date: ISODate;
  estimatedMinutes: number;
  status: WorkoutStatus;
  exercises: Exercise[];
  /** Present once completed. */
  durationMinutes?: number;
  note?: string;
}

export interface TrainingDay {
  date: ISODate;
  weekday: string;
  label: string;
  kind: "strength" | "conditioning" | "recovery" | "rest";
  done: boolean;
}

export interface MovementTrend {
  id: string;
  name: string;
  /** Estimated 1RM / working weight in kg. */
  current: number;
  /** Change over the last 30 days, in kg. */
  change30d: number;
  history: { label: string; rate: number }[];
}

export interface PersonalRecord {
  id: string;
  movement: string;
  load: number;
  reps: number;
  date: ISODate;
}

export interface Readiness {
  score: number; // 0–100
  sleepMinutes: number;
  energy: number; // 1–5
  soreness: "low" | "moderate" | "high";
  guidance: string;
}

export interface SessionLog {
  id: string;
  date: ISODate;
  name: string;
  durationMinutes: number;
  exerciseCount: number;
  totalSets: number;
  volumeKg: number;
}

export function totalSets(workout: Workout) {
  return workout.exercises.reduce((s, e) => s + e.sets.length, 0);
}

export function completedSets(workout: Workout) {
  return workout.exercises.reduce((s, e) => s + e.sets.filter((x) => x.done).length, 0);
}

export function volumeKg(workout: Workout) {
  return workout.exercises.reduce(
    (s, e) => s + e.sets.filter((x) => x.done).reduce((t, x) => t + (x.load ?? 0) * x.reps, 0),
    0,
  );
}

export function currentExercise(workout: Workout) {
  return workout.exercises.find((e) => e.sets.some((s) => !s.done)) ?? null;
}
