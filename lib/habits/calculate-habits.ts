import type { Habit, HabitCompletion, HabitFrequency } from "@/types/database";
import {
  addDays,
  getMonthEnd,
  getMonthStart,
  getWeekStart,
  isoWeekday,
  parseDateKey,
  startOfDay,
  toDateKey,
} from "@/lib/habits/date-utils";
import { usesProgressCounter } from "@/lib/habits/constants";

export type HabitWithCompletions = Habit & {
  completions: HabitCompletion[];
};

export type WeeklyProgressPoint = {
  label: string;
  percent: number;
  dateKey: string;
};

export type MonthlyProgressPoint = {
  label: string;
  percent: number;
  dateKey: string;
};

export type HabitAchievement = {
  id: string;
  title: string;
  description: string;
  requirement: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  goal: number;
  category: "streak" | "consistency" | "milestone";
  unlockedAt: string | null;
};

export type HabitStreakDetail = {
  habitId: string;
  title: string;
  icon: string;
  color: string;
  frequency: HabitFrequency;
  currentStreak: number;
  bestStreak: number;
  progressPercent: number;
  status: "on_fire" | "active" | "at_risk" | "broken";
  weekDots: Array<{
    label: string;
    dateKey: string;
    scheduled: boolean;
    completed: boolean;
  }>;
  totalCompletions: number;
};

export type HabitsDashboardData = {
  habits: HabitWithCompletions[];
  todayKey: string;
  stats: {
    completedToday: number;
    scheduledToday: number;
    currentStreak: number;
    bestStreak: number;
    successRate: number;
    totalActive: number;
  };
  weeklyProgress: WeeklyProgressPoint[];
  weeklyAverage: number;
  monthlyProgress: MonthlyProgressPoint[];
  habitStreaks: Array<{
    habitId: string;
    title: string;
    icon: string;
    color: string;
    streak: number;
    progressPercent: number;
  }>;
  achievements: HabitAchievement[];
  insight: {
    message: string;
    percentChange: number | null;
  };
};

function isScheduledOn(habit: Habit, date: Date): boolean {
  const weekday = isoWeekday(date);
  if (habit.frequency === "daily") return true;
  if (habit.frequency === "weekdays") return weekday >= 1 && weekday <= 5;
  if (habit.frequency === "weekly") return weekday === 1;
  return habit.days_of_week.includes(weekday);
}

function completionMap(completions: HabitCompletion[]) {
  const map = new Map<string, HabitCompletion>();
  for (const c of completions) {
    map.set(c.completed_on, c);
  }
  return map;
}

function isCompletedOn(
  habit: HabitWithCompletions,
  dateKey: string
): boolean {
  const completion = habit.completions.find((c) => c.completed_on === dateKey);
  if (!completion) return false;
  if (usesProgressCounter(habit)) {
    return completion.current_value >= (habit.target_value ?? 1);
  }
  return true;
}

export function getHabitStreak(
  habit: HabitWithCompletions,
  today: Date = new Date()
): number {
  let streak = 0;
  let cursor = startOfDay(today);
  const todayKey = toDateKey(cursor);

  if (!isCompletedOn(habit, todayKey)) {
    cursor = addDays(cursor, -1);
  }

  for (let i = 0; i < 365; i++) {
    const key = toDateKey(cursor);
    if (!isScheduledOn(habit, cursor)) {
      cursor = addDays(cursor, -1);
      continue;
    }
    if (isCompletedOn(habit, key)) {
      streak++;
      cursor = addDays(cursor, -1);
    } else {
      break;
    }
  }

  return streak;
}

export function getBestStreak(habit: HabitWithCompletions): number {
  const keys = [...habit.completions]
    .map((c) => c.completed_on)
    .sort();
  if (keys.length === 0) return 0;

  let best = 0;
  let current = 0;
  let prevDate: Date | null = null;

  for (const key of keys) {
    const date = parseDateKey(key);
    if (!isScheduledOn(habit, date)) continue;
    if (!isCompletedOn(habit, key)) continue;

    if (prevDate) {
      let expected = addDays(prevDate, 1);
      while (!isScheduledOn(habit, expected) && expected <= date) {
        expected = addDays(expected, 1);
      }
      if (toDateKey(expected) === key) {
        current++;
      } else {
        current = 1;
      }
    } else {
      current = 1;
    }
    best = Math.max(best, current);
    prevDate = date;
  }

  return Math.max(best, getHabitStreak(habit));
}

