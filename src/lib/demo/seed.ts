// Demo dataset. Deliberately kept out of components so it can be deleted wholesale
// once a real backend adapter is wired up.

import { addDays, format, startOfWeek, subDays } from "date-fns";
import type {
  CalendarEvent,
  Goal,
  Habit,
  HabitEntry,
  JournalEntry,
  Profile,
  Task,
  WeeklyReview,
} from "@/lib/types";

/** Deterministic PRNG so charts look irregular but never flicker between renders. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const iso = (d: Date) => format(d, "yyyy-MM-dd");

export const today = () => new Date();

export const demoProfile: Profile = {
  id: "u_1",
  name: "Santiago Rivas",
  email: "santiago@lifeos.app",
  timezone: "Europe/Madrid",
  weekStartsOn: 1,
  theme: "dark",
  reducedMotion: false,
  dailyReviewTime: "21:30",
};

export const demoHabits: Habit[] = [
  {
    id: "h_move",
    name: "Move 30 minutes",
    description: "Anything that raises the heart rate — run, climb, long walk.",
    area: "health",
    cadence: "daily",
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    targetPerWeek: 6,
    unit: "min",
    targetAmount: 30,
    createdAt: "2026-01-08T08:00:00.000Z",
    archived: false,
  },
  {
    id: "h_read",
    name: "Read before bed",
    description: "Paper only. 20 pages is a good night.",
    area: "mind",
    cadence: "daily",
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    targetPerWeek: 5,
    unit: "pages",
    targetAmount: 20,
    createdAt: "2026-01-08T08:00:00.000Z",
    archived: false,
  },
  {
    id: "h_deep",
    name: "Deep work block",
    description: "Ninety uninterrupted minutes on the hardest thing.",
    area: "craft",
    cadence: "weekdays",
    daysOfWeek: [1, 2, 3, 4, 5],
    targetPerWeek: 5,
    unit: "min",
    targetAmount: 90,
    createdAt: "2026-02-02T08:00:00.000Z",
    archived: false,
  },
  {
    id: "h_call",
    name: "Reach out to someone",
    description: "A call, not a text.",
    area: "people",
    cadence: "custom",
    daysOfWeek: [2, 4, 0],
    targetPerWeek: 3,
    createdAt: "2026-03-11T08:00:00.000Z",
    archived: false,
  },
  {
    id: "h_ledger",
    name: "Log spending",
    area: "money",
    cadence: "daily",
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    targetPerWeek: 7,
    createdAt: "2026-01-20T08:00:00.000Z",
    archived: false,
  },
  {
    id: "h_reset",
    name: "Ten-minute tidy",
    area: "home",
    cadence: "custom",
    daysOfWeek: [1, 3, 5],
    targetPerWeek: 3,
    createdAt: "2026-04-06T08:00:00.000Z",
    archived: false,
  },
];

/** Per-habit base adherence and volatility — produces uneven, human-looking streaks. */
const habitProfile: Record<string, { base: number; drift: number; seed: number }> = {
  h_move: { base: 0.74, drift: 0.22, seed: 11 },
  h_read: { base: 0.63, drift: 0.3, seed: 23 },
  h_deep: { base: 0.68, drift: 0.26, seed: 37 },
  h_call: { base: 0.55, drift: 0.32, seed: 51 },
  h_ledger: { base: 0.82, drift: 0.16, seed: 67 },
  h_reset: { base: 0.48, drift: 0.34, seed: 83 },
};

export function buildHabitEntries(days = 140): HabitEntry[] {
  const now = today();
  const out: HabitEntry[] = [];
  for (const habit of demoHabits) {
    const p = habitProfile[habit.id] ?? { base: 0.6, drift: 0.25, seed: 7 };
    const rand = rng(p.seed);
    let momentum = 0;
    for (let i = days; i >= 0; i--) {
      const date = subDays(now, i);
      const dow = date.getDay();
      if (!habit.daysOfWeek.includes(dow)) continue;
      // slow seasonal wave + momentum so good and bad stretches cluster
      const wave = Math.sin((days - i) / 17) * 0.12;
      const chance = p.base + wave + momentum * p.drift;
      const hit = rand() < chance;
      momentum = Math.max(-1, Math.min(1, momentum + (hit ? 0.22 : -0.34)));
      if (!hit) continue;
      const amount = habit.targetAmount
        ? Math.round(habit.targetAmount * (0.6 + rand() * 0.8))
        : undefined;
      out.push({
        id: `e_${habit.id}_${iso(date)}`,
        habitId: habit.id,
        date: iso(date),
        completed: true,
        ...(amount !== undefined ? { amount } : {}),
      });
    }
  }
  return out;
}

