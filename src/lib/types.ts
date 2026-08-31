// Domain models for LifeOS.
// These are frontend-owned types. Adapters are responsible for mapping whatever
// the real backend returns into these shapes — components never see raw payloads.

export type ISODate = string; // "2026-08-31"
export type ISODateTime = string; // "2026-08-31T09:00:00.000Z"

export type LifeArea = "health" | "mind" | "craft" | "people" | "money" | "home";

export const LIFE_AREAS: { id: LifeArea; label: string }[] = [
  { id: "health", label: "Health" },
  { id: "mind", label: "Mind" },
  { id: "craft", label: "Craft" },
  { id: "people", label: "People" },
  { id: "money", label: "Money" },
  { id: "home", label: "Home" },
];

export type Priority = "low" | "normal" | "high";

export interface Task {
  id: string;
  title: string;
  notes?: string;
  area: LifeArea;
  priority: Priority;
  done: boolean;
  dueDate: ISODate | null;
  estimateMinutes?: number;
  goalId?: string | null;
  createdAt: ISODateTime;
}

export type HabitCadence = "daily" | "weekdays" | "custom";

export interface Habit {
  id: string;
  name: string;
  description?: string;
  area: LifeArea;
  cadence: HabitCadence;
  /** 0 = Sunday … 6 = Saturday. Used when cadence is custom/weekdays. */
  daysOfWeek: number[];
  targetPerWeek: number;
  /** Optional quantified target, e.g. 30 minutes. */
  unit?: string;
  targetAmount?: number;
  createdAt: ISODateTime;
  archived: boolean;
}

export interface HabitEntry {
  id: string;
  habitId: string;
  date: ISODate;
  completed: boolean;
  amount?: number;
  note?: string;
}

export type GoalStatus = "active" | "paused" | "done";

export interface Goal {
  id: string;
  title: string;
  why?: string;
  area: LifeArea;
  status: GoalStatus;
  targetDate: ISODate | null;
  /** 0–100, derived upstream so the UI never guesses. */
  progress: number;
  milestones: { id: string; title: string; done: boolean }[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  area: LifeArea;
  start: ISODateTime;
  end: ISODateTime;
  location?: string;
  allDay?: boolean;
}

export interface JournalEntry {
  id: string;
  date: ISODate;
  mood: number; // 1–5
  energy: number; // 1–5
  focusMinutes: number;
  note?: string;
}

export interface WeeklyReview {
  id: string;
  weekStart: ISODate;
  wins: string;
  friction: string;
  nextFocus: string;
  submittedAt: ISODateTime | null;
}

export interface WeekSummary {
  weekStart: ISODate;
  habitCompletionRate: number; // 0–1
  tasksCompleted: number;
  tasksPlanned: number;
  focusMinutes: number;
  avgMood: number;
  avgEnergy: number;
  areaMinutes: Record<LifeArea, number>;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  timezone: string;
  weekStartsOn: 0 | 1;
  theme: "dark" | "light";
  reducedMotion: boolean;
  dailyReviewTime: string; // "21:00"
}

export type AuthState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "signed-in"; profile: Profile };
