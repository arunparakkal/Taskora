import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  CheckSquare,
  Clock,
  FolderKanban,
  Mail,
  UsersRound,
} from "lucide-react";
import { StatCard, StatsGrid } from "@/components/admin/stat-card";
import { PerformanceCard } from "@/components/performance/performance-card";
import { PriorityBadge, RoleBadge, StatusBadge } from "@/components/shared/badges";
import { EntityAvatar } from "@/components/shared/entity-avatar";
import { WorkloadBadge } from "@/components/shared/workload-badge";
import { DataTableCard } from "@/components/shared/data-table-card";
import { ProfileActivityPreview } from "@/components/members/profile-activity-preview";
import { ProjectProgressBar } from "@/components/projects/project-progress-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import type { MemberProfileData } from "@/lib/data/member-profile";

export function MemberProfileView({
  data,
  projectHrefPrefix,
  taskHrefPrefix,
  activityHref,
  activityLimit,
  showRole = true,
}: {
  data: MemberProfileData;
  projectHrefPrefix?: string;
  taskHrefPrefix?: string;
  activityHref?: string;
  activityLimit?: number;
  showRole?: boolean;
}) {
  const { profile, teams, performance, workload, taskStats, projects } = data;
  const displayName = profile.full_name || profile.email;

  return (
    <div className="space-y-8">
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <EntityAvatar name={displayName} size="lg" className="h-16 w-16 text-lg" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  {displayName}
                </h2>
                {showRole && <RoleBadge role={profile.role} />}
                <WorkloadBadge status={workload.status} />
              </div>
              <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                <Mail className="h-4 w-4 shrink-0" />
                {profile.email}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Member since {formatDate(profile.created_at)}
              </p>
              {teams.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {teams.map((team) => (
                    <Badge
                      key={team.id}
                      variant="secondary"
                      className="gap-1.5 bg-slate-100 font-normal text-slate-700"
                    >
                      <UsersRound className="h-3 w-3" />
                      {team.name}
                      {team.leadName && (
                        <span className="text-slate-400">· led by {team.leadName}</span>
                      )}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-center">
              <p className="text-3xl font-bold text-slate-900">
                {Math.round(performance.overall)}
              </p>
              <p className="text-xs text-slate-500">Performance score</p>
              <p className="mt-1 text-[11px] text-slate-400">{data.periodLabel}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <StatsGrid>
        <StatCard
          label="Total tasks"
          value={taskStats.total}
          subtext={`${taskStats.done} completed`}
          icon={CheckSquare}
          accent="blue"
        />
        <StatCard
          label="Open tasks"
          value={taskStats.total - taskStats.done}
          subtext={`${taskStats.inProgress} in progress`}
          icon={Clock}
          accent="purple"
        />
        <StatCard
          label="Projects"
          value={projects.length}
          subtext={`${taskStats.done} tasks completed`}
          icon={FolderKanban}
          accent="green"
        />
        <StatCard
          label="Overdue"
          value={taskStats.overdue}
          subtext={
            taskStats.overdue > 0 ? "Needs attention" : "All on track"
          }
          icon={CheckCircle2}
          accent="orange"
        />
      </StatsGrid>

      <div>
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Performance</h3>
        <PerformanceCard performance={performance} periodLabel={data.periodLabel} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Current workload</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Active tasks</span>
              <span className="font-medium text-slate-900">
                {workload.activeTasks}/{workload.capacity}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Open tasks</span>
              <span className="font-medium text-slate-900">{workload.openTasks}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Due this week</span>
              <span className="font-medium text-slate-900">{workload.dueThisWeek}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Overdue</span>
              <span
                className={
                  workload.overdueTasks > 0
                    ? "font-medium text-red-600"
                    : "font-medium text-slate-900"
                }
              >
                {workload.overdueTasks}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Availability</span>
              <span className="font-medium text-slate-900">
                {Math.max(workload.availability, 0)} slot
                {Math.max(workload.availability, 0) !== 1 ? "s" : ""} free
              </span>
            </div>
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
              {workload.recommendation}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Task breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <BreakdownTile label="To do" value={taskStats.todo} />
              <BreakdownTile label="In progress" value={taskStats.inProgress} />
              <BreakdownTile label="Review" value={taskStats.review} />
              <BreakdownTile label="Rework" value={taskStats.rework} />
              <BreakdownTile label="Done" value={taskStats.done} accent="green" />
              <BreakdownTile label="Overdue" value={taskStats.overdue} accent="red" />
            </div>
          </CardContent>
        </Card>
      </div>

      {projects.length > 0 && (
        <div>
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Projects</h3>
          <DataTableCard total={projects.length} scrollable={false}>
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                  <TableHead>Project</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead className="text-right">Assigned</TableHead>
                  <TableHead className="text-right">Done</TableHead>
                  <TableHead className="text-right">Open</TableHead>
                  <TableHead>Progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map(({ project, assignedTotal, completed, open }) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      {projectHrefPrefix ? (
                        <Link
                          href={`${projectHrefPrefix}/${project.id}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          [{project.key}] {project.name}
                        </Link>
                      ) : (
                        <span className="font-medium text-slate-900">
                          [{project.key}] {project.name}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {project.team?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {assignedTotal}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-green-700">
                      {completed}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {open}
                    </TableCell>
                    <TableCell className="min-w-[7rem]">
                      {assignedTotal > 0 ? (
                        <ProjectProgressBar
                          rate={Math.round((completed / assignedTotal) * 100)}
                          done={completed}
                          total={assignedTotal}
                          compact
                        />
                      ) : (
                        <span className="text-xs text-slate-400">No tasks yet</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataTableCard>
        </div>
      )}

      {data.activeTasks.length > 0 && (
        <div>
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Active tasks</h3>
          <DataTableCard total={data.activeTasks.length} scrollable={false}>
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                  <TableHead>Task</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.activeTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      {taskHrefPrefix ? (
                        <Link
                          href={`${taskHrefPrefix}/${task.id}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {task.title}
                        </Link>
                      ) : (
                        <span className="font-medium text-slate-900">{task.title}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      [{task.project?.key}] {task.project?.name}
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={task.priority} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={task.status} />
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {formatDate(task.due_date)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataTableCard>
        </div>
      )}

      {data.completedTasks.length > 0 && (
        <div>
          <h3 className="mb-4 text-lg font-semibold text-slate-900">
            Completed this period
          </h3>
          <DataTableCard total={data.completedTasks.length} scrollable={false}>
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                  <TableHead>Task</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead className="text-right">On time</TableHead>
                  <TableHead className="text-right">First pass</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.completedTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium text-slate-900">
                      {task.title}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {task.projectKey
                        ? `[${task.projectKey}] ${task.projectName ?? ""}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {formatDate(task.completedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      {task.onTime ? (
                        <span className="text-green-600">Yes</span>
                      ) : (
                        <span className="text-amber-600">Late</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {task.firstPass ? (
                        <span className="text-green-600">Yes</span>
                      ) : (
                        <span className="text-slate-400">No</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataTableCard>
        </div>
      )}

      {data.recentActivity.length > 0 && (
        <ProfileActivityPreview
          items={data.recentActivity}
          taskHrefPrefix={taskHrefPrefix}
          viewAllHref={activityHref}
          limit={activityLimit ?? (activityHref ? 6 : 10)}
        />
      )}
    </div>
  );
}

function BreakdownTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "green" | "red";
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5 text-center">
      <p
        className={
          accent === "red" && value > 0
            ? "text-xl font-bold text-red-600"
            : accent === "green"
              ? "text-xl font-bold text-green-700"
              : "text-xl font-bold text-slate-900"
        }
      >
        {value}
      </p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
