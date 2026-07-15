import Link from "next/link";
import {
  AlertCircle,
  CheckSquare,
  FolderKanban,
  History,
  LayoutDashboard,
  Mail,
  Shield,
  UserPlus,
  Users,
  UsersRound,
} from "lucide-react";
import { StatCard, StatsGrid } from "@/components/admin/stat-card";
import { RoleBadge } from "@/components/shared/badges";
import { EntityAvatar } from "@/components/shared/entity-avatar";
import { DataTableCard } from "@/components/shared/data-table-card";
import { PROJECT_STATUS_LABELS } from "@/lib/projects/status";
import {
  adminActivityTypeLabel,
  type AdminProfileData,
} from "@/lib/data/admin-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatDateTime } from "@/lib/utils";

export function AdminProfileView({
  data,
  isSelf = false,
}: {
  data: AdminProfileData;
  isSelf?: boolean;
}) {
  const { profile, stats, teamsCreated, projectsCreated, tasksCreated } = data;
  const displayName = profile.full_name || profile.email;

  return (
    <div className="space-y-8">
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <EntityAvatar
              name={displayName}
              src={profile.avatar_url}
              size="lg"
              className="h-16 w-16 text-lg"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  {displayName}
                </h2>
                <RoleBadge role="admin" />
                <Badge
                  variant="secondary"
                  className="gap-1 bg-indigo-50 font-normal text-indigo-700"
                >
                  <Shield className="h-3 w-3" />
                  Organization administrator
                </Badge>
              </div>
              <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                <Mail className="h-4 w-4 shrink-0" />
                {profile.email}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Admin since {formatDate(profile.created_at)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <StatsGrid>
        <StatCard
          label="Teams created"
          value={stats.teamsCreated}
          subtext="Groups set up"
          icon={UsersRound}
          accent="blue"
        />
        <StatCard
          label="Projects created"
          value={stats.projectsCreated}
          subtext="Initiatives started"
          icon={FolderKanban}
          accent="green"
        />
        <StatCard
          label="Tasks created"
          value={stats.tasksCreated}
          subtext="Work delegated"
          icon={CheckSquare}
          accent="purple"
        />
        <StatCard
          label="Actions"
          value={stats.actionsInPeriod}
          subtext={`${data.periodLabel.toLowerCase()}`}
          icon={History}
          accent="orange"
        />
      </StatsGrid>

      {isSelf && data.orgSnapshot && (
        <div>
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
            <LayoutDashboard className="h-5 w-5 text-slate-500" />
            Organization snapshot
          </h3>
          <StatsGrid>
            <StatCard
              label="Total users"
              value={data.orgSnapshot.users.total}
              subtext={`${data.orgSnapshot.users.byRole.member} members`}
              icon={Users}
              href="/admin/users"
              accent="blue"
            />
            <StatCard
              label="Teams"
              value={data.orgSnapshot.teams.total}
              subtext="Across the org"
              icon={UsersRound}
              href="/admin/teams"
              accent="green"
            />
            <StatCard
              label="Active projects"
              value={data.orgSnapshot.projects.active}
              subtext={`${data.orgSnapshot.projects.total} total`}
              icon={FolderKanban}
              href="/admin/projects"
              accent="purple"
            />
            <StatCard
              label="Overdue tasks"
              value={data.orgSnapshot.tasks.overdue}
              subtext={`${data.orgSnapshot.tasks.unassigned} unassigned`}
              icon={AlertCircle}
              href="/admin/tasks"
              accent="orange"
            />
          </StatsGrid>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <ImpactTile
          icon={UserPlus}
          label="Members added"
          value={stats.membersAdded}
          description="Team roster changes logged"
        />
        <ImpactTile
          icon={FolderKanban}
          label="Status changes"
          value={stats.statusChanges}
          description="Pause, resume, archive actions"
        />
        <ImpactTile
          icon={History}
          label="Logged events"
          value={data.recentActivity.length}
          description={`In ${data.periodLabel.toLowerCase()}`}
        />
      </div>

      {data.recentActivity.length > 0 && (
        <div>
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
            <History className="h-5 w-5 text-slate-500" />
            Recent administrative activity
          </h3>
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <ul className="divide-y divide-slate-100">
                {data.recentActivity.map((item) => (
                  <li
                    key={item.id}
                    className="flex gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50">
                      <History className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                          {adminActivityTypeLabel(item.eventType)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-medium text-slate-900">
                        {item.summary}
                      </p>
                      {item.detail && (
                        <p className="text-xs text-slate-500">{item.detail}</p>
                      )}
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                        {item.projectId && (
                          <Link
                            href={`/admin/projects/${item.projectId}`}
                            className="text-blue-600 hover:underline"
                          >
                            {item.projectKey
                              ? `[${item.projectKey}] ${item.projectName}`
                              : item.projectName}
                          </Link>
                        )}
                        {item.teamName && !item.projectId && (
                          <span>Team: {item.teamName}</span>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {formatDateTime(item.created_at)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {projectsCreated.length > 0 && (
        <div>
          <h3 className="mb-4 text-lg font-semibold text-slate-900">
            Projects created
          </h3>
          <DataTableCard total={projectsCreated.length} scrollable={false}>
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                  <TableHead>Project</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectsCreated.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <p className="font-medium text-slate-900">{project.name}</p>
                      <p className="font-mono text-xs text-slate-500">
                        {project.key}
                      </p>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {project.team?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={project.status}>
                        {PROJECT_STATUS_LABELS[project.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {formatDate(project.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="link" className="h-auto p-0" asChild>
                        <Link href={`/admin/projects/${project.id}`}>Open</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataTableCard>
        </div>
      )}

      {teamsCreated.length > 0 && (
        <div>
          <h3 className="mb-4 text-lg font-semibold text-slate-900">
            Teams created
          </h3>
          <DataTableCard total={teamsCreated.length} scrollable={false}>
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                  <TableHead>Team</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamsCreated.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium text-slate-900">
                      {team.name}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-slate-500">
                      {team.description || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {formatDate(team.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataTableCard>
        </div>
      )}

      {tasksCreated.length > 0 && (
        <div>
          <h3 className="mb-4 text-lg font-semibold text-slate-900">
            Recent tasks created
          </h3>
          <DataTableCard total={tasksCreated.length} scrollable={false}>
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                  <TableHead>Task</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasksCreated.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium text-slate-900">
                      {task.title}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      [{task.project?.key}] {task.project?.name}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {task.assignee?.full_name ?? (
                        <span className="text-slate-400">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {formatDate(task.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataTableCard>
        </div>
      )}

      {stats.teamsCreated === 0 &&
        stats.projectsCreated === 0 &&
        stats.tasksCreated === 0 &&
        data.recentActivity.length === 0 && (
          <Card className="border-dashed border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base text-slate-700">
                No logged administrative actions yet
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-500">
              Actions like creating teams, projects, tasks, and changing project
              status will appear here once this admin performs them. Older actions
              before activity logging was enabled may not be listed.
            </CardContent>
          </Card>
        )}
    </div>
  );
}

function ImpactTile({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  description: string;
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="flex items-start gap-3 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
          <Icon className="h-5 w-5 text-slate-600" />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-sm font-medium text-slate-700">{label}</p>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
