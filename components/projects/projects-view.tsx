"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Calendar, ChevronRight, FolderKanban, Search } from "lucide-react";
import { ProjectActionsMenu } from "@/components/admin/project-actions-menu";
import { EmptyState } from "@/components/layout/dashboard-shell";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectProgressBar } from "@/components/projects/project-progress-bar";
import { Badge } from "@/components/ui/badge";
import { EntityAvatar } from "@/components/shared/entity-avatar";
import { DataTableCard } from "@/components/shared/data-table-card";
import {
  ViewModeToggle,
  type ViewMode,
} from "@/components/shared/view-mode-toggle";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PROJECT_STATUS_LABELS } from "@/lib/projects/status";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import type { ProjectWithDetails } from "@/types/database";

function matchesProject(project: ProjectWithDetails, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    project.name.toLowerCase().includes(q) ||
    project.key.toLowerCase().includes(q) ||
    (project.description?.toLowerCase().includes(q) ?? false) ||
    (project.team?.name?.toLowerCase().includes(q) ?? false)
  );
}

export function ProjectsView({
  projects,
  detailPathPrefix,
  viewStorageKey,
  searchPlaceholder = "Search projects by name, key, or team...",
  emptyTitle = "No projects yet",
  emptyDescription = "Projects will appear here once they are created.",
  myTaskCounts,
  adminMode = false,
}: {
  projects: ProjectWithDetails[];
  detailPathPrefix: string;
  viewStorageKey: string;
  searchPlaceholder?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  myTaskCounts?: Record<string, number>;
  adminMode?: boolean;
}) {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQ);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  useEffect(() => {
    setQuery(initialQ);
  }, [initialQ]);

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

  const filteredProjects = useMemo(
    () => projects.filter((p) => matchesProject(p, query)),
    [projects, query]
  );

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={FolderKanban}
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

      {filteredProjects.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No projects found"
          description={`No projects match "${query}". Try a different search.`}
        />
      ) : viewMode === "card" ? (
        <div>
          <p className="mb-4 text-sm text-slate-500">
            {filteredProjects.length} project
            {filteredProjects.length !== 1 ? "s" : ""}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                detailHref={`${detailPathPrefix}/${project.id}`}
                myTaskCount={myTaskCounts?.[project.id]}
                adminMode={adminMode}
              />
            ))}
          </div>
        </div>
      ) : (
        <DataTableCard total={filteredProjects.length}>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                <TableHead>Project</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Tasks</TableHead>
                <TableHead className="text-right">
                  {adminMode ? "Actions" : "View"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map((project) => {
                const myCount = myTaskCounts?.[project.id];
                const taskLabel =
                  myCount != null
                    ? `${myCount} mine`
                    : String(project.task_count ?? 0);
                const rate = project.completion_rate ?? 0;

                return (
                  <TableRow key={project.id} className="group">
                    <TableCell>
                      <Link
                        href={`${detailPathPrefix}/${project.id}`}
                        className="flex items-center gap-3"
                      >
                        <EntityAvatar name={project.name} />
                        <div>
                          <p className="font-semibold text-slate-900 group-hover:text-blue-600">
                            {project.name}
                          </p>
                          {project.description && (
                            <p className="line-clamp-1 text-xs text-slate-500">
                              {project.description}
                            </p>
                          )}
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-semibold text-slate-700">
                        {project.key}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {project.team?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={project.status}>
                        {PROJECT_STATUS_LABELS[project.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="min-w-[7rem]">
                      <ProjectProgressBar
                        rate={rate}
                        done={project.done_count}
                        total={project.task_count}
                        compact
                      />
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {project.start_date && project.due_date ? (
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
                          <span className="whitespace-nowrap text-sm">
                            {formatDate(project.start_date)} –{" "}
                            {formatDate(project.due_date)}
                          </span>
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-slate-600">{taskLabel}</TableCell>
                    <TableCell className="text-right">
                      {adminMode ? (
                        <ProjectActionsMenu
                          projectId={project.id}
                          projectName={project.name}
                          status={project.status}
                          detailHref={`${detailPathPrefix}/${project.id}`}
                        />
                      ) : (
                        <Button
                          variant="link"
                          className="h-auto gap-1 p-0 text-sm font-medium text-blue-600"
                          asChild
                        >
                          <Link href={`${detailPathPrefix}/${project.id}`}>
                            View
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                    </TableCell>
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
