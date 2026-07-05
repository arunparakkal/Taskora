import { Suspense } from "react";
import { FolderKanban, CheckSquare, CheckCircle2, ListTodo } from "lucide-react";
import { PageShell } from "@/components/layout/dashboard-shell";
import { StatCard, StatsGrid } from "@/components/admin/stat-card";
import { ProjectsView } from "@/components/projects/projects-view";
import { getCurrentProfile } from "@/lib/auth/get-profile";
import { getMemberProjects, getTasks } from "@/lib/data/queries";

export default async function MemberProjectsPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const [projects, tasks] = await Promise.all([
    getMemberProjects(profile.id),
    getTasks({ forUserId: profile.id }),
  ]);

  const myTaskCounts = tasks.reduce<Record<string, number>>((acc, task) => {
    acc[task.project_id] = (acc[task.project_id] ?? 0) + 1;
    return acc;
  }, {});

  const active = projects.filter((p) => p.status === "active").length;
  const openTasks = tasks.filter((t) => t.status !== "done").length;
  const doneTasks = tasks.filter((t) => t.status === "done").length;

  return (
    <PageShell
      title="My Projects"
      description="Projects you belong to and tasks assigned to you."
      stats={
        <StatsGrid>
          <StatCard
            label="Projects"
            value={projects.length}
            subtext="On your team or with your tasks"
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
            label="My Tasks"
            value={tasks.length}
            subtext="Assigned to you"
            icon={ListTodo}
            accent="purple"
          />
          <StatCard
            label="Open"
            value={openTasks}
            subtext={`${doneTasks} completed`}
            icon={CheckSquare}
            accent="orange"
          />
        </StatsGrid>
      }
    >
      <Suspense fallback={null}>
        <ProjectsView
          projects={projects.filter((p) => p.status !== "archived")}
          detailPathPrefix="/member/projects"
          viewStorageKey="taskora-projects-view-member"
          searchPlaceholder="Search your projects..."
          emptyTitle="No projects"
          emptyDescription="Projects from your team or with tasks assigned to you will appear here."
          myTaskCounts={myTaskCounts}
        />
      </Suspense>
    </PageShell>
  );
}
