import { AlertCircle, CheckCircle2, ClipboardCheck, UserX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProjectSummary } from "@/lib/projects/summary";

const PIPELINE = [
  { key: "todo" as const, label: "To Do", color: "bg-slate-400" },
  { key: "inProgress" as const, label: "In Progress", color: "bg-blue-500" },
  { key: "review" as const, label: "Review", color: "bg-amber-500" },
  { key: "rework" as const, label: "Rework", color: "bg-orange-500" },
  { key: "done" as const, label: "Done", color: "bg-emerald-500" },
];

export function ProjectSummaryCard({ summary }: { summary: ProjectSummary }) {
  const hasAlerts = summary.overdue > 0 || summary.unassigned > 0;

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Project summary</CardTitle>
        <span className="text-sm font-semibold text-slate-700">
          {summary.completionRate}% complete
        </span>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <div className="mb-2 flex justify-between text-xs text-slate-500">
            <span>Progress</span>
            <span>
              {summary.done} of {summary.total} tasks done
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{
                width: `${summary.total > 0 ? Math.max(summary.completionRate, 2) : 0}%`,
              }}
            />
          </div>
        </div>

        <div className="space-y-2">
          {PIPELINE.map(({ key, label, color }) => {
            const count = summary[key];
            const pct =
              summary.total > 0
                ? Math.round((count / summary.total) * 100)
                : 0;
            return (
              <div key={key}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-slate-600">{label}</span>
                  <span className="font-medium tabular-nums text-slate-900">
                    {count}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${color}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-4">
          <MiniStat label="Open" value={summary.open} />
          <MiniStat
            label="In review"
            value={summary.review}
            icon={ClipboardCheck}
          />
          <MiniStat
            label="Overdue"
            value={summary.overdue}
            danger={summary.overdue > 0}
            icon={AlertCircle}
          />
          <MiniStat
            label="Unassigned"
            value={summary.unassigned}
            warn={summary.unassigned > 0}
            icon={UserX}
          />
        </div>

        {hasAlerts && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2 text-xs text-amber-800">
            {summary.overdue > 0 && (
              <span className="mr-3 inline-flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {summary.overdue} overdue
              </span>
            )}
            {summary.unassigned > 0 && (
              <span className="inline-flex items-center gap-1">
                <UserX className="h-3.5 w-3.5" />
                {summary.unassigned} unassigned
              </span>
            )}
          </div>
        )}

        {summary.total > 0 && summary.done === summary.total && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-xs font-medium text-emerald-800">
            <CheckCircle2 className="h-4 w-4" />
            All tasks completed for this project.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MiniStat({
  label,
  value,
  danger,
  warn,
  icon: Icon,
}: {
  label: string;
  value: number;
  danger?: boolean;
  warn?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div>
      <p
        className={
          danger
            ? "text-lg font-bold text-red-600"
            : warn
              ? "text-lg font-bold text-amber-600"
              : "text-lg font-bold text-slate-900"
        }
      >
        {value}
      </p>
      <p className="flex items-center gap-1 text-xs text-slate-400">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </p>
    </div>
  );
}
