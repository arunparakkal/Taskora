import Link from "next/link";
import {
  Calendar,
  CheckSquare,
  Clock,
  History,
  Mail,
  Timer,
  UsersRound,
} from "lucide-react";
import { StatCard, StatsGrid } from "@/components/admin/stat-card";
import { PriorityBadge, StatusBadge } from "@/components/shared/badges";
import { EntityAvatar } from "@/components/shared/entity-avatar";
import { WorkloadBadge } from "@/components/shared/workload-badge";
import { DataTableCard } from "@/components/shared/data-table-card";
import { TeamLeadMemberMetaEditor } from "@/components/members/team-lead-member-meta-editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TASK_STATUS_LABELS } from "@/lib/task-status";
import type { MemberProfileData } from "@/lib/data/member-profile";
import {
  CAPACITY_DISPLAY_LABELS,
  formatAverageCompletionDays,
  LEAVE_STATUS_LABELS,
} from "@/lib/member/profile-display";
import { formatDate, formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

function activityLabel(item: MemberProfileData["recentActivity"][number]) {
  if (item.action === "approved") return "Approved task";
  if (item.action === "changes_requested") return "Requested changes";
  if (item.action === "reopened") return "Reopened task";
  if (item.from_status && item.to_status) {
    const from =
      TASK_STATUS_LABELS[item.from_status as keyof typeof TASK_STATUS_LABELS] ??
      item.from_status;
    const to =
      TASK_STATUS_LABELS[item.to_status as keyof typeof TASK_STATUS_LABELS] ??
      item.to_status;
    return `${from} → ${to}`;
  }
  return "Updated task";
}

function CapacityBadge({ capacity }: { capacity: MemberProfileData["capacityDisplay"] }) {
  const styles = {
    available: "bg-emerald-100 text-emerald-800 border-emerald-200",
    busy: "bg-amber-100 text-amber-800 border-amber-200",
    overloaded: "bg-red-100 text-red-800 border-red-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
        styles[capacity]
      )}
    >
      {CAPACITY_DISPLAY_LABELS[capacity]}
    </span>
  );
}

function LeaveBadge({ status }: { status: MemberProfileData["leaveStatus"] }) {
  const styles = {
    active: "bg-slate-100 text-slate-700",
    on_leave: "bg-violet-100 text-violet-800",
    partial: "bg-sky-100 text-sky-800",
  };

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        styles[status]
      )}
    >
      {LEAVE_STATUS_LABELS[status]}
    </span>
  );
}

