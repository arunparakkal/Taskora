import type { HabitFrequency } from "@/types/database";

export const HABIT_ICON_OPTIONS = [
  { value: "droplets", label: "Water" },
  { value: "dumbbell", label: "Exercise" },
  { value: "book-open", label: "Reading" },
  { value: "brain", label: "Focus" },
  { value: "target", label: "Goal" },
  { value: "coffee", label: "Morning" },
  { value: "moon", label: "Sleep" },
  { value: "heart", label: "Health" },
  { value: "pen-line", label: "Journal" },
  { value: "code", label: "Coding" },
] as const;

export const HABIT_COLOR_OPTIONS = [
  {
    value: "violet",
    label: "Purple",
    bar: "bg-violet-500",
    soft: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
  },
  {
    value: "emerald",
    label: "Green",
    bar: "bg-emerald-500",
    soft: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  },
  {
    value: "blue",
    label: "Blue",
    bar: "bg-blue-500",
    soft: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  },
  {
    value: "orange",
    label: "Orange",
    bar: "bg-orange-500",
    soft: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
  },
  {
    value: "amber",
    label: "Amber",
    bar: "bg-amber-500",
    soft: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  },
  {
    value: "rose",
    label: "Rose",
    bar: "bg-rose-500",
    soft: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
  },
] as const;

export const HABIT_FREQUENCY_OPTIONS: Array<{
  value: HabitFrequency;
  label: string;
}> = [
  { value: "daily", label: "Daily" },
  { value: "weekdays", label: "Weekdays" },
  { value: "weekly", label: "Weekly" },
  { value: "custom", label: "Custom" },
];

export const HABIT_TEMPLATES = [
  {
    title: "Drink 8 glasses of water",
    icon: "droplets",
    color: "blue",
    frequency: "daily" as const,
    target_value: 8,
    target_unit: "glasses",
  },
  {
    title: "30 min exercise",
    icon: "dumbbell",
    color: "orange",
    frequency: "daily" as const,
  },
  {
    title: "Read for 20 minutes",
    icon: "book-open",
    color: "violet",
    frequency: "daily" as const,
  },
  {
    title: "Review assigned tasks",
    icon: "target",
    color: "emerald",
    frequency: "weekdays" as const,
  },
  {
    title: "Update task status before EOD",
    icon: "pen-line",
    color: "amber",
    frequency: "weekdays" as const,
  },
  {
    title: "Deep work session",
    icon: "brain",
    color: "violet",
    frequency: "daily" as const,
  },
];

export function getHabitColorClasses(color: string) {
  return (
    HABIT_COLOR_OPTIONS.find((c) => c.value === color) ?? HABIT_COLOR_OPTIONS[0]
  );
}

/** Units that should increment per click (e.g. glasses). Time units are checkbox-only. */
const COUNTABLE_UNITS = new Set(["glasses", "times", "reps", "pages"]);

export function isTimeBasedUnit(unit: string | null | undefined): boolean {
  const value = (unit ?? "").trim().toLowerCase();
  if (!value) return false;
  return (
    value.includes("minute") ||
    value.includes("min") ||
    value.includes("hour") ||
    value.includes("hr") ||
    value.includes("session")
  );
}

/**
 * Progress-counter habits (water glasses) vs one-click complete habits (exercise/reading).
 * Time-related units like "minutes" / "hours" never use +1-per-click.
 */
export function usesProgressCounter(habit: {
  target_value: number | null;
  target_unit: string | null;
}): boolean {
  if (!habit.target_value || habit.target_value <= 1) return false;
  const unit = (habit.target_unit ?? "").trim().toLowerCase();
  if (!unit) return true;
  if (isTimeBasedUnit(unit)) return false;
  return COUNTABLE_UNITS.has(unit) || !unit.includes("time");
}
