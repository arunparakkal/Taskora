import { describe, expect, it } from "vitest";
import type { Habit, HabitCompletion } from "@/types/database";
import {
  buildWeeklyProgress,
  getBestStreak,
  getHabitStreak,
  getOverallStreak,
  getSuccessRate,
  isCompletedOn,
  isScheduledOn,
  type HabitWithCompletions,
} from "./calculate-habits";

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: "habit-1",
    user_id: "user-1",
    title: "Drink water",
    description: null,
    icon: "droplets",
    color: "blue",
    frequency: "daily",
    days_of_week: [1, 2, 3, 4, 5, 6, 7],
    target_value: null,
    target_unit: null,
    is_active: true,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeCompletion(
  habitId: string,
  completedOn: string,
  overrides: Partial<HabitCompletion> = {}
): HabitCompletion {
  return {
    id: `${habitId}-${completedOn}`,
    habit_id: habitId,
    user_id: "user-1",
    completed_on: completedOn,
    current_value: 1,
    created_at: `${completedOn}T00:00:00.000Z`,
    ...overrides,
  };
}

function withCompletions(
  habit: Habit,
  completions: HabitCompletion[]
): HabitWithCompletions {
  return { ...habit, completions };
}

describe("isScheduledOn", () => {
  it("schedules daily habits every day", () => {
    const habit = makeHabit({ frequency: "daily" });
    expect(isScheduledOn(habit, new Date(2026, 6, 12))).toBe(true); // Sunday
  });

  it("schedules weekdays habits Mon-Fri only", () => {
    const habit = makeHabit({ frequency: "weekdays" });
    expect(isScheduledOn(habit, new Date(2026, 6, 13))).toBe(true); // Monday
    expect(isScheduledOn(habit, new Date(2026, 6, 12))).toBe(false); // Sunday
    expect(isScheduledOn(habit, new Date(2026, 6, 11))).toBe(false); // Saturday
  });

  it("schedules weekly habits on Monday only", () => {
    const habit = makeHabit({ frequency: "weekly" });
    expect(isScheduledOn(habit, new Date(2026, 6, 13))).toBe(true); // Monday
    expect(isScheduledOn(habit, new Date(2026, 6, 14))).toBe(false); // Tuesday
  });

  it("schedules custom habits on the configured days_of_week", () => {
    const habit = makeHabit({ frequency: "custom", days_of_week: [2, 4] }); // Tue, Thu
    expect(isScheduledOn(habit, new Date(2026, 6, 14))).toBe(true); // Tuesday
    expect(isScheduledOn(habit, new Date(2026, 6, 13))).toBe(false); // Monday
  });
});

describe("isCompletedOn", () => {
  it("treats a simple completion record as done", () => {
    const habit = withCompletions(makeHabit(), [makeCompletion("habit-1", "2026-07-13")]);
    expect(isCompletedOn(habit, "2026-07-13")).toBe(true);
    expect(isCompletedOn(habit, "2026-07-14")).toBe(false);
  });

  it("requires reaching the target for progress-counter habits", () => {
    const habit = withCompletions(
      makeHabit({ target_value: 8, target_unit: "glasses" }),
      [makeCompletion("habit-1", "2026-07-13", { current_value: 5 })]
    );
    expect(isCompletedOn(habit, "2026-07-13")).toBe(false);

    const completeHabit = withCompletions(
      makeHabit({ target_value: 8, target_unit: "glasses" }),
      [makeCompletion("habit-1", "2026-07-13", { current_value: 8 })]
    );
    expect(isCompletedOn(completeHabit, "2026-07-13")).toBe(true);
  });
});

describe("getHabitStreak", () => {
  it("counts consecutive completed days ending today", () => {
    const today = new Date(2026, 6, 15); // Wednesday
    const completions = [
      makeCompletion("habit-1", "2026-07-15"),
      makeCompletion("habit-1", "2026-07-14"),
      makeCompletion("habit-1", "2026-07-13"),
    ];
    const habit = withCompletions(makeHabit(), completions);
    expect(getHabitStreak(habit, today)).toBe(3);
  });

  it("falls back to yesterday when today is not yet completed", () => {
    const today = new Date(2026, 6, 15);
    const completions = [
      makeCompletion("habit-1", "2026-07-14"),
      makeCompletion("habit-1", "2026-07-13"),
    ];
    const habit = withCompletions(makeHabit(), completions);
    expect(getHabitStreak(habit, today)).toBe(2);
  });

  it("resets to zero after a missed scheduled day", () => {
    const today = new Date(2026, 6, 15);
    const completions = [
      makeCompletion("habit-1", "2026-07-15"),
      // 07-14 missed
      makeCompletion("habit-1", "2026-07-13"),
    ];
    const habit = withCompletions(makeHabit(), completions);
    expect(getHabitStreak(habit, today)).toBe(1);
  });

  it("skips unscheduled days for weekdays-only habits", () => {
    const today = new Date(2026, 6, 13); // Monday
    const completions = [
      makeCompletion("habit-1", "2026-07-13"), // Mon
      makeCompletion("habit-1", "2026-07-10"), // Fri
      makeCompletion("habit-1", "2026-07-09"), // Thu
    ];
    const habit = withCompletions(makeHabit({ frequency: "weekdays" }), completions);
    // Sat/Sun (07-11, 07-12) aren't scheduled, so the streak should bridge them.
    expect(getHabitStreak(habit, today)).toBe(3);
  });
});

