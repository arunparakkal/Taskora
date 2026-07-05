import { cn } from "@/lib/utils";

export function ProjectProgressBar({
  rate,
  done,
  total,
  compact = false,
  className,
}: {
  rate: number;
  done?: number;
  total?: number;
  compact?: boolean;
  className?: string;
}) {
  const pct = Math.min(100, Math.max(0, rate));

  return (
    <div className={cn("min-w-0", className)}>
      <div className="mb-1 flex items-center justify-between gap-2 text-xs">
        <span className="font-medium text-slate-700">{pct}%</span>
        {!compact && total != null && (
          <span className="text-slate-400">
            {done ?? 0}/{total} done
          </span>
        )}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${total && total > 0 ? Math.max(pct, 2) : 0}%` }}
        />
      </div>
    </div>
  );
}
