import { Suspense } from "react";
import {
  CheckSquare,
  Circle,
  PlayCircle,
  AlertTriangle,
} from "lucide-react";
import { PageShell } from "@/components/layout/dashboard-shell";
import { CreateTaskDialog } from "@/components/admin/create-task-dialog";
import { TaskFilters } from "@/components/admin/task-filters";
import { StatCard, StatsGrid } from "@/components/admin/stat-card";
import { TasksView } from "@/components/tasks/tasks-view";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getTasks, getProjects, getUsers } from "@/lib/data/queries";

async function TasksList({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; assignee?: string; status?: string }>;
}) {
  const params = await searchParams;
  const tasks = await getTasks({
    projectId: params.project,
    assigneeId: params.assignee,
    status: params.status,
  });

  return (
    <TasksView
      tasks={tasks}
      role="admin"
      viewStorageKey="taskora-admin-tasks-view"
      emptyTitle="No tasks found"
      emptyDescription="Create a task or adjust your filters."
    />
  );
}

async function TaskStats() {
  const allTasks = await getTasks();
  const todo = allTasks.filter((t) => t.status === "todo").length;
  const inProgress = allTasks.filter((t) => t.status === "in_progress").length;
  const overdue = allTasks.filter((t) => {
    if (!t.due_date || t.status === "done") return false;
    const due = new Date(t.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  }).length;

  return (
    <StatsGrid>
      <StatCard
        label="Total Tasks"
        value={allTasks.length}
        subtext="Across all projects"
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
        subtext="Currently active"
        icon={PlayCircle}
        accent="green"
      />
      <StatCard
        label="Overdue"
        value={overdue}
        subtext="Past due date"
        icon={AlertTriangle}
        accent="orange"
      />
    </StatsGrid>
  );
}

export default async function AdminTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; assignee?: string; status?: string }>;
}) {
  const [projects, users] = await Promise.all([getProjects(), getUsers()]);

  return (
    <PageShell
      title="Tasks"
      description="Create, assign, and track tasks across all projects."
      action={<CreateTaskDialog projects={projects} users={users} />}
      stats={
        <Suspense
          fallback={
            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          }
        >
          <TaskStats />
        </Suspense>
      }
    >
      <Card className="mb-6 border-slate-200 p-4 shadow-sm">
        <Suspense fallback={<Skeleton className="h-10 w-full max-w-xl" />}>
          <TaskFilters projects={projects} users={users} />
        </Suspense>
      </Card>
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
        <TasksList searchParams={searchParams} />
      </Suspense>
    </PageShell>
  );
}
