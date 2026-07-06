import { Trophy, Gauge, Award, AlertTriangle, UsersRound } from "lucide-react";
import { PageShell, EmptyState } from "@/components/layout/dashboard-shell";
import { StatCard, StatsGrid } from "@/components/admin/stat-card";
import { PeriodFilter } from "@/components/performance/period-filter";
import { TeamFilter } from "@/components/performance/team-filter";
import { TopPerformers } from "@/components/performance/top-performers";
import { TeamPerformanceTable } from "@/components/performance/team-performance-table";
import { PerformanceCard } from "@/components/performance/performance-card";
import { EntityAvatar } from "@/components/shared/entity-avatar";
import { RoleBadge } from "@/components/shared/badges";
import { getAdminPerformance } from "@/lib/data/performance";
import { getTeams } from "@/lib/data/queries";
import { isPerformancePeriod } from "@/lib/performance/periods";

export default async function AdminPerformancePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; team?: string }>;
}) {
  const params = await searchParams;
  const period = isPerformancePeriod(params.period) ? params.period : "month";
  const teamId = params.team || undefined;

  const [data, allTeams] = await Promise.all([
    getAdminPerformance(period, teamId),
    getTeams(),
  ]);

  const teamOptions = allTeams.map((t) => ({ id: t.id, name: t.name }));

  return (
    <PageShell
      title="Performance"
      description="Organization-wide scoring across all teams — quality, delivery, productivity, reliability & collaboration"
      action={
        <div className="flex flex-wrap items-center gap-2">
          <TeamFilter teams={teamOptions} currentTeamId={teamId} />
          <PeriodFilter current={data.period} />
        </div>
      }
      stats={
        <StatsGrid>
          <StatCard
            label="Org Average"
            value={`${data.summary.avgOverall}`}
            subtext={`Out of 100 · ${data.periodLabel}`}
            icon={Gauge}
            accent="blue"
          />
          <StatCard
            label="Teams"
            value={data.summary.teams}
            subtext={`${data.summary.members} members scored`}
            icon={UsersRound}
            accent="teal"
          />
          <StatCard
            label="Excellent"
            value={data.summary.excellent}
            subtext="Scoring 90+"
            icon={Award}
            accent="green"
          />
          <StatCard
            label="At Risk"
            value={data.summary.atRisk}
            subtext="Scoring below 60"
            icon={AlertTriangle}
            accent={data.summary.atRisk > 0 ? "red" : "purple"}
          />
        </StatsGrid>
      }
    >
      {data.entries.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No performance data yet"
          description="Add teams, assign members, and complete tasks to see organization-wide performance scores."
        />
      ) : (
        <div className="space-y-8">
          {!teamId && data.teamSummaries.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <UsersRound className="h-4 w-4 text-teal-500" />
                <h2 className="text-sm font-semibold text-slate-700">
                  Team Overview · {data.periodLabel}
                </h2>
              </div>
              <TeamPerformanceTable teams={data.teamSummaries} />
            </section>
          )}

          <section>
            <div className="mb-3 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-slate-700">
                Top Performers · {data.periodLabel}
                {teamId &&
                  ` · ${teamOptions.find((t) => t.id === teamId)?.name ?? "Team"}`}
              </h2>
            </div>
            <TopPerformers
              entries={data.entries}
              showRole
              profileHrefPrefix="/admin/users"
            />
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
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold text-slate-900">
                          {entry.profile.full_name || entry.profile.email}
                        </p>
                        <RoleBadge role={entry.profile.role} />
                      </div>
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
