// The contract every backend adapter must satisfy. Components and hooks depend
// only on this interface, never on a concrete transport (REST, RPC, Supabase…).

import type {
  AuthState,
  CalendarEvent,
  Goal,
  Habit,
  HabitEntry,
  ISODate,
  JournalEntry,
  Profile,
  Task,
  WeeklyReview,
} from "@/lib/types";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly kind: "network" | "auth" | "not-found" | "server" | "validation" = "server",
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface LifeOsAdapter {
  // auth
  getSession(): Promise<AuthState>;
  signIn(input: { email: string; password: string }): Promise<Profile>;
  signOut(): Promise<void>;
  updateProfile(patch: Partial<Profile>): Promise<Profile>;

  // tasks
  listTasks(): Promise<Task[]>;
  createTask(input: Omit<Task, "id" | "createdAt" | "done">): Promise<Task>;
  updateTask(id: string, patch: Partial<Task>): Promise<Task>;
  deleteTask(id: string): Promise<void>;

  // habits
  listHabits(): Promise<Habit[]>;
  getHabit(id: string): Promise<Habit>;
  createHabit(input: Omit<Habit, "id" | "createdAt" | "archived">): Promise<Habit>;
  updateHabit(id: string, patch: Partial<Habit>): Promise<Habit>;
  listHabitEntries(range?: { from: ISODate; to: ISODate }): Promise<HabitEntry[]>;
  toggleHabitEntry(input: { habitId: string; date: ISODate; amount?: number }): Promise<HabitEntry[]>;

  // goals
  listGoals(): Promise<Goal[]>;
  updateGoal(id: string, patch: Partial<Goal>): Promise<Goal>;

  // calendar
  listEvents(range?: { from: ISODate; to: ISODate }): Promise<CalendarEvent[]>;

  // journal + reviews
  listJournal(): Promise<JournalEntry[]>;
  upsertJournal(input: Omit<JournalEntry, "id">): Promise<JournalEntry>;
  listReviews(): Promise<WeeklyReview[]>;
  saveReview(input: Omit<WeeklyReview, "id">): Promise<WeeklyReview>;
}
