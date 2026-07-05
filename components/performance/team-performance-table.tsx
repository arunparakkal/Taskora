import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { PerformanceLevelBadge } from "@/components/performance/performance-level-badge";
import { LEVEL_STYLES } from "@/components/performance/performance-level-badge";
import type { TeamPerformanceSummary } from "@/lib/data/performance";

function levelFromScore(score: number) {
  if (score >= 90) return "excellent" as const;
  if (score >= 80) return "very_good" as const;
  if (score >= 70) return "good" as const;
  if (score >= 60) return "needs_improvement" as const;
  return "at_risk" as const;
}

export function TeamPerformanceTable({
  teams,
}: {
  teams: TeamPerformanceSummary[];
}) {
  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
              <TableHead>Team</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Avg score</TableHead>
              <TableHead>Level</TableHead>
              <TableHead className="text-right">Excellent</TableHead>
              <TableHead className="text-right">At risk</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.map((team) => {
              const level = levelFromScore(team.avgOverall);
              const style = LEVEL_STYLES[level];
              return (
                <TableRow key={team.teamId}>
                  <TableCell className="font-semibold text-slate-900">
                    {team.teamName}
                  </TableCell>
                  <TableCell className="tabular-nums text-slate-600">
                    {team.memberCount}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "text-base font-bold tabular-nums",
                        style.text
                      )}
                    >
                      {team.avgOverall}
                    </span>
                    <span className="text-xs text-slate-400"> / 100</span>
                  </TableCell>
                  <TableCell>
                    <PerformanceLevelBadge level={level} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-emerald-600">
                    {team.excellent}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right tabular-nums",
                      team.atRisk > 0 ? "text-red-600" : "text-slate-400"
                    )}
                  >
                    {team.atRisk}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
