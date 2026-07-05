import Link from "next/link";
import { Calendar, ChevronRight } from "lucide-react";
import { PriorityBadge, StatusBadge } from "@/components/shared/badges";
import { EntityAvatar } from "@/components/shared/entity-avatar";
import { TaskStatusSelect } from "@/components/tasks/task-status-select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { TaskWithDetails } from "@/types/database";

export type TaskCardRole = "admin" | "team_lead" | "member";

export function TaskCard({
  task,
  role,
  detailHref,
}: {
  task: TaskWithDetails;
  role: TaskCardRole;
  detailHref?: string;
}) {
  const showAssignee = role !== "member";
  const titleHref = detailHref ?? undefined;

  return (
    <Card className="group flex h-full flex-col border-slate-200 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start gap-3">
          <EntityAvatar name={task.title} size="sm" />
          <div className="min-w-0 flex-1">
            {titleHref ? (
              <Link
                href={titleHref}
                className="font-semibold text-slate-900 group-hover:text-blue-600"
              >
                {task.title}
              </Link>
            ) : (
              <p className="font-semibold text-slate-900">{task.title}</p>
            )}
            {task.description && (
              <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                {task.description}
              </p>
            )}
            {task.project && (
              <p className="mt-2 truncate text-xs text-slate-500">
                [{task.project.key}] {task.project.name}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <PriorityBadge priority={task.priority} />
          {role === "member" ? (
            <StatusBadge status={task.status} audience="member" />
          ) : (
            <StatusBadge status={task.status} />
          )}
        </div>

        <div className="mt-4 space-y-2 text-sm text-slate-600">
          {showAssignee && (
            <div className="flex items-center gap-2">
              {task.assignee ? (
                <>
                  <EntityAvatar
                    name={task.assignee.full_name || task.assignee.email}
                    size="sm"
                  />
                  <span className="truncate">
                    {task.assignee.full_name || task.assignee.email}
                  </span>
                </>
              ) : (
                <span className="text-slate-400">Unassigned</span>
              )}
            </div>
          )}
          <div className="flex items-center gap-2 text-slate-500">
            <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
            <span>{formatDate(task.due_date)}</span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <TaskStatusSelect
            taskId={task.id}
            currentStatus={task.status}
            mode={role === "member" ? "member" : "full"}
          />
          {titleHref && (
            <Button variant="link" className="h-auto gap-1 p-0 text-sm" asChild>
              <Link href={titleHref}>
                View
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
