import { cn } from "@/lib/utils";
import type { WorkloadStatus } from "@/lib/workload/member-workload";
import { WORKLOAD_STATUS_LABELS } from "@/lib/workload/member-workload";

const statusStyles: Record<WorkloadStatus, string> = {
  available:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/35 dark:bg-emerald-500/15 dark:text-emerald-300",
  moderate:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/35 dark:bg-amber-500/15 dark:text-amber-300",
  at_capacity:
    "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-500/35 dark:bg-orange-500/15 dark:text-orange-300",
  overloaded:
    "border-red-200 bg-red-50 text-red-800 dark:border-red-500/35 dark:bg-red-500/15 dark:text-red-300",
};

export function WorkloadBadge({
  status,
  label,
  className,
}: {
  status: WorkloadStatus;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        statusStyles[status],
        className
      )}
    >
      {label ?? WORKLOAD_STATUS_LABELS[status]}
    </span>
  );
}
