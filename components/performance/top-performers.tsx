import Link from "next/link";
import { Card } from "@/components/ui/card";
import { EntityAvatar } from "@/components/shared/entity-avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { RoleBadge } from "@/components/shared/badges";
import { PerformanceLevelBadge } from "@/components/performance/performance-level-badge";
import { LEVEL_STYLES } from "@/components/performance/performance-level-badge";
import type { MemberPerformanceEntry } from "@/lib/data/performance";

const RANK_STYLES = [
  "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
  "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
];

export function TopPerformers({
  entries,
  showRole = false,
  profileHrefPrefix,
}: {
  entries: MemberPerformanceEntry[];
  showRole?: boolean;
  profileHrefPrefix?: string;
}) {
  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
              <TableHead className="w-14">Rank</TableHead>
              <TableHead>Member</TableHead>
              {showRole && <TableHead>Role</TableHead>}
              <TableHead>Score</TableHead>
              <TableHead>Level</TableHead>
              <TableHead className="text-right">Completion</TableHead>
              <TableHead className="text-right">On-time</TableHead>
              <TableHead className="text-right">Quality</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry, index) => {
              const p = entry.performance;
              const style = LEVEL_STYLES[p.level];
              return (
                <TableRow key={entry.profile.id}>
                  <TableCell>
                    <span
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                        RANK_STYLES[index] ?? "bg-slate-100 text-slate-500"
                      )}
                    >
                      {index + 1}
                    </span>
                  </TableCell>
                  <TableCell>
                    {profileHrefPrefix ? (
                      <Link
                        href={`${profileHrefPrefix}/${entry.profile.id}`}
                        className="flex items-center gap-3 rounded-lg transition-colors hover:opacity-90"
                      >
                        <EntityAvatar
                          name={entry.profile.full_name || entry.profile.email}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 hover:text-blue-600">
                            {entry.profile.full_name || entry.profile.email}
                          </p>
                          {entry.teamName && (
                            <p className="text-xs text-slate-400">
                              {entry.teamName}
                            </p>
                          )}
                        </div>
                      </Link>
                    ) : (
                      <div className="flex items-center gap-3">
                        <EntityAvatar
                          name={entry.profile.full_name || entry.profile.email}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">
                            {entry.profile.full_name || entry.profile.email}
                          </p>
                          {entry.teamName && (
                            <p className="text-xs text-slate-400">
                              {entry.teamName}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </TableCell>
                  {showRole && (
                    <TableCell>
                      <RoleBadge role={entry.profile.role} />
                    </TableCell>
                  )}
                  <TableCell>
                    <span
                      className={cn(
                        "text-base font-bold tabular-nums",
                        style.text
                      )}
                    >
                      {Math.round(p.overall)}
                    </span>
                    <span className="text-xs text-slate-400"> / 100</span>
                  </TableCell>
                  <TableCell>
                    <PerformanceLevelBadge level={p.level} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-slate-600">
                    {p.stats.completionRate}%
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-slate-600">
                    {p.stats.onTimeRate}%
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-slate-600">
                    {Math.round(p.pillars.quality.percent)}%
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
