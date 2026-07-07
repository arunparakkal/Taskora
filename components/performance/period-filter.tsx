"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  PERFORMANCE_PERIODS,
  type PerformancePeriod,
} from "@/lib/performance/periods";

export function PeriodFilter({ current }: { current: PerformancePeriod }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function select(period: PerformancePeriod) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", period);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
      {PERFORMANCE_PERIODS.map((p) => (
        <button
          key={p.value}
          type="button"
          onClick={() => select(p.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            current === p.value
              ? "bg-slate-900 text-white dark:bg-blue-600 dark:text-white"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
