import {
  CheckSquare,
  Circle,
  PlayCircle,
  RotateCcw,
} from "lucide-react";
import { PageShell } from "@/components/layout/dashboard-shell";
import { StatCard, StatsGrid } from "@/components/admin/stat-card";
import { TasksView } from "@/components/tasks/tasks-view";
import { getCurrentProfile } from "@/lib/auth/get-profile";
import { getTasks } from "@/lib/data/queries";

export default async function MemberTasksPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const tasks = await getTasks({ forUserId: profile.id });

  const todo = tasks.filter((t) => t.status === "todo").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const rework = tasks.filter((t) => t.status === "rework").length;

  return (
    <PageShell
      title="My Tasks"
      description="View and update your assigned tasks."
      stats={
        <StatsGrid>
          <StatCard
            label="Assigned Tasks"
            value={tasks.length}
            subtext="Total assigned to you"
            icon={CheckSquare}
            accent="blue"
          />
          <StatCard
            label="To Do"
            value={todo}
            subtext="Not started yet"
            icon={Circle}
            accent="purple"
          />
          <StatCard
            label="In Progress"
            value={inProgress}
            subtext="Currently working"
            icon={PlayCircle}
            accent="green"
          />
          <StatCard
            label="Rework"
            value={rework}
            subtext="Needs fixes"
            icon={RotateCcw}
            accent="orange"
          />
        </StatsGrid>
      }
    >
      <TasksView
        tasks={tasks}
        role="member"
        viewStorageKey="taskora-member-tasks-view"
        searchPlaceholder="Search your tasks by title, project, or status..."
        emptyTitle="No tasks assigned"
        emptyDescription="Tasks assigned to you will appear here."
      />
    </PageShell>
  );
}
