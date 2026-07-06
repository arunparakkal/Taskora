import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CheckSquare } from "lucide-react";
import { PageShell, EmptyState } from "@/components/layout/dashboard-shell";
import { StatCard, StatsGrid } from "@/components/admin/stat-card";
import { PriorityBadge, StatusBadge } from "@/components/shared/badges";
import { EntityAvatar } from "@/components/shared/entity-avatar";
import { DataTableCard } from "@/components/shared/data-table-card";
import { ProjectInfoCard } from "@/components/projects/project-info-card";
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
import { getMemberProjects, getTasks } from "@/lib/data/queries";
import {
  getProjectById,
  getTeamMembersForProject,
} from "@/lib/data/team-lead";
import { formatDate } from "@/lib/utils";

export default async function MemberProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const [project, memberProjects, allMyTasks] = await Promise.all([
    getProjectById(id),
    getMemberProjects(profile.id),
    getTasks({ forUserId: profile.id }),
  ]);

  if (!project || !memberProjects.some((p) => p.id === id)) {
    notFound();
  }

  const tasks = allMyTasks.filter((t) => t.project_id === id);
  const teamMembers = await getTeamMembersForProject(project.team_id);
  const openTasks = tasks.filter((t) => t.status !== "done").length;

  return (
    <PageShell
      title={project.name}
      description={`Project ${project.key} · ${project.team?.name ?? "Team"}`}
    >
      <div className="mb-6">
        <Button variant="outline" size="sm" className="gap-2 border-slate-200" asChild>
          <Link href="/member/projects">
            <ArrowLeft className="h-4 w-4" />
            Back to My Projects
          </Link>
        </Button>
      </div>

      <div className="mb-8">
        <ProjectInfoCard
          project={project}
          teamMembers={teamMembers}
          memberProfileHref={(id) =>
            id === profile.id ? "/member/profile" : undefined
          }
        />
      </div>

      <StatsGrid>
        <StatCard
          label="My Tasks"
          value={tasks.length}
          subtext="Assigned to you in this project"
          icon={CheckSquare}
          accent="blue"
        />
        <StatCard
          label="Open"
          value={openTasks}
          subtext="Not yet completed"
          icon={CheckSquare}
          accent="orange"
        />
      </StatsGrid>

      <div className="mt-8">
        {tasks.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title="No tasks assigned"
            description="You have no tasks in this project yet."
          />
        ) : (
          <DataTableCard total={tasks.length}>
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                  <TableHead>Task</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Update</TableHead>
                  <TableHead className="w-[1%]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id} className="group">
                    <TableCell>
                      <Link
                        href={`/member/tasks/${task.id}`}
                        className="flex items-center gap-3"
                      >
                        <EntityAvatar name={task.title} size="sm" />
                        <div>
                          <p className="font-semibold text-slate-900 group-hover:text-teal-700">
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="line-clamp-1 text-xs text-slate-500">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={task.priority} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={task.status} audience="member" />
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {formatDate(task.due_date)}
                    </TableCell>
                    <TableCell>
                      <TaskStatusSelect
                        taskId={task.id}
                        currentStatus={task.status}
                        mode="member"
                      />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/member/tasks/${task.id}`}>View</Link>
                      </Button>
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
