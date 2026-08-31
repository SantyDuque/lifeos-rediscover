import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Profile, Task, WeeklyReview } from "@/lib/types";

export const qk = {
  session: ["session"] as const,
  tasks: ["tasks"] as const,
  habits: ["habits"] as const,
  habit: (id: string) => ["habits", id] as const,
  entries: ["habit-entries"] as const,
  goals: ["goals"] as const,
  events: ["events"] as const,
  journal: ["journal"] as const,
  reviews: ["reviews"] as const,
};

export const sessionQuery = queryOptions({ queryKey: qk.session, queryFn: () => api.getSession() });
export const tasksQuery = queryOptions({ queryKey: qk.tasks, queryFn: () => api.listTasks() });
export const habitsQuery = queryOptions({ queryKey: qk.habits, queryFn: () => api.listHabits() });
export const entriesQuery = queryOptions({ queryKey: qk.entries, queryFn: () => api.listHabitEntries() });
export const goalsQuery = queryOptions({ queryKey: qk.goals, queryFn: () => api.listGoals() });
export const eventsQuery = queryOptions({ queryKey: qk.events, queryFn: () => api.listEvents() });
export const journalQuery = queryOptions({ queryKey: qk.journal, queryFn: () => api.listJournal() });
export const reviewsQuery = queryOptions({ queryKey: qk.reviews, queryFn: () => api.listReviews() });

export function useToggleHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { habitId: string; date: string; amount?: number }) =>
      api.toggleHabitEntry(input),
    onSettled: () => qc.invalidateQueries({ queryKey: qk.entries }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Task> }) => api.updateTask(id, patch),
    onSettled: () => qc.invalidateQueries({ queryKey: qk.tasks }),
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof api.createTask>[0]) => api.createTask(input),
    onSettled: () => qc.invalidateQueries({ queryKey: qk.tasks }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteTask(id),
    onSettled: () => qc.invalidateQueries({ queryKey: qk.tasks }),
  });
}

export function useSaveReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<WeeklyReview, "id">) => api.saveReview(input),
    onSettled: () => qc.invalidateQueries({ queryKey: qk.reviews }),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Profile>) => api.updateProfile(patch),
    onSettled: () => qc.invalidateQueries({ queryKey: qk.session }),
  });
}

export function useSignIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; password: string }) => api.signIn(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.session }),
  });
}

export function useSignOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.signOut(),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.session }),
  });
}
