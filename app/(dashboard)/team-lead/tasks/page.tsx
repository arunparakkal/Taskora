import { CheckSquare, FolderKanban, Users } from "lucide-react";
import { PageShell } from "@/components/layout/dashboard-shell";
import { StatCard, StatsGrid } from "@/components/admin/stat-card";
import { TasksView } from "@/components/tasks/tasks-view";
import { getCurrentProfile } from "@/lib/auth/get-profile";
import {
  getTasks,
  getTasksPage,
  getTeamLeadTeamIds,
  getProjects,
} from "@/lib/data/queries";

export default async function TeamLeadTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const teamIds = await getTeamLeadTeamIds(profile.id);
  const [tasksPage, allTasks, allProjects] = await Promise.all([
    getTasksPage({ page, search: params.q, teamIds }),
    getTasks(),
    getProjects(),
  ]);
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
      <TasksView
        tasks={tasksPage.items}
        role="team_lead"
        viewStorageKey="taskora-team-lead-tasks-view"
        emptyTitle="No tasks"
        emptyDescription="Tasks assigned to your team will appear here."
        pagination={{
          page: tasksPage.page,
          pageSize: tasksPage.pageSize,
          total: tasksPage.total,
        }}
      />
    </PageShell>
  );
}
