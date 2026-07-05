import Link from "next/link";
import { Calendar, ChevronRight, ListTodo, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EntityAvatar } from "@/components/shared/entity-avatar";
import { formatDate } from "@/lib/utils";
import type { ProjectWithDetails } from "@/types/database";

export function ProjectCard({
  project,
  detailHref,
  myTaskCount,
}: {
  project: ProjectWithDetails;
  detailHref: string;
  myTaskCount?: number;
}) {
  return (
    <Card className="group flex h-full flex-col border-slate-200 shadow-sm transition-shadow hover:shadow-md">
      <Link href={detailHref} className="flex flex-1 flex-col p-5">
        <div className="flex items-start gap-3">
          <EntityAvatar name={project.name} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-900 group-hover:text-blue-600">
              {project.name}
            </p>
            {project.description && (
              <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                {project.description}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-semibold text-slate-700">
            {project.key}
          </span>
          <Badge variant={project.status}>{project.status}</Badge>
        </div>

        <div className="mt-4 space-y-2 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <UsersRound className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="truncate">{project.team?.name ?? "No team"}</span>
          </div>
          <div className="flex items-center gap-2">
            <ListTodo className="h-4 w-4 shrink-0 text-slate-400" />
            <span>
              {myTaskCount != null
                ? `${myTaskCount} my task${myTaskCount !== 1 ? "s" : ""}`
                : `${project.task_count ?? 0} task${(project.task_count ?? 0) !== 1 ? "s" : ""}`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
            {project.start_date && project.due_date ? (
              <span>
                {formatDate(project.start_date)} – {formatDate(project.due_date)}
              </span>
            ) : (
              formatDate(project.created_at)
            )}
          </div>
        </div>
      </Link>

      <div className="border-t border-slate-100 px-5 py-3">
        <Button
          variant="ghost"
          size="sm"
          className="h-auto w-full justify-between p-0 text-sm font-medium text-blue-600 hover:bg-transparent hover:text-blue-700"
          asChild
        >
          <Link href={detailHref}>
            View details
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
