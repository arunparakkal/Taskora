import Link from "next/link";
import { CheckSquare, FolderKanban, Users, Calendar } from "lucide-react";
import { PageShell, EmptyState } from "@/components/layout/dashboard-shell";
import { StatCard, StatsGrid } from "@/components/admin/stat-card";
import { PriorityBadge, StatusBadge } from "@/components/shared/badges";
import { EntityAvatar } from "@/components/shared/entity-avatar";
import { DataTableCard } from "@/components/shared/data-table-card";
import { TaskStatusSelect } from "@/components/tasks/task-status-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCurrentProfile } from "@/lib/auth/get-profile";
import { getTasks, getTeamLeadTeamIds, getProjects } from "@/lib/data/queries";
import { formatDate } from "@/lib/utils";

export default async function TeamLeadTasksPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const teamIds = await getTeamLeadTeamIds(profile.id);
  const allTasks = await getTasks();
  const allProjects = await getProjects();
  const tasks = allTasks.filter((task) =>
    task.project?.team_id ? teamIds.includes(task.project.team_id) : false
  );
  const projects = allProjects.filter((p) => teamIds.includes(p.team_id));

  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const done = tasks.filter((t) => t.status === "done").length;

  return (
    <PageShell
      title="Team Tasks"
      description="View and update task status for your team."
      stats={
        <StatsGrid>
          <StatCard
            label="Team Tasks"
            value={tasks.length}
            subtext="Across your teams"
            icon={CheckSquare}
            accent="blue"
          />
          <StatCard
            label="Projects"
            value={projects.length}
            subtext="Active team projects"
            icon={FolderKanban}
            accent="green"
          />
          <StatCard
            label="In Progress"
            value={inProgress}
            subtext="Currently active"
            icon={Users}
            accent="purple"
          />
          <StatCard
            label="Completed"
            value={done}
            subtext="Marked as done"
            icon={CheckSquare}
            accent="orange"
          />
        </StatsGrid>
      }
    >
      {tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks"
          description="Tasks assigned to your team will appear here."
        />
      ) : (
        <DataTableCard total={tasks.length}>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                <TableHead>Title</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Update</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <Link
                      href={`/team-lead/tasks/${task.id}`}
                      className="flex items-center gap-3 hover:text-blue-600"
                    >
                      <EntityAvatar name={task.title} size="sm" />
                      <p className="font-semibold text-slate-900">{task.title}</p>
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    [{task.project?.key}] {task.project?.name}
                  </TableCell>
                  <TableCell>
                    {task.assignee ? (
                      <div className="flex items-center gap-2">
                        <EntityAvatar
                          name={task.assignee.full_name || task.assignee.email}
                          size="sm"
                        />
                        <span className="text-slate-700">{task.assignee.full_name}</span>
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
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      {formatDate(task.due_date)}
                    </div>
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
    </PageShell>
  );
}
