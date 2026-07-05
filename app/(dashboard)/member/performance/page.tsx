import { Gauge } from "lucide-react";
import { PageShell } from "@/components/layout/dashboard-shell";
import { PeriodFilter } from "@/components/performance/period-filter";
import { PerformanceCard } from "@/components/performance/performance-card";
import { getCurrentProfile } from "@/lib/auth/get-profile";
import { getMemberSelfPerformance } from "@/lib/data/performance";
import { isPerformancePeriod } from "@/lib/performance/periods";
import { PERFORMANCE_LEVEL_LABELS } from "@/lib/performance/calculate-performance";

export default async function MemberPerformancePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const params = await searchParams;
  const period = isPerformancePeriod(params.period) ? params.period : "month";

  const { performance, periodLabel } = await getMemberSelfPerformance(
    profile.id,
    period
  );

  return (
    <PageShell
      title="My Performance"
      description="Your score reflects quality, delivery, productivity, reliability and collaboration"
      action={<PeriodFilter current={period} />}
    >
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
          <p className="flex items-center gap-2 font-medium text-slate-700">
            <Gauge className="h-4 w-4 text-blue-500" />
            You are rated{" "}
            <span className="font-semibold">
              {PERFORMANCE_LEVEL_LABELS[performance.level]}
            </span>{" "}
            for {periodLabel.toLowerCase()}.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            High-quality work accepted on the first review has the greatest
            positive impact. Finishing early gives only a small bonus.
          </p>
        </div>
        <PerformanceCard performance={performance} periodLabel={periodLabel} />
      </div>
    </PageShell>
  );
}
