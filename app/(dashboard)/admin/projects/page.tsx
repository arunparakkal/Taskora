import { Suspense } from "react";
import {
  FolderKanban,
  CheckCircle2,
  Pause,
  Archive,
  ListTodo,
} from "lucide-react";
import { PageShell } from "@/components/layout/dashboard-shell";
import { CreateProjectDialog } from "@/components/admin/create-project-dialog";
import { ProjectsList } from "@/components/admin/projects-list";
import { StatCard, StatsGrid } from "@/components/admin/stat-card";
import {
  getProjects,
  getProjectsPage,
  getProjectStatusCounts,
  getTeams,
} from "@/lib/data/queries";
import type { ProjectListTab } from "@/components/shared/project-list-tabs";

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const tab: ProjectListTab = params.tab === "archived" ? "archived" : "active";
  const search = params.q ?? "";
  const page = Math.max(1, Number(params.page) || 1);

  const [projects, teams, statusCounts, projectsPage] = await Promise.all([
    getProjects(),
    getTeams(),
    getProjectStatusCounts(),
    getProjectsPage({ page, search, archived: tab === "archived" }),
  ]);

  const active = projects.filter((p) => p.status === "active").length;
  const paused = projects.filter((p) => p.status === "paused").length;
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
            label="Paused"
            value={paused}
            subtext="Temporarily on hold"
            icon={Pause}
            accent="orange"
          />
          <StatCard
            label="Archived"
            value={archived}
            subtext="Read-only, stored"
            icon={Archive}
            accent="purple"
          />
          <StatCard
            label="Total Tasks"
            value={totalTasks}
            subtext="Across all projects"
            icon={ListTodo}
            accent="blue"
          />
        </StatsGrid>
      }
    >
      <Suspense fallback={null}>
        <ProjectsList
          tab={tab}
          search={search}
          activeCount={statusCounts.active}
          archivedCount={statusCounts.archived}
          projectsPage={projectsPage}
        />
      </Suspense>
    </PageShell>
  );
}
