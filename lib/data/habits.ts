import { createClient } from "@/lib/supabase/server";
import {
  buildAchievementsGallery,
  buildHabitStreakDetails,
  buildHabitsDashboard,
  type HabitsDashboardData,
  type HabitStreakDetail,
  type HabitAchievement,
  type HabitWithCompletions,
} from "@/lib/habits/calculate-habits";
import type { Habit, HabitCompletion } from "@/types/database";

function defaultDaysForFrequency(
  frequency: Habit["frequency"]
): number[] {
  if (frequency === "weekdays") return [1, 2, 3, 4, 5];
  if (frequency === "weekly") return [1];
  return [1, 2, 3, 4, 5, 6, 7];
}

export async function getMemberHabitsWithCompletions(
  userId: string
): Promise<HabitWithCompletions[]> {
  const supabase = await createClient();

  const { data: habits, error: habitsError } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (habitsError) throw habitsError;
  if (!habits?.length) return [];

  const habitIds = habits.map((h) => h.id);
  const { data: completions, error: completionsError } = await supabase
    .from("habit_completions")
    .select("*")
    .eq("user_id", userId)
    .in("habit_id", habitIds)
    .order("completed_on", { ascending: false });

  if (completionsError) throw completionsError;

  const byHabit = new Map<string, HabitCompletion[]>();
  for (const completion of completions ?? []) {
    const list = byHabit.get(completion.habit_id) ?? [];
    list.push(completion);
    byHabit.set(completion.habit_id, list);
  }

  return habits.map((habit) => ({
    ...habit,
    completions: byHabit.get(habit.id) ?? [],
  }));
}

export async function getMemberHabitsDashboard(
  userId: string
): Promise<HabitsDashboardData> {
  const habits = await getMemberHabitsWithCompletions(userId);
  return buildHabitsDashboard(habits);
}

export async function getMemberHabitStreaks(
  userId: string
): Promise<HabitStreakDetail[]> {
  const habits = await getMemberHabitsWithCompletions(userId);
  return buildHabitStreakDetails(habits);
}

export async function getMemberAchievementsGallery(userId: string): Promise<{
  achievements: HabitAchievement[];
  unlockedCount: number;
  totalCount: number;
  overallStreak: number;
}> {
  const habits = await getMemberHabitsWithCompletions(userId);
  return buildAchievementsGallery(habits);
}

export function resolveHabitDays(
  frequency: Habit["frequency"],
  daysOfWeek?: number[]
): number[] {
  if (frequency === "custom" && daysOfWeek?.length) {
    return [...new Set(daysOfWeek)].sort((a, b) => a - b);
  }
  return defaultDaysForFrequency(frequency);
}
