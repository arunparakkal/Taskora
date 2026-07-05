import { Suspense } from "react";
import {
  FolderKanban,
  CheckCircle2,
  Archive,
  ListTodo,
} from "lucide-react";
import { PageShell } from "@/components/layout/dashboard-shell";
import { CreateProjectDialog } from "@/components/admin/create-project-dialog";
import { ProjectsList } from "@/components/admin/projects-list";
import { StatCard, StatsGrid } from "@/components/admin/stat-card";
import { getProjects, getTeams } from "@/lib/data/queries";

export default async function AdminProjectsPage() {
  const [projects, teams] = await Promise.all([getProjects(), getTeams()]);

  const active = projects.filter((p) => p.status === "active").length;
  const archived = projects.filter((p) => p.status === "archived").length;
  const totalTasks = projects.reduce((sum, p) => sum + (p.task_count ?? 0), 0);

  return (
    <PageShell
      title="Projects"
      description="Create and manage projects linked to teams across your organization."
      action={<CreateProjectDialog teams={teams} />}
      stats={
        <StatsGrid>
          <StatCard
            label="Total Projects"
            value={projects.length}
            subtext="Across all teams"
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
            label="Archived"
            value={archived}
            subtext="Completed or paused"
            icon={Archive}
            accent="purple"
          />
          <StatCard
            label="Total Tasks"
            value={totalTasks}
            subtext="Across all projects"
            icon={ListTodo}
            accent="orange"
          />
        </StatsGrid>
      }
    >
      <Suspense fallback={null}>
        <ProjectsList projects={projects} />
      </Suspense>
    </PageShell>
  );
}
