export type PerformancePeriod = "week" | "month" | "quarter";

export const PERFORMANCE_PERIODS: {
  value: PerformancePeriod;
  label: string;
  days: number;
}[] = [
  { value: "week", label: "This Week", days: 7 },
  { value: "month", label: "This Month", days: 30 },
  { value: "quarter", label: "Last 3 Months", days: 90 },
];

export function isPerformancePeriod(value: unknown): value is PerformancePeriod {
  return value === "week" || value === "month" || value === "quarter";
}

export interface ResolvedPeriod {
  period: PerformancePeriod;
  label: string;
  start: Date;
  end: Date;
}

/**
 * Resolves a rolling period window ending "now".
 * Rolling windows keep the score meaningful without requiring stored snapshots.
 */
export function resolvePeriod(
  period: PerformancePeriod = "month"
): ResolvedPeriod {
  const def =
    PERFORMANCE_PERIODS.find((p) => p.value === period) ??
    PERFORMANCE_PERIODS[1];

  const end = new Date();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - def.days);

  return { period: def.value, label: def.label, start, end };
}
