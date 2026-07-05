import { Suspense } from "react";
import {
  CheckSquare,
  Circle,
  PlayCircle,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { PageShell, EmptyState } from "@/components/layout/dashboard-shell";
import { CreateTaskDialog } from "@/components/admin/create-task-dialog";
import { TaskFilters } from "@/components/admin/task-filters";
import { StatCard, StatsGrid } from "@/components/admin/stat-card";
import { PriorityBadge } from "@/components/shared/badges";
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
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getTasks, getProjects, getUsers } from "@/lib/data/queries";
import { formatDate } from "@/lib/utils";

async function TasksTable({
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

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={CheckSquare}
        title="No tasks found"
        description="Create a task or adjust your filters."
      />
    );
  }

  return (
    <DataTableCard total={tasks.length} scrollable={false}>
      <Table containerClassName="overflow-visible" className="table-fixed">
        <TableHeader>
          <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
            <TableHead className="w-[36%] px-4">Task</TableHead>
            <TableHead className="hidden w-[18%] px-4 md:table-cell">Assignee</TableHead>
            <TableHead className="w-[12%] px-4">Priority</TableHead>
            <TableHead className="w-[18%] px-4">Status</TableHead>
            <TableHead className="hidden w-[14%] px-4 lg:table-cell">Due</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell className="px-4">
                <div className="flex min-w-0 items-center gap-3">
                  <EntityAvatar name={task.title} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{task.title}</p>
                    <p className="truncate text-xs text-slate-500">
                      [{task.project?.key}] {task.project?.name}
                    </p>
                    {task.description && (
                      <p className="truncate text-xs text-slate-400 line-clamp-1">
                        {task.description}
                      </p>
                    )}
                    <p className="mt-1 truncate text-xs text-slate-500 md:hidden">
                      {task.assignee?.full_name ?? "Unassigned"}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden px-4 md:table-cell">
                {task.assignee ? (
                  <div className="flex min-w-0 items-center gap-2">
                    <EntityAvatar
                      name={task.assignee.full_name || task.assignee.email}
                      size="sm"
                    />
                    <span className="truncate text-slate-700">
                      {task.assignee.full_name}
                    </span>
                  </div>
                ) : (
                  <span className="text-slate-400">Unassigned</span>
                )}
              </TableCell>
              <TableCell className="px-4">
                <PriorityBadge priority={task.priority} />
              </TableCell>
              <TableCell className="px-4">
                <TaskStatusSelect taskId={task.id} currentStatus={task.status} />
              </TableCell>
              <TableCell className="hidden px-4 lg:table-cell">
                <div className="flex items-center gap-1.5 whitespace-nowrap text-slate-500">
                  <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
                  {formatDate(task.due_date)}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataTableCard>
  );
}

async function TaskStats() {
  const allTasks = await getTasks();
  const todo = allTasks.filter((t) => t.status === "todo").length;
  const inProgress = allTasks.filter((t) => t.status === "in_progress").length;
  const done = allTasks.filter((t) => t.status === "done").length;
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
        <TasksTable searchParams={searchParams} />
      </Suspense>
    </PageShell>
  );
}
