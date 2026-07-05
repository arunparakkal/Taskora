import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type {
  MemberPerformance,
  PerformanceLevel,
} from "@/lib/performance/calculate-performance";
import { LEVEL_STYLES } from "@/components/performance/performance-level-badge";
import { PerformanceLevelBadge } from "@/components/performance/performance-level-badge";

function levelFromPercent(percent: number): PerformanceLevel {
  if (percent >= 90) return "excellent";
  if (percent >= 80) return "very_good";
  if (percent >= 70) return "good";
  if (percent >= 60) return "needs_improvement";
  return "at_risk";
}

function PillarRow({ label, percent }: { label: string; percent: number }) {
  const style = LEVEL_STYLES[levelFromPercent(percent)];
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-600">{label}</span>
        <span className={cn("font-semibold tabular-nums", style.text)}>
          {Math.round(percent)}%
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn("h-full rounded-full transition-all", style.bar)}
          style={{ width: `${Math.max(percent, 2)}%` }}
        />
      </div>
    </div>
  );
}

function ScoreRing({
  overall,
  level,
}: {
  overall: number;
  level: PerformanceLevel;
}) {
  const style = LEVEL_STYLES[level];
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (overall / 100) * circumference;

  return (
    <div className="relative h-32 w-32 shrink-0">
      <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          className="text-slate-100"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn("transition-all", style.ring)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tracking-tight text-slate-900">
          {Math.round(overall)}
        </span>
        <span className="text-xs font-medium text-slate-400">/ 100</span>
      </div>
    </div>
  );
}

export function PerformanceCard({
  performance,
  periodLabel,
  className,
}: {
  performance: MemberPerformance;
  periodLabel?: string;
  className?: string;
}) {
  const { pillars, stats } = performance;

  return (
    <Card className={cn("border-slate-200", className)}>
      <CardContent className="p-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <div className="flex flex-col items-center gap-3">
            <ScoreRing overall={performance.overall} level={performance.level} />
            <PerformanceLevelBadge level={performance.level} />
            {periodLabel && (
              <span className="text-xs text-slate-400">{periodLabel}</span>
            )}
          </div>

          <div className="w-full flex-1 space-y-3">
            <PillarRow label="Quality" percent={pillars.quality.percent} />
            <PillarRow label="Delivery" percent={pillars.delivery.percent} />
            <PillarRow
              label="Productivity"
              percent={pillars.productivity.percent}
            />
            <PillarRow
              label="Reliability"
              percent={pillars.reliability.percent}
            />
            <PillarRow
              label="Collaboration"
              percent={pillars.collaboration.percent}
            />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-4">
          <Metric label="Completed" value={stats.completed} />
          <Metric label="On-time" value={`${stats.onTimeRate}%`} />
          <Metric label="First-pass" value={stats.firstPassApprovals} />
          <Metric
            label="Overdue open"
            value={stats.overdueOpen}
            danger={stats.overdueOpen > 0}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
  danger,
}: {
  label: string;
  value: number | string;
  danger?: boolean;
}) {
  return (
    <div className="text-center sm:text-left">
      <p
        className={cn(
          "text-lg font-bold tracking-tight",
          danger ? "text-red-600" : "text-slate-900"
        )}
      >
        {value}
      </p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}
