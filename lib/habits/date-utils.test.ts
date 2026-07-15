import { describe, expect, it } from "vitest";
import {
  addDays,
  getMonthEnd,
  getMonthStart,
  getWeekStart,
  isoWeekday,
  parseDateKey,
  startOfDay,
  toDateKey,
} from "./date-utils";

describe("toDateKey / parseDateKey", () => {
  it("formats a date as YYYY-MM-DD", () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(toDateKey(new Date(2026, 11, 31))).toBe("2026-12-31");
  });

  it("round-trips through parseDateKey", () => {
    const key = "2026-07-04";
    const date = parseDateKey(key);
    expect(toDateKey(date)).toBe(key);
  });
});

describe("startOfDay", () => {
  it("zeroes out the time component without mutating the input", () => {
    const input = new Date(2026, 5, 15, 13, 45, 30);
    const result = startOfDay(input);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(input.getHours()).toBe(13); // original untouched
  });
});

describe("addDays", () => {
  it("adds positive and negative offsets", () => {
    const base = new Date(2026, 0, 31); // Jan 31
    expect(toDateKey(addDays(base, 1))).toBe("2026-02-01");
    expect(toDateKey(addDays(base, -31))).toBe("2025-12-31");
  });
});

describe("isoWeekday", () => {
  it("maps Sunday to 7 and Monday to 1", () => {
    expect(isoWeekday(new Date(2026, 6, 12))).toBe(7); // Sunday
    expect(isoWeekday(new Date(2026, 6, 13))).toBe(1); // Monday
    expect(isoWeekday(new Date(2026, 6, 17))).toBe(5); // Friday
  });
});

describe("getWeekStart", () => {
  it("returns the Monday of the current week", () => {
    const wednesday = new Date(2026, 6, 15); // Wed Jul 15 2026
    expect(toDateKey(getWeekStart(wednesday))).toBe("2026-07-13"); // Monday
  });

  it("returns the same day when given a Monday", () => {
    const monday = new Date(2026, 6, 13);
    expect(toDateKey(getWeekStart(monday))).toBe("2026-07-13");
  });
});

describe("getMonthStart / getMonthEnd", () => {
  it("returns the first and last day of the month", () => {
    const mid = new Date(2026, 1, 14); // Feb 2026 (28 days, not a leap year)
    expect(toDateKey(getMonthStart(mid))).toBe("2026-02-01");
    expect(toDateKey(getMonthEnd(mid))).toBe("2026-02-28");
  });

  it("handles a leap year correctly", () => {
    const mid = new Date(2028, 1, 10);
    expect(toDateKey(getMonthEnd(mid))).toBe("2028-02-29");
  });
});
