import { Suspense } from "react";
import {
  FolderKanban,
  CheckSquare,
  CheckCircle2,
  ListTodo,
} from "lucide-react";
import { PageShell } from "@/components/layout/dashboard-shell";
import { StatCard, StatsGrid } from "@/components/admin/stat-card";
import { ProjectsView } from "@/components/projects/projects-view";
import { getCurrentProfile } from "@/lib/auth/get-profile";
import { getProjects, getTeamLeadTeamIds, getTasks } from "@/lib/data/queries";

export default async function TeamLeadProjectsPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const teamIds = await getTeamLeadTeamIds(profile.id);
  const allProjects = await getProjects();
  const projects = allProjects.filter((p) => teamIds.includes(p.team_id));
  const allTasks = await getTasks();
  const teamTasks = allTasks.filter((task) =>
    task.project?.team_id ? teamIds.includes(task.project.team_id) : false
  );

  const active = projects.filter((p) => p.status === "active").length;

  return (
    <PageShell
      title="My Projects"
      description="View project details and manage tasks for your team."
      stats={
        <StatsGrid>
          <StatCard
            label="Team Projects"
            value={projects.length}
            subtext="Linked to your teams"
            icon={FolderKanban}
            accent="blue"
          />
          <StatCard
            label="Active"
            value={active}
            subtext="Currently running"
            icon={CheckCircle2}
            accent="green"
          />
          <StatCard
            label="Team Tasks"
            value={teamTasks.length}
            subtext="Across all projects"
            icon={ListTodo}
            accent="purple"
          />
          <StatCard
            label="Open Tasks"
            value={teamTasks.filter((t) => t.status !== "done").length}
            subtext="Not yet completed"
            icon={CheckSquare}
            accent="orange"
          />
        </StatsGrid>
      }
    >
      <Suspense fallback={null}>
        <ProjectsView
          projects={projects}
          detailPathPrefix="/team-lead/projects"
          viewStorageKey="taskora-projects-view-team-lead"
          emptyTitle="No projects"
          emptyDescription="Projects for your team will appear here."
        />
      </Suspense>
    </PageShell>
  );
}
