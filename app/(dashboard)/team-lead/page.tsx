import Link from "next/link";
import {
  UsersRound,
  FolderKanban,
  CheckSquare,
  AlertCircle,
  UserX,
  ClipboardCheck,
  Plus,
} from "lucide-react";
import { PageShell } from "@/components/layout/dashboard-shell";
import { StatCard, StatsGrid } from "@/components/admin/stat-card";
import { PriorityBadge, StatusBadge } from "@/components/shared/badges";
import { EntityAvatar } from "@/components/shared/entity-avatar";
import { ReviewActions } from "@/components/tasks/review-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCurrentProfile } from "@/lib/auth/get-profile";
import { getTeamLeadDashboardStats, getTeamLeadAvailability } from "@/lib/data/team-lead";
import { getTeamLeadBestPerformer } from "@/lib/data/performance";
import { BestPerformerWidget } from "@/components/performance/best-performer-widget";
import { WorkloadBadge } from "@/components/shared/workload-badge";
import { formatDate } from "@/lib/utils";

export default async function TeamLeadDashboardPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const [stats, availability, bestPerformer] = await Promise.all([
    getTeamLeadDashboardStats(profile.id),
    getTeamLeadAvailability(profile.id),
    getTeamLeadBestPerformer(profile.id, "month"),
  ]);
  const firstName = profile.full_name?.split(" ")[0] ?? "Team Lead";

  return (
    <PageShell
      title={`Welcome back, ${firstName}`}
      description="Overview of your teams, projects, and tasks"
    >
      <div className="space-y-8">
        <StatsGrid>
          <StatCard
            label="My Teams"
            value={stats.teams}
            subtext={`${stats.members} team members`}
            icon={UsersRound}
            href="/team-lead/team"
            accent="blue"
          />
          <StatCard
            label="Projects"
            value={stats.projects.total}
            subtext={`${stats.projects.active} active`}
            icon={FolderKanban}
            href="/team-lead/projects"
            accent="green"
          />
          <StatCard
            label="Team Tasks"
            value={stats.tasks.total}
            subtext={`${stats.tasks.byStatus.done ?? 0} completed`}
            icon={CheckSquare}
            href="/team-lead/tasks"
            accent="purple"
          />
          <StatCard
            label="In Review"
            value={stats.tasks.inReview}
            subtext="Awaiting your approval"
            icon={ClipboardCheck}
            href="/team-lead/tasks"
            accent="orange"
          />
        </StatsGrid>

        <BestPerformerWidget
          data={bestPerformer}
          performanceHref="/team-lead/performance"
        />

        {(stats.tasks.unassigned > 0 ||
          stats.tasks.overdue > 0 ||
          stats.tasks.inReview > 0) && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stats.tasks.inReview > 0 && (
              <Card className="border-amber-200 bg-amber-50/50">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                    <ClipboardCheck className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-amber-900">
                      {stats.tasks.inReview} task
                      {stats.tasks.inReview !== 1 ? "s" : ""} in review
                    </p>
                    <p className="text-sm text-amber-700">
                      Approve or send back for changes.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="ml-auto" asChild>
                    <Link href="/team-lead/tasks">Review</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
            {stats.tasks.unassigned > 0 && (
              <Card className="border-amber-200 bg-amber-50/50">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                    <UserX className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-amber-900">
                      {stats.tasks.unassigned} unassigned task
                      {stats.tasks.unassigned !== 1 ? "s" : ""}
                    </p>
                    <p className="text-sm text-amber-700">
                      Assign owners so work does not stall.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="ml-auto" asChild>
                    <Link href="/team-lead/tasks">View tasks</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
            {stats.tasks.overdue > 0 && (
              <Card className="border-red-200 bg-red-50/50">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-red-900">
                      {stats.tasks.overdue} overdue task
                      {stats.tasks.overdue !== 1 ? "s" : ""}
                    </p>
                    <p className="text-sm text-red-700">
                      Past due date and not marked done.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="ml-auto" asChild>
                    <Link href="/team-lead/tasks">Review</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="border-slate-200 shadow-sm lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Task pipeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(
                [
                  { key: "todo", label: "To Do", color: "bg-slate-400" },
                  { key: "in_progress", label: "In Progress", color: "bg-blue-500" },
                  { key: "review", label: "Review", color: "bg-amber-500" },
                  { key: "rework", label: "Rework", color: "bg-orange-500" },
                  { key: "done", label: "Done", color: "bg-emerald-500" },
                ] as const
              ).map(({ key, label, color }) => {
                const count = stats.tasks.byStatus[key] ?? 0;
                const pct =
                  stats.tasks.total > 0
                    ? Math.round((count / stats.tasks.total) * 100)
                    : 0;
                return (
                  <div key={key}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-slate-600">{label}</span>
                      <span className="font-medium text-slate-900">{count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${color} transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/team-lead/projects">
                  <Plus className="mr-2 h-4 w-4" />
                  View projects
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/team-lead/tasks">
                  <CheckSquare className="mr-2 h-4 w-4" />
                  Manage team tasks
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/team-lead/team">
                  <UsersRound className="mr-2 h-4 w-4" />
                  View my team
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Team capacity</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/team-lead/team">View all</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {availability.members.length === 0 ? (
                <p className="text-sm text-slate-500">No team members to show.</p>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-emerald-100 px-2 py-1 font-medium text-emerald-800">
                      {availability.summary.available} available
                    </span>
                    <span className="rounded-full bg-amber-100 px-2 py-1 font-medium text-amber-800">
                      {availability.summary.moderate} moderate
                    </span>
                    <span className="rounded-full bg-orange-100 px-2 py-1 font-medium text-orange-800">
                      {availability.summary.atCapacity} at capacity
                    </span>
                    {availability.summary.overloaded > 0 && (
                      <span className="rounded-full bg-red-100 px-2 py-1 font-medium text-red-800">
                        {availability.summary.overloaded} overloaded
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {availability.members.slice(0, 5).map(({ profile: member, teamName, workload }) => (
                      <Link
                        key={`${teamName}-${member.id}`}
                        href={`/team-lead/members/${member.id}`}
                        className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2 transition-colors hover:border-blue-200 hover:bg-blue-50/40"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {member.full_name}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {workload.activeTasks}/{workload.capacity} active · {teamName}
                          </p>
                        </div>
                        <WorkloadBadge status={workload.status} />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Review queue</CardTitle>
              {stats.tasks.reviewQueue.length > 0 && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/team-lead/tasks">View all</Link>
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {stats.tasks.reviewQueue.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No tasks waiting for review.
                </p>
              ) : (
                <div className="space-y-3">
                  {stats.tasks.reviewQueue.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {task.title}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          [{task.project?.key}] {task.project?.name}
                        </p>
                      </div>
                      <ReviewActions taskId={task.id} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent team tasks</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/team-lead/tasks">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {stats.tasks.recent.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-slate-500">
                No tasks yet for your teams.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                    <TableHead>Task</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.tasks.recent.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <EntityAvatar name={task.title} size="sm" />
                          <p className="font-medium text-slate-900">{task.title}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        [{task.project?.key}] {task.project?.name}
                      </TableCell>
                      <TableCell>
                        {task.assignee ? (
                          <span className="text-sm text-slate-700">
                            {task.assignee.full_name}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">Unassigned</span>
                        )}
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
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
