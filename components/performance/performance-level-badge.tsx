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
    badge: "border-emerald-200 bg-emerald-50 text-emerald-800",
    text: "text-emerald-600",
    bar: "bg-emerald-500",
    ring: "text-emerald-500",
  },
  very_good: {
    badge: "border-teal-200 bg-teal-50 text-teal-800",
    text: "text-teal-600",
    bar: "bg-teal-500",
    ring: "text-teal-500",
  },
  good: {
    badge: "border-blue-200 bg-blue-50 text-blue-800",
    text: "text-blue-600",
    bar: "bg-blue-500",
    ring: "text-blue-500",
  },
  needs_improvement: {
    badge: "border-amber-200 bg-amber-50 text-amber-800",
    text: "text-amber-600",
    bar: "bg-amber-500",
    ring: "text-amber-500",
  },
  at_risk: {
    badge: "border-red-200 bg-red-50 text-red-800",
    text: "text-red-600",
    bar: "bg-red-500",
    ring: "text-red-500",
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
