import Link from "next/link";
import {
  CheckSquare,
  Circle,
  PlayCircle,
  Calendar,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
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
import { getTasks } from "@/lib/data/queries";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default async function MemberTasksPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const tasks = await getTasks({ forUserId: profile.id });

  const todo = tasks.filter((t) => t.status === "todo").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const rework = tasks.filter((t) => t.status === "rework").length;
  const done = tasks.filter((t) => t.status === "done").length;

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
      {tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks assigned"
          description="Tasks assigned to you will appear here."
        />
      ) : (
        <DataTableCard total={tasks.length}>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                <TableHead>Task</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="w-[1%]">Update</TableHead>
                <TableHead className="w-[1%]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id} className="group">
                  <TableCell>
                    <Link
                      href={`/member/tasks/${task.id}`}
                      className="flex items-center gap-3 rounded-lg transition-colors hover:opacity-90"
                    >
                      <EntityAvatar name={task.title} size="sm" />
                      <div>
                        <p className="font-semibold text-slate-900 group-hover:text-teal-700">
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-slate-500 line-clamp-1">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    [{task.project?.key}] {task.project?.name}
                  </TableCell>
                  <TableCell>
                    <PriorityBadge priority={task.priority} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={task.status} audience="member" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      {formatDate(task.due_date)}
                    </div>
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
                      <Link href={`/member/tasks/${task.id}`}>
                        View
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
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
