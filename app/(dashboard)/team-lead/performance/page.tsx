import { Trophy, Gauge, Award, AlertTriangle } from "lucide-react";
import { PageShell, EmptyState } from "@/components/layout/dashboard-shell";
import { StatCard, StatsGrid } from "@/components/admin/stat-card";
import { PeriodFilter } from "@/components/performance/period-filter";
import { TopPerformers } from "@/components/performance/top-performers";
import { PerformanceCard } from "@/components/performance/performance-card";
import { EntityAvatar } from "@/components/shared/entity-avatar";
import { getCurrentProfile } from "@/lib/auth/get-profile";
import { getTeamLeadPerformance } from "@/lib/data/performance";
import { isPerformancePeriod } from "@/lib/performance/periods";

export default async function TeamLeadPerformancePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const params = await searchParams;
  const period = isPerformancePeriod(params.period) ? params.period : "month";

  const data = await getTeamLeadPerformance(profile.id, period);

  return (
    <PageShell
      title="Performance"
      description="Fair, multi-factor scoring — quality, delivery, productivity, reliability & collaboration"
      action={<PeriodFilter current={data.period} />}
      stats={
        <StatsGrid>
          <StatCard
            label="Team Average"
            value={`${data.summary.avgOverall}`}
            subtext={`Out of 100 · ${data.periodLabel}`}
            icon={Gauge}
            accent="blue"
          />
          <StatCard
            label="Excellent"
            value={data.summary.excellent}
            subtext="Scoring 90+"
            icon={Award}
            accent="green"
          />
          <StatCard
            label="Tasks Completed"
            value={data.summary.completedTasks}
            subtext={`Across ${data.summary.members} members`}
            icon={Trophy}
            accent="purple"
          />
          <StatCard
            label="At Risk"
            value={data.summary.atRisk}
            subtext="Scoring below 60"
            icon={AlertTriangle}
            accent={data.summary.atRisk > 0 ? "red" : "teal"}
          />
        </StatsGrid>
      }
    >
      {data.entries.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No team members yet"
          description="Once members are added to your teams and start completing tasks, their performance will appear here."
        />
      ) : (
        <div className="space-y-8">
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-slate-700">
                Top Performers · {data.periodLabel}
              </h2>
            </div>
            <TopPerformers entries={data.entries} />
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-slate-700">
              Score Breakdown
            </h2>
            <div className="grid gap-4 xl:grid-cols-2">
              {data.entries.map((entry) => (
                <div key={entry.profile.id} className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    <EntityAvatar
                      name={entry.profile.full_name || entry.profile.email}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">
                        {entry.profile.full_name || entry.profile.email}
                      </p>
                      {entry.teamName && (
                        <p className="text-xs text-slate-400">
                          {entry.teamName}
                        </p>
                      )}
                    </div>
                  </div>
                  <PerformanceCard
                    performance={entry.performance}
                    periodLabel={data.periodLabel}
                  />
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </PageShell>
  );
}