export function TeamLeadMemberProfileView({
  data,
  taskHrefPrefix = "/team-lead/tasks",
  editable = true,
}: {
  data: MemberProfileData;
  taskHrefPrefix?: string;
  editable?: boolean;
}) {
  const { profile, workload, taskStats } = data;
  const displayName = profile.full_name || profile.email;
  const sprintLabel =
    data.period === "week" ? "this sprint" : data.periodLabel.toLowerCase();

  return (
    <div className="space-y-8">
      {/* Profile */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <EntityAvatar
                name={displayName}
                src={profile.avatar_url}
                size="lg"
                className="h-16 w-16 text-lg"
              />
              <div className="min-w-0">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  {displayName}
                </h2>
                <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                  <Mail className="h-4 w-4 shrink-0" />
                  {profile.email}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Member since {formatDate(profile.created_at)}
                </p>
                {data.teams.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {data.teams.map((team) => (
                      <Badge
                        key={team.id}
                        variant="secondary"
                        className="gap-1 bg-slate-100 font-normal text-slate-700"
                      >
                        <UsersRound className="h-3 w-3" />
                        {team.name}
                      </Badge>
                    ))}
                  </div>
                )}
                {data.skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {data.skills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="outline"
                        className="border-blue-200 bg-blue-50 font-normal text-blue-800"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <CapacityBadge capacity={data.capacityDisplay} />
              <LeaveBadge status={data.leaveStatus} />
              <WorkloadBadge status={workload.status} />
            </div>
          </div>
        </CardContent>
      </Card>

      <StatsGrid>
        <StatCard
          label="Open tasks"
          value={taskStats.total - taskStats.done}
          subtext={`${taskStats.inProgress} in progress`}
          icon={CheckSquare}
          accent="blue"
        />
        <StatCard
          label="Completed"
          value={data.completedTasks.length}
          subtext={sprintLabel}
          icon={CheckSquare}
          accent="green"
        />
        <StatCard
          label="Avg completion"
          value={formatAverageCompletionDays(data.averageCompletionDays)}
          subtext="From created → done"
          icon={Timer}
          accent="purple"
        />
        <StatCard
          label="Overdue"
          value={taskStats.overdue}
          subtext={taskStats.overdue > 0 ? "Needs attention" : "On track"}
          icon={Clock}
          accent="orange"
        />
      </StatsGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Current workload */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Current workload
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Capacity</span>
              <CapacityBadge capacity={data.capacityDisplay} />
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Load points</span>
              <span className="font-medium text-slate-900 tabular-nums">
                {workload.loadPoints}
              </span>
            </div>
            {workload.teamAverageLoad > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-500">Team average</span>
                <span className="font-medium text-slate-900 tabular-nums">
                  {workload.teamAverageLoad}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Active tasks</span>
              <span className="font-medium text-slate-900">
                {workload.activeTasks}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Open tasks</span>
              <span className="font-medium text-slate-900">
                {workload.openTasks}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Due this week</span>
              <span className="font-medium text-slate-900">
                {workload.dueThisWeek}
              </span>
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
              <span className="text-slate-500">Workload status</span>
              <WorkloadBadge status={workload.status} />
            </div>
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
              {workload.recommendation}
            </p>
          </CardContent>
        </Card>

        {/* Skills & leave */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Skills & leave status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {editable ? (
              <TeamLeadMemberMetaEditor
                memberId={profile.id}
                initialSkills={data.skills}
                initialLeaveStatus={data.leaveStatus}
              />
            ) : (
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-slate-500">Skills</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {data.skills.length > 0
                      ? data.skills.join(", ")
                      : "None listed"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Leave status</p>
                  <div className="mt-1">
                    <LeaveBadge status={data.leaveStatus} />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active tasks */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Active tasks
        </h3>
        {data.activeTasks.length === 0 ? (
          <Card className="border-dashed border-slate-200">
            <CardContent className="py-8 text-center text-sm text-slate-500">
              No open tasks assigned right now.
            </CardContent>
          </Card>
        ) : (
          <DataTableCard total={data.activeTasks.length} scrollable={false}>
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                  <TableHead>Task</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead className="text-right">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.activeTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium text-slate-900">
                      {task.title}
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
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(task.due_date)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="link" className="h-auto p-0" asChild>
                        <Link href={`${taskHrefPrefix}/${task.id}`}>Open</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataTableCard>
        )}
      </div>

      {/* Completed this sprint */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Completed tasks {sprintLabel}
        </h3>
        {data.completedTasks.length === 0 ? (
          <Card className="border-dashed border-slate-200">
            <CardContent className="py-8 text-center text-sm text-slate-500">
              No tasks completed in the selected period.
            </CardContent>
          </Card>
        ) : (
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
        )}
      </div>

      {/* Recent activity */}
      <div>
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
          <History className="h-5 w-5 text-slate-500" />
          Recent activity
        </h3>
        {data.recentActivity.length === 0 ? (
          <Card className="border-dashed border-slate-200">
            <CardContent className="py-8 text-center text-sm text-slate-500">
              No task updates logged yet.
            </CardContent>
          </Card>
        ) : (
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <ul className="divide-y divide-slate-100">
                {data.recentActivity.map((item) => (
                  <li
                    key={item.id}
                    className="flex gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100">
                      <History className="h-4 w-4 text-slate-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-900">
                        <span className="font-medium">
                          {activityLabel(item)}
                        </span>
                        {" · "}
                        <span className="text-slate-600">{item.taskTitle}</span>
                      </p>
                      {item.projectName && (
                        <p className="text-xs text-slate-500">
                          [{item.projectKey}] {item.projectName}
                        </p>
                      )}
                      {item.comment && (
                        <p className="mt-1 text-xs text-amber-800">
                          {item.comment}
                        </p>
                      )}
                      <p className="mt-1 text-[11px] text-slate-400">
                        {formatDateTime(item.created_at)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