function dayCompletionRate(
  habits: HabitWithCompletions[],
  date: Date
): number {
  const key = toDateKey(date);
  const scheduled = habits.filter(
    (h) => h.is_active && isScheduledOn(h, date)
  );
  if (scheduled.length === 0) return 0;
  const done = scheduled.filter((h) => isCompletedOn(h, key)).length;
  return Math.round((done / scheduled.length) * 100);
}

export function buildWeeklyProgress(
  habits: HabitWithCompletions[],
  today: Date = new Date()
): WeeklyProgressPoint[] {
  const weekStart = getWeekStart(today);
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const points: WeeklyProgressPoint[] = [];

  for (let i = 0; i < 7; i++) {
    const date = addDays(weekStart, i);
    points.push({
      label: labels[i],
      percent: dayCompletionRate(habits, date),
      dateKey: toDateKey(date),
    });
  }

  return points;
}

export function buildMonthlyProgress(
  habits: HabitWithCompletions[],
  today: Date = new Date()
): MonthlyProgressPoint[] {
  const monthStart = getMonthStart(today);
  const monthEnd = getMonthEnd(today);
  const points: MonthlyProgressPoint[] = [];
  let cursor = monthStart;

  while (cursor <= monthEnd) {
    points.push({
      label: formatMonthLabel(cursor),
      percent: dayCompletionRate(habits, cursor),
      dateKey: toDateKey(cursor),
    });
    cursor = addDays(cursor, 5);
  }

  if (points.length > 0) {
    const lastKey = toDateKey(monthEnd);
    if (points[points.length - 1].dateKey !== lastKey) {
      points.push({
        label: formatMonthLabel(monthEnd),
        percent: dayCompletionRate(habits, monthEnd),
        dateKey: lastKey,
      });
    }
  }

  return points;
}

function formatMonthLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function scheduledDaysInRange(
  habits: HabitWithCompletions[],
  start: Date,
  end: Date
): number {
  let count = 0;
  let cursor = startOfDay(start);
  const endDay = startOfDay(end);
  while (cursor <= endDay) {
    count += habits.filter(
      (h) => h.is_active && isScheduledOn(h, cursor)
    ).length;
    cursor = addDays(cursor, 1);
  }
  return count;
}

function completedDaysInRange(
  habits: HabitWithCompletions[],
  start: Date,
  end: Date
): number {
  let count = 0;
  let cursor = startOfDay(start);
  const endDay = startOfDay(end);
  while (cursor <= endDay) {
    const key = toDateKey(cursor);
    count += habits.filter(
      (h) => h.is_active && isScheduledOn(h, cursor) && isCompletedOn(h, key)
    ).length;
    cursor = addDays(cursor, 1);
  }
  return count;
}

export function getSuccessRate(
  habits: HabitWithCompletions[],
  start: Date,
  end: Date
): number {
  const scheduled = scheduledDaysInRange(habits, start, end);
  if (scheduled === 0) return 0;
  const completed = completedDaysInRange(habits, start, end);
  return Math.round((completed / scheduled) * 100);
}

