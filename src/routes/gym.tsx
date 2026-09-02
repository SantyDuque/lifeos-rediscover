import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { AppShell } from "@/components/lifeos/app-shell";
import { AuthGate } from "@/components/lifeos/auth-gate";
import { TodaysWorkout } from "@/components/gym/todays-workout";
import {
  PersonalRecords,
  ReadinessPanel,
  RecentPerformance,
  RecentSessions,
  TrainingWeek,
} from "@/components/gym/gym-panels";
import {
  buildPersonalRecords,
  buildRecentSessions,
  buildTodaysWorkout,
  buildTrainingWeek,
  movementTrends,
  readiness,
} from "@/lib/gym/demo";
import { volumeKg, type Workout } from "@/lib/gym/types";

export const Route = createFileRoute("/gym")({
  head: () => ({
    meta: [
      { title: "Gym — LifeOS" },
      {
        name: "description",
        content:
          "Today's training session, the week's schedule, readiness and lift progress in one calm workspace.",
      },
      { property: "og:title", content: "Gym — LifeOS" },
      {
        property: "og:description",
        content: "Plan the session, log the sets, follow the lifts over time.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GymPage,
});

function GymPage() {
  return (
    <AuthGate>
      <AppShell title="Gym" subtitle="Train with intention, track the work">
        <GymBody />
      </AppShell>
    </AuthGate>
  );
}

function GymBody() {
  const now = useMemo(() => new Date(), []);
  const todayISO = format(now, "yyyy-MM-dd");
  const [workout, setWorkout] = useState<Workout>(() => buildTodaysWorkout(now));
  const [elapsed, setElapsed] = useState(0);

  const week = useMemo(() => buildTrainingWeek(now), [now]);
  const records = useMemo(() => buildPersonalRecords(now), [now]);
  const sessions = useMemo(() => buildRecentSessions(now), [now]);

  useEffect(() => {
    if (workout.status !== "in-progress") return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [workout.status]);

  const start = () => {
    setElapsed(0);
    setWorkout((w) => ({ ...w, status: "in-progress" }));
  };

  const finish = () =>
    setWorkout((w) => ({
      ...w,
      status: "completed",
      durationMinutes: Math.max(1, Math.round(elapsed / 60)),
      note: `Session logged — ${Math.round(volumeKg(w)).toLocaleString()} kg of total volume.`,
    }));

  const toggleSet = (exerciseId: string, setId: string) =>
    setWorkout((w) => ({
      ...w,
      exercises: w.exercises.map((e) =>
        e.id === exerciseId
          ? { ...e, sets: e.sets.map((s) => (s.id === setId ? { ...s, done: !s.done } : s)) }
          : e,
      ),
    }));

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
      {/* Priority on mobile: workout, readiness, week, performance, sessions, PRs */}
      <div className="order-1 lg:contents">
        <div className="space-y-4 lg:order-1">
          <TodaysWorkout
            workout={workout}
            elapsedSeconds={elapsed}
            onStart={start}
            onFinish={finish}
            onToggleSet={toggleSet}
          />
          <div className="hidden lg:block">
            <RecentSessions sessions={sessions} />
          </div>
        </div>

        <div className="mt-4 space-y-4 lg:order-2 lg:mt-0">
          <ReadinessPanel readiness={readiness} />
          <TrainingWeek days={week} todayISO={todayISO} />
          <RecentPerformance trends={movementTrends} />
          <div className="lg:hidden">
            <RecentSessions sessions={sessions} />
          </div>
          <PersonalRecords records={records} />
        </div>
      </div>
    </div>
  );
}
