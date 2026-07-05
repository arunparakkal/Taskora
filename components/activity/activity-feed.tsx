"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { History, MessageSquareQuote, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TablePagination } from "@/components/shared/table-pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/layout/dashboard-shell";
import {
  ACTIVITY_EVENT_LABELS,
  ACTIVITY_FILTER_OPTIONS,
  type ActivityFeedItem,
  type ActivityFilterType,
} from "@/lib/activity/types";
import { formatDateTime } from "@/lib/utils";
import type { AppRole } from "@/types/database";

function activityTargetHref(
  item: ActivityFeedItem,
  role: AppRole,
  currentUserId: string
) {
  if (role === "admin") {
    if (item.projectId) return `/admin/projects/${item.projectId}`;
    if (item.teamId) return `/admin/teams`;
    return "/admin/activity";
  }
  if (role === "team_lead" && item.task_id) {
    return `/team-lead/tasks/${item.task_id}`;
  }
  if (item.task_id && item.assigneeId === currentUserId) {
    return `/member/tasks/${item.task_id}`;
  }
  if (item.projectId) return `/member/projects/${item.projectId}`;
  return "/member/tasks";
}

function ActivityFeedRow({
  item,
  role,
  currentUserId,
}: {
  item: ActivityFeedItem;
  role: AppRole;
  currentUserId: string;
}) {
  const actorName =
    item.actor?.full_name || item.actor?.email || "Someone";
  const label = ACTIVITY_EVENT_LABELS[item.eventType] ?? item.summary;
  const href = activityTargetHref(item, role, currentUserId);
  const headline = item.taskTitle || item.summary;
  const hasTaskLink = !!item.task_id || item.eventType.startsWith("task_");

  const projectLabel =
    item.projectKey && item.projectName
      ? `[${item.projectKey}] ${item.projectName}`
      : item.projectName;

  const showActor =
    item.eventType !== "member_added" || item.actor;

  return (
    <li className="flex gap-4 border-b border-slate-100 px-1 py-4 last:border-0">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100">
        <History className="h-4 w-4 text-slate-500" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
            {label}
          </span>
        </div>
        <p className="mt-1.5 text-sm text-slate-900">
          {showActor ? (
            <>
              <span className="font-semibold">{actorName}</span>{" "}
              <span className="text-slate-600">{item.summary.toLowerCase()}</span>
            </>
          ) : (
            <span className="text-slate-700">{item.detail ?? item.summary}</span>
          )}
        </p>
        {hasTaskLink && item.taskTitle ? (
          <Link
            href={href}
            className="mt-1 block text-sm font-medium text-blue-600 hover:underline"
          >
            {headline}
          </Link>
        ) : item.projectId && role === "admin" ? (
          <Link
            href={href}
            className="mt-1 block text-sm font-medium text-blue-600 hover:underline"
          >
            {headline}
          </Link>
        ) : (
          <p className="mt-1 text-sm font-medium text-slate-800">{headline}</p>
        )}
        {projectLabel && (
          <p className="mt-0.5 text-xs text-slate-500">{projectLabel}</p>
        )}
        {item.teamName && !projectLabel && (
          <p className="mt-0.5 text-xs text-slate-500">Team: {item.teamName}</p>
        )}
        {item.detail && item.eventType !== "member_added" && (
          <p className="mt-1 text-xs text-slate-500">{item.detail}</p>
        )}
        {item.comment && (
          <p className="mt-2 flex items-start gap-1.5 rounded-md border border-amber-100 bg-amber-50/80 px-2.5 py-2 text-xs text-amber-900">
            <MessageSquareQuote className="mt-0.5 h-3 w-3 shrink-0" />
            <span className="line-clamp-3">{item.comment}</span>
          </p>
        )}
        <p className="mt-2 text-[11px] text-slate-400">
          {formatDateTime(item.created_at)}
        </p>
      </div>
    </li>
  );
}

function matchesSearch(item: ActivityFeedItem, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    item.summary,
    item.detail,
    item.taskTitle,
    item.projectName,
    item.projectKey,
    item.teamName,
    item.actor?.full_name,
    item.actor?.email,
    item.comment,
    ACTIVITY_EVENT_LABELS[item.eventType],
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

const ACTIVITY_PAGE_SIZE = 15;

export function ActivityFeed({
  activity,
  role,
  currentUserId,
  emptyTitle = "No activity yet",
  emptyDescription = "Updates from your team will show up here.",
  pageSize = ACTIVITY_PAGE_SIZE,
  paginate = true,
}: {
  activity: ActivityFeedItem[];
  role: AppRole;
  currentUserId: string;
  emptyTitle?: string;
  emptyDescription?: string;
  pageSize?: number;
  paginate?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<ActivityFilterType>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [query, typeFilter]);

  const filtered = useMemo(() => {
    return activity.filter((item) => {
      if (typeFilter !== "all" && item.eventType !== typeFilter) return false;
      return matchesSearch(item, query);
    });
  }, [activity, query, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginated = useMemo(() => {
    if (!paginate) return filtered;
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, paginate, currentPage, pageSize]);

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search activity by task, project, team, or person..."
              className="h-10 border-slate-200 bg-slate-50 pl-10"
            />
          </div>
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as ActivityFilterType)}
          >
            <SelectTrigger className="h-10 w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              {ACTIVITY_FILTER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {activity.length === 0 ? (
        <EmptyState
          icon={History}
          title={emptyTitle}
          description={emptyDescription}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matching activity"
          description="Try a different search or filter type."
        />
      ) : (
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-2 sm:p-4">
            {paginate && filtered.length > pageSize && (
              <p className="mb-2 px-1 text-xs text-slate-500">
                {filtered.length} event{filtered.length !== 1 ? "s" : ""} total
              </p>
            )}
            <ul>
              {paginated.map((item) => (
                <ActivityFeedRow
                  key={item.id}
                  item={item}
                  role={role}
                  currentUserId={currentUserId}
                />
              ))}
            </ul>
          </CardContent>
          {paginate && filtered.length > pageSize && (
            <TablePagination
              total={filtered.length}
              page={currentPage}
              pageSize={pageSize}
              onPageChange={setPage}
              itemLabel="event"
            />
          )}
        </Card>
      )}
    </div>
  );
}
