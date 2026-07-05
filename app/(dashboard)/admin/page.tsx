import Link from "next/link";
import {
  Users,
  UsersRound,
  FolderKanban,
  CheckSquare,
  AlertCircle,
  UserX,
  Plus,
} from "lucide-react";
import { PageShell } from "@/components/layout/dashboard-shell";
import { StatCard, StatsGrid } from "@/components/admin/stat-card";
import { RoleBadge, StatusBadge, PriorityBadge } from "@/components/shared/badges";
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
import { getAdminDashboardStats } from "@/lib/data/admin-dashboard";
import { getAdminBestPerformer } from "@/lib/data/performance";
import { BestPerformerWidget } from "@/components/performance/best-performer-widget";
import { formatDate } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const [profile, stats, bestPerformer] = await Promise.all([
    getCurrentProfile(),
    getAdminDashboardStats(),
    getAdminBestPerformer("month"),
  ]);

  const firstName = profile?.full_name?.split(" ")[0] ?? "Admin";

  return (
    <PageShell
      title={`Welcome back, ${firstName}`}
      description="Overview of users, teams, projects, and tasks across Taskora"
    >
      <div className="space-y-8">
        <StatsGrid>
          <StatCard
            label="Total Users"
            value={stats.users.total}
            subtext={`${stats.users.byRole.admin} admins · ${stats.users.byRole.team_lead} leads · ${stats.users.byRole.member} members`}
            icon={Users}
            href="/admin/users"
            accent="blue"
          />
          <StatCard
            label="Teams"
            value={stats.teams.total}
            subtext="Active groups in the org"
            icon={UsersRound}
            href="/admin/teams"
            accent="green"
          />
          <StatCard
            label="Projects"
            value={stats.projects.total}
            subtext={`${stats.projects.active} active`}
            icon={FolderKanban}
            href="/admin/projects"
            accent="purple"
          />
          <StatCard
            label="Tasks"
            value={stats.tasks.total}
            subtext={`${stats.tasks.byStatus.done ?? 0} completed`}
            icon={CheckSquare}
            href="/admin/tasks"
            accent="orange"
          />
        </StatsGrid>

        <BestPerformerWidget
          data={bestPerformer}
          performanceHref="/admin/performance"
        />

        {/* Alerts */}
        {(stats.tasks.unassigned > 0 || stats.tasks.overdue > 0) && (
          <div className="grid gap-4 sm:grid-cols-2">
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
                    <Link href="/admin/tasks">View tasks</Link>
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
                    <Link href="/admin/tasks">Review</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Task pipeline */}
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

          {/* Users by role */}
          <Card className="border-slate-200 shadow-sm lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Users by role</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(["admin", "team_lead", "member"] as const).map((role) => (
                <div
                  key={role}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-4 py-3"
                >
                  <RoleBadge role={role} />
                  <span className="text-lg font-semibold text-slate-900">
                    {stats.users.byRole[role]}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card className="border-slate-200 shadow-sm lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/admin/users">
                  <Plus className="mr-2 h-4 w-4" />
                  Manage users
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/admin/teams">
                  <Plus className="mr-2 h-4 w-4" />
                  Create team
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/admin/projects">
                  <Plus className="mr-2 h-4 w-4" />
                  New project
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/admin/tasks">
                  <Plus className="mr-2 h-4 w-4" />
                  Assign task
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent users */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recent users</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/users">View all</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {stats.users.recent.length === 0 ? (
                <p className="text-sm text-slate-500">No users yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.users.recent.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.full_name}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <RoleBadge role={user.role} />
                        </TableCell>
                        <TableCell className="text-slate-500">
                          {formatDate(user.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Recent tasks */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recent tasks</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/tasks">View all</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {stats.tasks.recent.length === 0 ? (
                <p className="text-sm text-slate-500">No tasks yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.tasks.recent.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium line-clamp-1">{task.title}</p>
                            <p className="text-xs text-slate-500">
                              [{task.project?.key}] {task.project?.name}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={task.status} />
                        </TableCell>
                        <TableCell>
                          <PriorityBadge priority={task.priority} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