export function buildJournal(days = 140): JournalEntry[] {
  const rand = rng(404);
  const now = today();
  const out: JournalEntry[] = [];
  for (let i = days; i >= 0; i--) {
    const date = subDays(now, i);
    const dow = date.getDay();
    if (rand() < 0.12) continue; // missed days — partial data is realistic
    const weekend = dow === 0 || dow === 6;
    const mood = Math.max(1, Math.min(5, Math.round(3.2 + Math.sin(i / 9) * 0.9 + (rand() - 0.5) * 1.6)));
    const energy = Math.max(1, Math.min(5, Math.round(mood - 0.3 + (rand() - 0.5) * 1.4)));
    const focusMinutes = weekend
      ? Math.round(rand() * 90)
      : Math.round(60 + rand() * 210 + (mood - 3) * 25);
    out.push({
      id: `j_${iso(date)}`,
      date: iso(date),
      mood,
      energy,
      focusMinutes: Math.max(0, focusMinutes),
    });
  }
  return out;
}

export function buildTasks(): Task[] {
  const now = today();
  const d = (n: number) => iso(addDays(now, n));
  return [
    {
      id: "t_1",
      title: "Rewrite the onboarding email sequence",
      notes: "Three emails, plain text, no marketing voice.",
      area: "craft",
      priority: "high",
      done: false,
      dueDate: d(0),
      estimateMinutes: 90,
      goalId: "g_ship",
      createdAt: "2026-08-28T09:00:00.000Z",
    },
    {
      id: "t_2",
      title: "Physio exercises",
      area: "health",
      priority: "normal",
      done: true,
      dueDate: d(0),
      estimateMinutes: 20,
      createdAt: "2026-08-30T07:10:00.000Z",
    },
    {
      id: "t_3",
      title: "Call Marta about the summer trip",
      area: "people",
      priority: "normal",
      done: false,
      dueDate: d(0),
      estimateMinutes: 25,
      createdAt: "2026-08-29T18:40:00.000Z",
    },
    {
      id: "t_4",
      title: "Reconcile August card statement",
      area: "money",
      priority: "high",
      done: false,
      dueDate: d(0),
      estimateMinutes: 40,
      goalId: "g_runway",
      createdAt: "2026-08-25T11:00:00.000Z",
    },
    {
      id: "t_5",
      title: "Fix the kitchen tap washer",
      area: "home",
      priority: "low",
      done: false,
      dueDate: d(1),
      estimateMinutes: 30,
      createdAt: "2026-08-22T20:00:00.000Z",
    },
    {
      id: "t_6",
      title: "Draft chapter outline",
      area: "mind",
      priority: "normal",
      done: false,
      dueDate: d(2),
      estimateMinutes: 60,
      goalId: "g_book",
      createdAt: "2026-08-20T08:30:00.000Z",
    },
    {
      id: "t_7",
      title: "Book dentist appointment",
      area: "health",
      priority: "low",
      done: false,
      dueDate: d(-2),
      estimateMinutes: 10,
      createdAt: "2026-08-12T13:00:00.000Z",
    },
    {
      id: "t_8",
      title: "Review pull requests",
      area: "craft",
      priority: "normal",
      done: true,
      dueDate: d(-1),
      estimateMinutes: 45,
      createdAt: "2026-08-30T09:00:00.000Z",
    },
    {
      id: "t_9",
      title: "Plan September budget",
      area: "money",
      priority: "normal",
      done: false,
      dueDate: d(3),
      goalId: "g_runway",
      createdAt: "2026-08-27T15:00:00.000Z",
    },
  ];
}