describe("getBestStreak", () => {
  it("finds the longest historical run, even if it isn't the current one", () => {
    const completions = [
      makeCompletion("habit-1", "2026-07-01"),
      makeCompletion("habit-1", "2026-07-02"),
      makeCompletion("habit-1", "2026-07-03"),
      makeCompletion("habit-1", "2026-07-04"),
      makeCompletion("habit-1", "2026-07-05"),
      // gap
      makeCompletion("habit-1", "2026-07-10"),
    ];
    const habit = withCompletions(makeHabit(), completions);
    expect(getBestStreak(habit)).toBe(5);
  });

  it("returns 0 for a habit with no completions", () => {
    const habit = withCompletions(makeHabit(), []);
    expect(getBestStreak(habit)).toBe(0);
  });
});

describe("getSuccessRate", () => {
  it("returns 100 when every scheduled day was completed", () => {
    const habit = withCompletions(makeHabit(), [
      makeCompletion("habit-1", "2026-07-13"),
      makeCompletion("habit-1", "2026-07-14"),
    ]);
    const rate = getSuccessRate(
      [habit],
      new Date(2026, 6, 13),
      new Date(2026, 6, 14)
    );
    expect(rate).toBe(100);
  });

  it("returns 0 when there are no scheduled days in range", () => {
    const habit = withCompletions(makeHabit({ frequency: "weekly" }), []);
    // Tue-Wed range has no Mondays scheduled
    const rate = getSuccessRate(
      [habit],
      new Date(2026, 6, 14),
      new Date(2026, 6, 15)
    );
    expect(rate).toBe(0);
  });

  it("computes a partial completion percentage", () => {
    const habit = withCompletions(makeHabit(), [
      makeCompletion("habit-1", "2026-07-13"),
    ]);
    // 4 scheduled days (daily), 1 completed => 25%
    const rate = getSuccessRate(
      [habit],
      new Date(2026, 6, 13),
      new Date(2026, 6, 16)
    );
    expect(rate).toBe(25);
  });
});

describe("getOverallStreak", () => {
  it("returns zero for an empty habit list", () => {
    expect(getOverallStreak([], new Date(2026, 6, 15))).toEqual({
      current: 0,
      best: 0,
    });
  });

  it("requires all active habits to be completed on a given day to count it", () => {
    const today = new Date(2026, 6, 15);
    const habitA = withCompletions(makeHabit({ id: "a" }), [
      makeCompletion("a", "2026-07-15"),
      makeCompletion("a", "2026-07-14"),
    ]);
    const habitB = withCompletions(makeHabit({ id: "b" }), [
      makeCompletion("b", "2026-07-15"),
      // missing 07-14
    ]);

    const { current } = getOverallStreak([habitA, habitB], today);
    expect(current).toBe(1); // only today counts; yesterday habitB was incomplete
  });
});

describe("buildWeeklyProgress", () => {
  it("returns 7 points labeled Mon..Sun with completion percentages", () => {
    const habit = withCompletions(makeHabit(), [
      makeCompletion("habit-1", "2026-07-13"), // Monday
    ]);
    const points = buildWeeklyProgress([habit], new Date(2026, 6, 15));
    expect(points).toHaveLength(7);
    expect(points.map((p) => p.label)).toEqual([
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
      "Sun",
    ]);
    expect(points[0].percent).toBe(100); // Monday completed
    expect(points[1].percent).toBe(0); // Tuesday not completed
  });

  it("ignores inactive habits", () => {
    const habit = withCompletions(makeHabit({ is_active: false }), [
      makeCompletion("habit-1", "2026-07-13"),
    ]);
    const points = buildWeeklyProgress([habit], new Date(2026, 6, 15));
    expect(points.every((p) => p.percent === 0)).toBe(true);
  });
});
