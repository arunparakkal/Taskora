import { cn } from "@/lib/utils";
import {
  PERFORMANCE_LEVEL_LABELS,
  type PerformanceLevel,
} from "@/lib/performance/calculate-performance";

export const LEVEL_STYLES: Record<
  PerformanceLevel,
  { badge: string; text: string; bar: string; ring: string }
> = {
  excellent: {
    badge:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300",
    text: "text-emerald-600 dark:text-emerald-400",
    bar: "bg-emerald-500",
    ring: "text-emerald-500 dark:text-emerald-400",
  },
  very_good: {
    badge:
      "border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-500/30 dark:bg-teal-500/15 dark:text-teal-300",
    text: "text-teal-600 dark:text-teal-400",
    bar: "bg-teal-500",
    ring: "text-teal-500 dark:text-teal-400",
  },
  good: {
    badge:
      "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300",
    text: "text-blue-600 dark:text-blue-400",
    bar: "bg-blue-500",
    ring: "text-blue-500 dark:text-blue-400",
  },
  needs_improvement: {
    badge:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300",
    text: "text-amber-600 dark:text-amber-400",
    bar: "bg-amber-500",
    ring: "text-amber-500 dark:text-amber-400",
  },
  at_risk: {
    badge:
      "border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-300",
    text: "text-red-600 dark:text-red-400",
    bar: "bg-red-500",
    ring: "text-red-500 dark:text-red-400",
  },
};

export function PerformanceLevelBadge({
  level,
  className,
}: {
  level: PerformanceLevel;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        LEVEL_STYLES[level].badge,
        className
      )}
    >
      {PERFORMANCE_LEVEL_LABELS[level]}
    </span>
  );
}