export function getOverallStreak(
  habits: HabitWithCompletions[],
  today: Date = new Date()
): { current: number; best: number } {
  if (habits.length === 0) return { current: 0, best: 0 };

  let current = 0;
  let cursor = startOfDay(today);
  const todayKey = toDateKey(cursor);
  const anyScheduledToday = habits.some(
    (h) => h.is_active && isScheduledOn(h, cursor)
  );
  const allDoneToday =
    anyScheduledToday &&
    habits
      .filter((h) => h.is_active && isScheduledOn(h, cursor))
      .every((h) => isCompletedOn(h, todayKey));

  if (!allDoneToday && anyScheduledToday) {
    cursor = addDays(cursor, -1);
  } else if (!anyScheduledToday) {
    cursor = addDays(cursor, -1);
  }

  for (let i = 0; i < 365; i++) {
    const key = toDateKey(cursor);
    const scheduled = habits.filter(
      (h) => h.is_active && isScheduledOn(h, cursor)
    );
    if (scheduled.length === 0) {
      cursor = addDays(cursor, -1);
      continue;
    }
    const allDone = scheduled.every((h) => isCompletedOn(h, key));
    if (allDone) {
      current++;
      cursor = addDays(cursor, -1);
    } else {
      break;
    }
  }

  const best = Math.max(
    current,
    ...habits.map((h) => getBestStreak(h))
  );

  return { current, best };
}

export type AchievementDefinition = {
  id: string;
  title: string;
  description: string;
  requirement: string;
  icon: string;
  category: "streak" | "consistency" | "milestone";
  goal: number;
};

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    id: "first_habit",
    title: "First Step",
    description: "Create your first habit",
    requirement: "1 habit",
    icon: "target",
    category: "milestone",
    goal: 1,
  },
  {
    id: "hydrated",
    title: "Hydrated",
    description: "Drink water for 7 days in a row",
    requirement: "7 days",
    icon: "droplets",
    category: "streak",
    goal: 7,
  },
  {
    id: "strong_start",
    title: "Strong Start",
    description: "Exercise for 7 days in a row",
    requirement: "7 days",
    icon: "dumbbell",
    category: "streak",
    goal: 7,
  },
  {
    id: "bookworm",
    title: "Bookworm",
    description: "Read for 14 days in a row",
    requirement: "14 days",
    icon: "book-open",
    category: "streak",
    goal: 14,
  },
  {
    id: "consistent",
    title: "Consistent",
    description: "Complete all habits for 7 days",
    requirement: "7 days",
    icon: "brain",
    category: "consistency",
    goal: 7,
  },
  {
    id: "perfect_week",
    title: "Perfect Week",
    description: "Hit 100% completion every day this week",
    requirement: "7 days at 100%",
    icon: "star",
    category: "consistency",
    goal: 7,
  },
  {
    id: "month_master",
    title: "Month Master",
    description: "Keep an overall streak of 30 days",
    requirement: "30 days",
    icon: "flame",
    category: "streak",
    goal: 30,
  },
  {
    id: "habit_builder",
    title: "Habit Builder",
    description: "Have 5 active habits",
    requirement: "5 habits",
    icon: "heart",
    category: "milestone",
    goal: 5,
  },
  {
    id: "comeback",
    title: "Comeback",
    description: "Rebuild a streak to 3 days after a miss",
    requirement: "3-day restart",
    icon: "coffee",
    category: "milestone",
    goal: 3,
  },
  {
    id: "focused",
    title: "Deep Focus",
    description: "Complete a focus/deep-work habit 7 days",
    requirement: "7 days",
    icon: "brain",
    category: "streak",
    goal: 7,
  },
];

function countPerfectDaysThisWeek(
  habits: HabitWithCompletions[],
  today: Date
): number {
  const week = buildWeeklyProgress(habits, today);
  return week.filter((d) => d.percent === 100).length;
}

function hasComeback(habits: HabitWithCompletions[], today: Date): boolean {
  return habits.some((habit) => {
    const current = getHabitStreak(habit, today);
    const best = getBestStreak(habit);
    return current >= 3 && best > current;
  });
}

