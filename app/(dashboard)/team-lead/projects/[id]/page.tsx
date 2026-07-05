import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  CheckSquare,
  FolderKanban,
} from "lucide-react";
import { PageShell, EmptyState } from "@/components/layout/dashboard-shell";
import { CreateTeamLeadTaskDialog } from "@/components/team-lead/create-task-dialog";
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
import { getCurrentProfile } from "@/lib/auth/get-profile";
import { getTeamLeadTeamIds } from "@/lib/data/queries";
import {
  getProjectById,
  getProjectTasks,
  getTeamMembersForProject,
  getTeamMemberWorkloads,
  userLeadsProjectTeam,
} from "@/lib/data/team-lead";
import { buildProjectSummary } from "@/lib/projects/summary";
import { isProjectOpenForNewTasks } from "@/lib/projects/date-utils";
import { formatDate } from "@/lib/utils";

export default async function TeamLeadProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const [project, tasks, teamIds] = await Promise.all([
    getProjectById(id),
    getProjectTasks(id),
    getTeamLeadTeamIds(profile.id),
  ]);

  if (!project || !teamIds.includes(project.team_id)) {
    notFound();
  }

  const [teamMembers, canManageTasks, memberWorkloads] = await Promise.all([
    getTeamMembersForProject(project.team_id),
    userLeadsProjectTeam(profile.id, project.id),
    getTeamMemberWorkloads(project.team_id),
  ]);

  const summary = buildProjectSummary(tasks);
  const projectOpenForTasks = isProjectOpenForNewTasks(
    project.start_date,
    project.due_date
  );

  return (
    <PageShell
      title={project.name}
      description={`Project ${project.key} · ${project.team?.name ?? "Team"}`}
      action={
        canManageTasks ? (
          <CreateTeamLeadTaskDialog
            projectId={project.id}
            projectName={project.name}
            projectStartDate={project.start_date}
            projectDueDate={project.due_date}
            projectOpenForTasks={projectOpenForTasks}
            teamMembers={teamMembers}
            memberWorkloads={memberWorkloads}
          />
        ) : undefined
      }
    >
      <div className="mb-6">
        <Button variant="outline" size="sm" className="gap-2 border-slate-200" asChild>
          <Link href="/team-lead/projects">
            <ArrowLeft className="h-4 w-4" />
            Back to My Projects
          </Link>
        </Button>
      </div>

      <div className="mb-8 space-y-6">
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
            description={
              canManageTasks
                ? "Add a task and assign it to a team member."
                : "Tasks for this project will appear here."
            }
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
                  <TableHead>Update</TableHead>
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
                    <TableCell>
                      <TaskStatusSelect taskId={task.id} currentStatus={task.status} />
                    </TableCell>
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
