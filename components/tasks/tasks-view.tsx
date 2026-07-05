"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Calendar, CheckSquare, ChevronRight, Search } from "lucide-react";
import { EmptyState } from "@/components/layout/dashboard-shell";
import { PriorityBadge, StatusBadge } from "@/components/shared/badges";
import { DataTableCard } from "@/components/shared/data-table-card";
import { EntityAvatar } from "@/components/shared/entity-avatar";
import {
  ViewModeToggle,
  type ViewMode,
} from "@/components/shared/view-mode-toggle";
import { TaskCard, type TaskCardRole } from "@/components/tasks/task-card";
import { TaskStatusSelect } from "@/components/tasks/task-status-select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import type { TaskWithDetails } from "@/types/database";

function matchesTask(task: TaskWithDetails, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  return (
    task.title.toLowerCase().includes(q) ||
    (task.description?.toLowerCase().includes(q) ?? false) ||
    (task.project?.name?.toLowerCase().includes(q) ?? false) ||
    (task.project?.key?.toLowerCase().includes(q) ?? false) ||
    (task.assignee?.full_name?.toLowerCase().includes(q) ?? false) ||
    (task.assignee?.email?.toLowerCase().includes(q) ?? false) ||
    task.status.toLowerCase().includes(q) ||
    task.priority.toLowerCase().includes(q)
  );
}

function taskDetailHref(role: TaskCardRole, taskId: string) {
  if (role === "team_lead") return `/team-lead/tasks/${taskId}`;
  if (role === "member") return `/member/tasks/${taskId}`;
  return undefined;
}

export function TasksView({
  tasks,
  role,
  viewStorageKey,
  searchPlaceholder = "Search tasks by title, project, assignee, or status...",
  emptyTitle = "No tasks found",
  emptyDescription = "Tasks will appear here once they are created or assigned.",
}: {
  tasks: TaskWithDetails[];
  role: TaskCardRole;
  viewStorageKey: string;
  searchPlaceholder?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  useEffect(() => {
    const saved = localStorage.getItem(viewStorageKey);
    if (saved === "list" || saved === "card") {
      setViewMode(saved);
    }
  }, [viewStorageKey]);

  function handleViewChange(mode: ViewMode) {
    setViewMode(mode);
    localStorage.setItem(viewStorageKey, mode);
  }

  const filteredTasks = useMemo(
    () => tasks.filter((task) => matchesTask(task, query)),
    [tasks, query]
  );

  const showAssignee = role !== "member";

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={CheckSquare}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative min-w-0 flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-10 border-slate-200 bg-slate-50 pl-10"
            />
          </div>
          <ViewModeToggle value={viewMode} onChange={handleViewChange} />
        </div>
      </Card>

      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No tasks found"
          description={`No tasks match "${query}". Try a different search.`}
        />
      ) : viewMode === "card" ? (
        <div>
          <p className="mb-4 text-sm text-slate-500">
            {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                role={role}
                detailHref={taskDetailHref(role, task.id)}
              />
            ))}
          </div>
        </div>
      ) : (
        <DataTableCard total={filteredTasks.length} scrollable={false}>
          <Table containerClassName="overflow-visible" className="table-fixed">
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                <TableHead className="w-[32%] px-4">Task</TableHead>
                {showAssignee && (
                  <TableHead className="hidden w-[16%] px-4 md:table-cell">
                    Assignee
                  </TableHead>
                )}
                <TableHead className="w-[12%] px-4">Priority</TableHead>
                <TableHead className="w-[14%] px-4">Status</TableHead>
                <TableHead className="hidden w-[14%] px-4 lg:table-cell">
                  Due
                </TableHead>
                <TableHead className="w-[18%] px-4">Update</TableHead>
                {role !== "admin" && (
                  <TableHead className="w-[1%] px-4" />
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task) => {
                const href = taskDetailHref(role, task.id);

                return (
                  <TableRow key={task.id} className="group">
                    <TableCell className="px-4">
                      {href ? (
                        <Link
                          href={href}
                          className="flex min-w-0 items-center gap-3 hover:text-blue-600"
                        >
                          <EntityAvatar name={task.title} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">
                              {task.title}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              [{task.project?.key}] {task.project?.name}
                            </p>
                            {task.description && (
                              <p className="truncate text-xs text-slate-400 line-clamp-1">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </Link>
                      ) : (
                        <div className="flex min-w-0 items-center gap-3">
                          <EntityAvatar name={task.title} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">
                              {task.title}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              [{task.project?.key}] {task.project?.name}
                            </p>
                            {task.description && (
                              <p className="truncate text-xs text-slate-400 line-clamp-1">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </TableCell>
                    {showAssignee && (
                      <TableCell className="hidden px-4 md:table-cell">
                        {task.assignee ? (
                          <div className="flex min-w-0 items-center gap-2">
                            <EntityAvatar
                              name={
                                task.assignee.full_name || task.assignee.email
                              }
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
                    )}
                    <TableCell className="px-4">
                      <PriorityBadge priority={task.priority} />
                    </TableCell>
                    <TableCell className="px-4">
                      {role === "member" ? (
                        <StatusBadge status={task.status} audience="member" />
                      ) : (
                        <StatusBadge status={task.status} />
                      )}
                    </TableCell>
                    <TableCell className="hidden px-4 lg:table-cell">
                      <div className="flex items-center gap-1.5 whitespace-nowrap text-slate-500">
                        <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
                        {formatDate(task.due_date)}
                      </div>
                    </TableCell>
                    <TableCell className="px-4">
                      <TaskStatusSelect
                        taskId={task.id}
                        currentStatus={task.status}
                        mode={role === "member" ? "member" : "full"}
                      />
                    </TableCell>
                    {href && (
                      <TableCell className="px-4">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={href}>
                            View
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </DataTableCard>
      )}
    </div>
  );
}