function resolveAchievementProgress(
  def: AchievementDefinition,
  habits: HabitWithCompletions[],
  overallStreak: number,
  today: Date
): { progress: number; unlocked: boolean } {
  const water = habits.find((h) => h.icon === "droplets");
  const exercise = habits.find((h) => h.icon === "dumbbell");
  const reading = habits.find((h) => h.icon === "book-open");
  const focus = habits.find(
    (h) => h.icon === "brain" || /deep work|focus/i.test(h.title)
  );

  switch (def.id) {
    case "first_habit":
      return {
        progress: Math.min(habits.length, def.goal),
        unlocked: habits.length >= 1,
      };
    case "hydrated": {
      const streak = water ? getHabitStreak(water, today) : 0;
      return { progress: Math.min(streak, def.goal), unlocked: streak >= def.goal };
    }
    case "strong_start": {
      const streak = exercise ? getHabitStreak(exercise, today) : 0;
      return { progress: Math.min(streak, def.goal), unlocked: streak >= def.goal };
    }
    case "bookworm": {
      const streak = reading ? getHabitStreak(reading, today) : 0;
      return { progress: Math.min(streak, def.goal), unlocked: streak >= def.goal };
    }
    case "consistent":
      return {
        progress: Math.min(overallStreak, def.goal),
        unlocked: overallStreak >= def.goal,
      };
    case "perfect_week": {
      const days = countPerfectDaysThisWeek(habits, today);
      return { progress: Math.min(days, def.goal), unlocked: days >= def.goal };
    }
    case "month_master":
      return {
        progress: Math.min(overallStreak, def.goal),
        unlocked: overallStreak >= def.goal,
      };
    case "habit_builder":
      return {
        progress: Math.min(habits.length, def.goal),
        unlocked: habits.length >= def.goal,
      };
    case "comeback": {
      const ok = hasComeback(habits, today);
      return { progress: ok ? def.goal : 0, unlocked: ok };
    }
    case "focused": {
      const streak = focus ? getHabitStreak(focus, today) : 0;
      return { progress: Math.min(streak, def.goal), unlocked: streak >= def.goal };
    }
    default:
      return { progress: 0, unlocked: false };
  }
}

export function resolveAchievements(
  habits: HabitWithCompletions[],
  overallStreak: number,
  today: Date = new Date()
): HabitAchievement[] {
  const todayKey = toDateKey(startOfDay(today));

  return ACHIEVEMENT_DEFINITIONS.map((def) => {
    const { progress, unlocked } = resolveAchievementProgress(
      def,
      habits,
      overallStreak,
      today
    );
    return {
      id: def.id,
      title: def.title,
      description: def.description,
      requirement: def.requirement,
      icon: def.icon,
      category: def.category,
      goal: def.goal,
      progress,
      unlocked,
      unlockedAt: unlocked ? todayKey : null,
    };
  });
}

function resolveStreakStatus(
  habit: HabitWithCompletions,
  currentStreak: number,
  today: Date
): HabitStreakDetail["status"] {
  if (currentStreak >= 7) return "on_fire";
  const todayKey = toDateKey(startOfDay(today));
  const scheduledToday = isScheduledOn(habit, today);
  if (scheduledToday && !isCompletedOn(habit, todayKey) && currentStreak > 0) {
    return "at_risk";
  }
  if (currentStreak === 0) return "broken";
  return "active";
}

function buildWeekDots(
  habit: HabitWithCompletions,
  today: Date
): HabitStreakDetail["weekDots"] {
  const weekStart = getWeekStart(today);
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return labels.map((label, i) => {
    const date = addDays(weekStart, i);
    const dateKey = toDateKey(date);
    const scheduled = isScheduledOn(habit, date);
    return {
      label,
      dateKey,
      scheduled,
      completed: scheduled && isCompletedOn(habit, dateKey),
    };
  });
}

export function buildHabitStreakDetails(
  habits: HabitWithCompletions[],
  today: Date = new Date()
): HabitStreakDetail[] {
  return habits
    .filter((h) => h.is_active)
    .map((habit) => {
      const currentStreak = getHabitStreak(habit, today);
      const bestStreak = getBestStreak(habit);
      const target = Math.max(bestStreak, 30);
      return {
        habitId: habit.id,
        title: habit.title,
        icon: habit.icon,
        color: habit.color,
        frequency: habit.frequency,
        currentStreak,
        bestStreak,
        progressPercent: Math.min(
          100,
          Math.round((currentStreak / target) * 100)
        ),
        status: resolveStreakStatus(habit, currentStreak, today),
        weekDots: buildWeekDots(habit, today),
        totalCompletions: habit.completions.length,
      };
    })
    .sort((a, b) => b.currentStreak - a.currentStreak);
}