export const demoGoals: Goal[] = [
  {
    id: "g_ship",
    title: "Ship LifeOS v1 to twenty real users",
    why: "Feedback from strangers is the only signal that counts.",
    area: "craft",
    status: "active",
    targetDate: "2026-11-15",
    progress: 62,
    milestones: [
      { id: "m1", title: "Core data model settled", done: true },
      { id: "m2", title: "Weekly review loop working", done: true },
      { id: "m3", title: "Private beta invites out", done: false },
      { id: "m4", title: "Twenty active accounts", done: false },
    ],
  },
  {
    id: "g_runway",
    title: "Twelve months of runway saved",
    why: "Room to make slow decisions.",
    area: "money",
    status: "active",
    targetDate: "2027-03-01",
    progress: 41,
    milestones: [
      { id: "m1", title: "Fixed costs mapped", done: true },
      { id: "m2", title: "Automatic monthly transfer", done: true },
      { id: "m3", title: "Six months banked", done: false },
    ],
  },
  {
    id: "g_half",
    title: "Run a half marathon under 1:45",
    area: "health",
    status: "active",
    targetDate: "2026-10-25",
    progress: 78,
    milestones: [
      { id: "m1", title: "Base mileage rebuilt", done: true },
      { id: "m2", title: "18 km long run", done: true },
      { id: "m3", title: "Tune-up 10 km race", done: true },
      { id: "m4", title: "Race day", done: false },
    ],
  },
  {
    id: "g_book",
    title: "Finish the first draft",
    area: "mind",
    status: "paused",
    targetDate: null,
    progress: 24,
    milestones: [
      { id: "m1", title: "Outline all chapters", done: false },
      { id: "m2", title: "30k words", done: false },
    ],
  },
  {
    id: "g_spain",
    title: "Two unhurried weeks with family",
    area: "people",
    status: "done",
    targetDate: "2026-08-10",
    progress: 100,
    milestones: [{ id: "m1", title: "Booked and taken", done: true }],
  },
];

export function buildEvents(): CalendarEvent[] {
  const now = today();
  const at = (dayOffset: number, h: number, m = 0) => {
    const d = addDays(now, dayOffset);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };
  return [
    { id: "c_1", title: "Deep work — onboarding rewrite", area: "craft", start: at(0, 9), end: at(0, 11) },
    { id: "c_2", title: "Standup", area: "craft", start: at(0, 11, 15), end: at(0, 11, 30) },
    { id: "c_3", title: "Long run, river loop", area: "health", start: at(0, 18), end: at(0, 19, 15) },
    { id: "c_4", title: "Dinner with Marta", area: "people", start: at(1, 20, 30), end: at(1, 22, 30), location: "La Cava" },
    { id: "c_5", title: "Physio", area: "health", start: at(2, 8, 30), end: at(2, 9, 15) },
    { id: "c_6", title: "Budget review", area: "money", start: at(2, 17), end: at(2, 18) },
    { id: "c_7", title: "Design critique", area: "craft", start: at(3, 15), end: at(3, 16) },
    { id: "c_8", title: "Weekly review", area: "mind", start: at(5, 19), end: at(5, 20) },
    { id: "c_9", title: "Track session", area: "health", start: at(-1, 7), end: at(-1, 8, 15) },
    { id: "c_10", title: "Plumber", area: "home", start: at(4, 10), end: at(4, 11) },
  ];
}

export function buildReviews(): WeeklyReview[] {
  const now = today();
  const w = (n: number) => iso(startOfWeek(subDays(now, n * 7), { weekStartsOn: 1 }));
  return [
    {
      id: "r_1",
      weekStart: w(1),
      wins: "Held every deep work block except Friday. The half-marathon pace run felt easy.",
      friction: "Evenings leaked into email. Reading collapsed after Wednesday.",
      nextFocus: "Phone out of the bedroom. Protect Friday morning.",
      submittedAt: "2026-08-30T20:12:00.000Z",
    },
    {
      id: "r_2",
      weekStart: w(2),
      wins: "Finally reconciled July. Two long calls with people I'd been avoiding.",
      friction: "Three days of poor sleep wiped out the middle of the week.",
      nextFocus: "Lights out by 23:30, no exceptions.",
      submittedAt: "2026-08-23T19:40:00.000Z",
    },
  ];
}
