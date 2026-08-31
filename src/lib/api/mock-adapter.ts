// In-memory adapter backed by the demo dataset. Swap this out for an HTTP adapter
// implementing the same interface and nothing in the UI needs to change.

import { format } from "date-fns";
import { ApiError, type LifeOsAdapter } from "./types";
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
import {
  buildEvents,
  buildHabitEntries,
  buildJournal,
  buildReviews,
  buildTasks,
  demoGoals,
  demoHabits,
  demoProfile,
} from "@/lib/demo/seed";

const LATENCY = [140, 420] as const;

function wait() {
  const ms = LATENCY[0] + Math.random() * (LATENCY[1] - LATENCY[0]);
  return new Promise((r) => setTimeout(r, ms));
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

const id = (p: string) => `${p}_${Math.random().toString(36).slice(2, 9)}`;

interface Store {
  signedIn: boolean;
  profile: Profile;
  tasks: Task[];
  habits: Habit[];
  entries: HabitEntry[];
  goals: Goal[];
  events: CalendarEvent[];
  journal: JournalEntry[];
  reviews: WeeklyReview[];
}

let store: Store | null = null;

function db(): Store {
  if (!store) {
    store = {
      signedIn: true,
      profile: clone(demoProfile),
      tasks: buildTasks(),
      habits: clone(demoHabits),
      entries: buildHabitEntries(),
      goals: clone(demoGoals),
      events: buildEvents(),
      journal: buildJournal(),
      reviews: buildReviews(),
    };
  }
  return store;
}

const inRange = (d: ISODate, range?: { from: ISODate; to: ISODate }) =>
  !range || (d >= range.from && d <= range.to);

export const mockAdapter: LifeOsAdapter = {
  async getSession(): Promise<AuthState> {
    await wait();
    return db().signedIn ? { status: "signed-in", profile: clone(db().profile) } : { status: "signed-out" };
  },
  async signIn({ email, password }) {
    await wait();
    if (!email.includes("@")) throw new ApiError("Enter a valid email address.", "validation");
    if (password.length < 6) throw new ApiError("That password doesn't look right.", "auth");
    db().signedIn = true;
    db().profile.email = email;
    return clone(db().profile);
  },
  async signOut() {
    await wait();
    db().signedIn = false;
  },
  async updateProfile(patch) {
    await wait();
    db().profile = { ...db().profile, ...patch };
    return clone(db().profile);
  },

  async listTasks() {
    await wait();
    return clone(db().tasks);
  },
  async createTask(input) {
    await wait();
    const task: Task = { ...input, id: id("t"), done: false, createdAt: new Date().toISOString() };
    db().tasks.unshift(task);
    return clone(task);
  },
  async updateTask(taskId, patch) {
    await wait();
    const t = db().tasks.find((x) => x.id === taskId);
    if (!t) throw new ApiError("That task no longer exists.", "not-found");
    Object.assign(t, patch);
    return clone(t);
  },
  async deleteTask(taskId) {
    await wait();
    db().tasks = db().tasks.filter((x) => x.id !== taskId);
  },

  async listHabits() {
    await wait();
    return clone(db().habits);
  },
  async getHabit(habitId) {
    await wait();
    const h = db().habits.find((x) => x.id === habitId);
    if (!h) throw new ApiError("Habit not found.", "not-found");
    return clone(h);
  },
  async createHabit(input) {
    await wait();
    const habit: Habit = { ...input, id: id("h"), archived: false, createdAt: new Date().toISOString() };
    db().habits.push(habit);
    return clone(habit);
  },
  async updateHabit(habitId, patch) {
    await wait();
    const h = db().habits.find((x) => x.id === habitId);
    if (!h) throw new ApiError("Habit not found.", "not-found");
    Object.assign(h, patch);
    return clone(h);
  },
  async listHabitEntries(range) {
    await wait();
    return clone(db().entries.filter((e) => inRange(e.date, range)));
  },
  async toggleHabitEntry({ habitId, date, amount }) {
    await wait();
    const existing = db().entries.find((e) => e.habitId === habitId && e.date === date);
    if (existing) {
      db().entries = db().entries.filter((e) => e !== existing);
    } else {
      db().entries.push({
        id: id("e"),
        habitId,
        date,
        completed: true,
        ...(amount !== undefined ? { amount } : {}),
      });
    }
    return clone(db().entries.filter((e) => e.habitId === habitId));
  },

  async listGoals() {
    await wait();
    return clone(db().goals);
  },
  async updateGoal(goalId, patch) {
    await wait();
    const g = db().goals.find((x) => x.id === goalId);
    if (!g) throw new ApiError("Goal not found.", "not-found");
    Object.assign(g, patch);
    return clone(g);
  },

  async listEvents(range) {
    await wait();
    return clone(
      db().events.filter((e) => inRange(format(new Date(e.start), "yyyy-MM-dd"), range)),
    );
  },

  async listJournal() {
    await wait();
    return clone(db().journal);
  },
  async upsertJournal(input) {
    await wait();
    const existing = db().journal.find((j) => j.date === input.date);
    if (existing) {
      Object.assign(existing, input);
      return clone(existing);
    }
    const entry: JournalEntry = { ...input, id: id("j") };
    db().journal.push(entry);
    return clone(entry);
  },
  async listReviews() {
    await wait();
    return clone(db().reviews);
  },
  async saveReview(input) {
    await wait();
    const existing = db().reviews.find((r) => r.weekStart === input.weekStart);
    if (existing) {
      Object.assign(existing, input);
      return clone(existing);
    }
    const review: WeeklyReview = { ...input, id: id("r") };
    db().reviews.unshift(review);
    return clone(review);
  },
};