export function buildAchievementsGallery(
  habits: HabitWithCompletions[],
  today: Date = new Date()
): {
  achievements: HabitAchievement[];
  unlockedCount: number;
  totalCount: number;
  overallStreak: number;
} {
  const active = habits.filter((h) => h.is_active);
  const { current } = getOverallStreak(active, today);
  const achievements = resolveAchievements(active, current, today);
  return {
    achievements,
    unlockedCount: achievements.filter((a) => a.unlocked).length,
    totalCount: achievements.length,
    overallStreak: current,
  };
}

export function buildHabitsDashboard(
  habits: HabitWithCompletions[],
  today: Date = new Date()
): HabitsDashboardData {
  const todayKey = toDateKey(startOfDay(today));
  const activeHabits = habits.filter((h) => h.is_active);
  const scheduledToday = activeHabits.filter((h) =>
    isScheduledOn(h, startOfDay(today))
  );
  const completedToday = scheduledToday.filter((h) =>
    isCompletedOn(h, todayKey)
  ).length;

  const { current, best } = getOverallStreak(activeHabits, today);
  const monthStart = getMonthStart(today);
  const monthEnd = getMonthEnd(today);
  const successRate = getSuccessRate(activeHabits, monthStart, monthEnd);

  const weeklyProgress = buildWeeklyProgress(activeHabits, today);
  const weeklyAverage =
    weeklyProgress.length > 0
      ? Math.round(
          weeklyProgress.reduce((s, p) => s + p.percent, 0) /
            weeklyProgress.length
        )
      : 0;

  const monthlyProgress = buildMonthlyProgress(activeHabits, today);

  const habitStreaks = buildHabitStreakDetails(activeHabits, today).map(
    (item) => ({
      habitId: item.habitId,
      title: item.title,
      icon: item.icon,
      color: item.color,
      streak: item.currentStreak,
      progressPercent: item.progressPercent,
    })
  );

  const achievements = resolveAchievements(activeHabits, current, today).slice(
    0,
    4
  );

  const prevMonthStart = getMonthStart(
    new Date(today.getFullYear(), today.getMonth() - 1, 1)
  );
  const prevMonthEnd = getMonthEnd(
    new Date(today.getFullYear(), today.getMonth() - 1, 1)
  );
  const thisMonthRate = successRate;
  const lastMonthRate = getSuccessRate(
    activeHabits,
    prevMonthStart,
    prevMonthEnd
  );
  const percentChange =
    lastMonthRate > 0
      ? Math.round(((thisMonthRate - lastMonthRate) / lastMonthRate) * 100)
      : thisMonthRate > 0
        ? 100
        : null;

  const insight =
    percentChange !== null && percentChange > 0
      ? {
          message: `Your consistency is improving! You completed ${percentChange}% more habits this month compared to last month.`,
          percentChange,
        }
      : percentChange !== null && percentChange < 0
        ? {
            message: `You completed ${Math.abs(percentChange)}% fewer habits this month. A small reset today can rebuild momentum.`,
            percentChange,
          }
        : {
            message:
              "Build your routine one day at a time. Complete today's habits to grow your streak.",
            percentChange: null,
          };

  return {
    habits: activeHabits,
    todayKey,
    stats: {
      completedToday,
      scheduledToday: scheduledToday.length,
      currentStreak: current,
      bestStreak: best,
      successRate,
      totalActive: activeHabits.length,
    },
    weeklyProgress,
    weeklyAverage,
    monthlyProgress,
    habitStreaks,
    achievements,
    insight,
  };
}

export function getHabitProgressLabel(
  habit: HabitWithCompletions,
  todayKey: string
): string {
  const completion = habit.completions.find((c) => c.completed_on === todayKey);
  if (usesProgressCounter(habit)) {
    const current = completion?.current_value ?? 0;
    const unit = habit.target_unit ?? "times";
    if (current >= (habit.target_value ?? 1)) return "Completed";
    return `${current}/${habit.target_value} ${unit}`;
  }
  return completion ? "Completed" : "Not completed";
}

export { isScheduledOn, isCompletedOn, completionMap };
