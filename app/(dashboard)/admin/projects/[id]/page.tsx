import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckSquare,
  FolderKanban,
} from "lucide-react";
import { PageShell, EmptyState } from "@/components/layout/dashboard-shell";
import { ArchivedProjectNotice } from "@/components/projects/archived-project-notice";
import { ProjectActionsMenu } from "@/components/admin/project-actions-menu";
import { CreateTaskDialog } from "@/components/admin/create-task-dialog";
import { StatCard, StatsGrid } from "@/components/admin/stat-card";
import { PriorityBadge, StatusBadge } from "@/components/shared/badges";
import { EntityAvatar } from "@/components/shared/entity-avatar";
import { DataTableCard } from "@/components/shared/data-table-card";
import { ProjectInfoCard } from "@/components/projects/project-info-card";
import { ProjectSummaryCard } from "@/components/projects/project-summary-card";
import { TaskStatusSelect } from "@/components/tasks/task-status-select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getUsers } from "@/lib/data/queries";
import {
  getProjectById,
  getProjectTasks,
  getTeamMembersForProject,
} from "@/lib/data/team-lead";
import { buildProjectSummary } from "@/lib/projects/summary";
import { formatDate } from "@/lib/utils";

export default async function AdminProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [project, tasks, users] = await Promise.all([
    getProjectById(id),
    getProjectTasks(id),
    getUsers(),
  ]);

  if (!project) notFound();

  const teamMembers = await getTeamMembersForProject(project.team_id);
  const summary = buildProjectSummary(tasks);
  const assignableUsers = users.filter((u) => u.role !== "admin");

  const isArchived = project.status === "archived";

  return (
    <PageShell
      title={project.name}
      description={`Project ${project.key} · ${project.team?.name ?? "Team"}`}
      action={
        <div className="flex flex-wrap items-center gap-2">
          <ProjectActionsMenu
            projectId={project.id}
            projectName={project.name}
            status={project.status}
          />
          {project.status === "active" && (
            <CreateTaskDialog
              projects={[project]}
              users={assignableUsers}
              defaultProjectId={project.id}
            />
          )}
        </div>
      }
    >
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" className="gap-2 border-slate-200" asChild>
          <Link href="/admin/projects">
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/tasks?project=${project.id}`}>All tasks in project</Link>
        </Button>
      </div>

      <div className="mb-8 space-y-6">
        {isArchived && <ArchivedProjectNotice adminCanRestore />}
        {!isArchived && project.status === "paused" && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            This project is paused. Resume it to allow new tasks.
          </div>
        )}
        <ProjectInfoCard project={project} teamMembers={teamMembers} />
        <ProjectSummaryCard summary={summary} />
      </div>

      <StatsGrid>
        <StatCard
          label="Total Tasks"
          value={summary.total}
          subtext="In this project"
          icon={CheckSquare}
          accent="blue"
        />
        <StatCard
          label="Open"
          value={summary.open}
          subtext="Not yet done"
          icon={FolderKanban}
          accent="purple"
        />
        <StatCard
          label="In Review"
          value={summary.review}
          subtext="Awaiting approval"
          icon={CheckSquare}
          accent="orange"
        />
        <StatCard
          label="Done"
          value={summary.done}
          subtext={`${summary.completionRate}% complete`}
          icon={CheckSquare}
          accent="green"
        />
      </StatsGrid>

      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Project tasks</h2>
        {tasks.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title="No tasks yet"
            description="Add a task to start tracking work on this project."
          />
        ) : (
          <DataTableCard total={tasks.length}>
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                  <TableHead>Task</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due date</TableHead>
                {isArchived ? null : <TableHead>Update</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-slate-900">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-slate-500 line-clamp-1">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {task.assignee ? (
                        <div className="flex items-center gap-2">
                          <EntityAvatar
                            name={
                              task.assignee.full_name ||
                              task.assignee.email ||
                              "Unknown"
                            }
                            size="sm"
                          />
                          <span className="text-slate-700">
                            {task.assignee.full_name ??
                              task.assignee.email ??
                              "Unknown"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={task.priority} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={task.status} />
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {formatDate(task.due_date)}
                    </TableCell>
                    {!isArchived && (
                      <TableCell>
                        <TaskStatusSelect
                          taskId={task.id}
                          currentStatus={task.status}
                        />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataTableCard>
        )}
      </div>
    </PageShell>
  );
}
