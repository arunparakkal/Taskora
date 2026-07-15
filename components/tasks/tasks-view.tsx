"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Calendar, CheckSquare, ChevronRight, Search } from "lucide-react";
import { EmptyState } from "@/components/layout/dashboard-shell";
import { PriorityBadge, StatusBadge } from "@/components/shared/badges";
import { DataTableCard } from "@/components/shared/data-table-card";
import { EntityAvatar } from "@/components/shared/entity-avatar";
import { LinkPagination } from "@/components/shared/link-pagination";
import { SearchParamInput } from "@/components/shared/search-param-input";
import {
  ViewModeToggle,
  type ViewMode,
} from "@/components/shared/view-mode-toggle";
import { TaskCard, type TaskCardRole } from "@/components/tasks/task-card";
import { TaskStatusSelect } from "@/components/tasks/task-status-select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { isMemberStatusLocked, TASK_STATUS_LABELS } from "@/lib/task-status";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import type { TaskStatus, TaskWithDetails } from "@/types/database";

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

function memberProfileHref(role: TaskCardRole, memberId: string) {
  if (role === "team_lead") return `/team-lead/members/${memberId}`;
  if (role === "admin") return `/admin/users/${memberId}`;
  return undefined;
}

const BOARD_COLUMNS: TaskStatus[] = [
  "todo",
  "in_progress",
  "review",
  "rework",
  "done",
];

export interface TasksViewPagination {
  page: number;
  pageSize: number;
  total: number;
}

export function TasksView({
  tasks,
  role,
  viewStorageKey,
  searchPlaceholder = "Search tasks by title, project, assignee, or status...",
  emptyTitle = "No tasks found",
  emptyDescription = "Tasks will appear here once they are created or assigned.",
  pagination,
}: {
  tasks: TaskWithDetails[];
  role: TaskCardRole;
  viewStorageKey: string;
  searchPlaceholder?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  /**
   * When provided, `tasks` is treated as a single server-fetched page (search
   * and paging happen via URL params + a server re-fetch) instead of a
   * fully-loaded array filtered client-side. Board/card views then only show
   * the current page's tasks — an accepted trade-off for large datasets.
   */
  pagination?: TasksViewPagination;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const serverPaginated = Boolean(pagination);
  const urlQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [items, setItems] = useState(tasks);
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [updatingTaskIds, setUpdatingTaskIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const saved = localStorage.getItem(viewStorageKey);
    if (saved === "list" || saved === "card" || saved === "board") {
      setViewMode(saved);
    }
  }, [viewStorageKey]);

  useEffect(() => {
    setItems(tasks);
  }, [tasks]);

  function handleViewChange(mode: ViewMode) {
    setViewMode(mode);
    localStorage.setItem(viewStorageKey, mode);
  }

  function buildPageHref(targetPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (targetPage > 1) params.set("page", String(targetPage));
    else params.delete("page");
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  const filteredTasks = useMemo(() => {
    if (serverPaginated) return items;
    return items.filter((task) => matchesTask(task, query));
  }, [items, query, serverPaginated]);

  const activeSearchTerm = serverPaginated ? urlQuery : query;
  const showAssignee = role !== "member";

  async function persistStatusChange(
    task: TaskWithDetails,
    nextStatus: TaskStatus
  ) {
    if (task.status === nextStatus) return;
    if (updatingTaskIds.has(task.id)) return;

    if (role !== "member" && task.status === "review" && nextStatus === "rework") {
      toast({
        title: "Rework needs a reason",
        description: "Use the status dropdown Rework option to add a comment.",
      });
      return;
    }

    if (role === "member" && isMemberStatusLocked(task.status)) {
      toast({
        title: "Status locked",
        description:
          task.status === "review"
            ? "This task is awaiting team lead review."
            : "This task is already completed.",
      });
      return;
    }

    const previousStatus = task.status;
    setUpdatingTaskIds((prev) => new Set(prev).add(task.id));
    setItems((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
    );

    try {
      let res: Response;
      if (role !== "member" && previousStatus === "review" && nextStatus === "done") {
        res = await fetch("/api/tasks/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskId: task.id, decision: "approve" }),
        });
      } else {
        res = await fetch("/api/admin/tasks", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskId: task.id, status: nextStatus }),
        });
      }

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to update task status.");
      }
    } catch (error) {
      setItems((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: previousStatus } : t))
      );
      toast({
        title: "Could not move task",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
      return;
    } finally {
      setUpdatingTaskIds((prev) => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
    }

    toast({ title: "Status updated" });
    router.refresh();
  }

  function handleDragStart(taskId: string) {
    setDragTaskId(taskId);
  }

  function handleDrop(nextStatus: TaskStatus) {
    if (!dragTaskId) return;
    const task = items.find((t) => t.id === dragTaskId);
    setDragTaskId(null);
    if (!task) return;
    void persistStatusChange(task, nextStatus);
  }

  if (items.length === 0 && !activeSearchTerm) {
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
      <Card className="border-slate-200 p-4 shadow-sm dark:border-slate-800">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {serverPaginated ? (
            <SearchParamInput
              className="relative min-w-0 flex-1 sm:max-w-md"
              placeholder={searchPlaceholder}
            />
          ) : (
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
          )}
          <ViewModeToggle value={viewMode} onChange={handleViewChange} />
        </div>
      </Card>

      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No tasks found"
          description={`No tasks match "${activeSearchTerm}". Try a different search.`}
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
      ) : viewMode === "board" ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">
            Drag cards between columns to update status.
          </p>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {BOARD_COLUMNS.map((status) => {
              const columnItems = filteredTasks.filter((t) => t.status === status);
              return (
                <div
                  key={status}
                  className="rounded-xl border border-slate-200 bg-white/90 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/70"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(status)}
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <StatusBadge
                      status={status}
                      audience={role === "member" ? "member" : undefined}
                    />
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {columnItems.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {columnItems.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-slate-200 p-3 text-center text-xs text-slate-400 dark:border-slate-700 dark:text-slate-500">
                        Drop here
                      </div>
                    ) : (
                      columnItems.map((task) => {
                        const href = taskDetailHref(role, task.id);
                        const memberLocked =
                          role === "member" && isMemberStatusLocked(task.status);
                        const canDrag = !memberLocked && !updatingTaskIds.has(task.id);
                        return (
                          <div
                            key={task.id}
                            draggable={canDrag}
                            onDragStart={() => canDrag && handleDragStart(task.id)}
                            className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-opacity hover:shadow dark:border-slate-700 dark:bg-slate-900"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="line-clamp-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                {task.title}
                              </p>
                              {updatingTaskIds.has(task.id) && (
                                <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                                  Saving
                                </span>
                              )}
                            </div>
                            <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                              [{task.project?.key}] {task.project?.name}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              <PriorityBadge priority={task.priority} />
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {TASK_STATUS_LABELS[task.status]}
                              </span>
                              {href && (
                                <Link
                                  href={href}
                                  className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                                >
                                  View
                                </Link>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <DataTableCard
          total={pagination?.total ?? filteredTasks.length}
          scrollable={false}
          pagination={
            pagination ? (
              <LinkPagination
                page={pagination.page}
                pageSize={pagination.pageSize}
                total={pagination.total}
                itemLabel="task"
                buildHref={buildPageHref}
              />
            ) : undefined
          }
        >
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
                          (() => {
                            const memberHref = memberProfileHref(
                              role,
                              task.assignee_id!
                            );
                            const content = (
                              <>
                                <EntityAvatar
                                  name={
                                    task.assignee.full_name ||
                                    task.assignee.email
                                  }
                                  size="sm"
                                />
                                <span className="truncate text-slate-700">
                                  {task.assignee.full_name}
                                </span>
                              </>
                            );
                            return memberHref ? (
                              <Link
                                href={memberHref}
                                className="flex min-w-0 items-center gap-2 hover:text-blue-600"
                              >
                                {content}
                              </Link>
                            ) : (
                              <div className="flex min-w-0 items-center gap-2">
                                {content}
                              </div>
                            );
                          })()
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
