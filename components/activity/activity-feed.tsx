"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  FolderKanban,
  History,
  MessageSquareQuote,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  UserPlus,
  UsersRound,
} from "lucide-react";
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
  type ActivityEventType,
  type ActivityFeedItem,
  type ActivityFilterType,
} from "@/lib/activity/types";
import { cn, formatDateTime, formatRelativeTime } from "@/lib/utils";
import type { AppRole } from "@/types/database";

type EventStyle = {
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  badge: string;
};

const EVENT_STYLES: Record<ActivityEventType, EventStyle> = {
  task_status_changed: {
    icon: History,
    iconBg: "bg-blue-500/10 dark:bg-blue-500/15",
    iconColor: "text-blue-600 dark:text-blue-400",
    badge:
      "bg-blue-50 text-blue-700 ring-blue-500/15 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/25",
  },
  task_approved: {
    icon: CheckCircle2,
    iconBg: "bg-emerald-500/10 dark:bg-emerald-500/15",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    badge:
      "bg-emerald-50 text-emerald-700 ring-emerald-500/15 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/25",
  },
  task_rework: {
    icon: RotateCcw,
    iconBg: "bg-amber-500/10 dark:bg-amber-500/15",
    iconColor: "text-amber-600 dark:text-amber-400",
    badge:
      "bg-amber-50 text-amber-800 ring-amber-500/15 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/25",
  },
  task_reopened: {
    icon: RotateCcw,
    iconBg: "bg-violet-500/10 dark:bg-violet-500/15",
    iconColor: "text-violet-600 dark:text-violet-400",
    badge:
      "bg-violet-50 text-violet-700 ring-violet-500/15 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/25",
  },
  task_created: {
    icon: Plus,
    iconBg: "bg-indigo-500/10 dark:bg-indigo-500/15",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    badge:
      "bg-indigo-50 text-indigo-700 ring-indigo-500/15 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/25",
  },
  project_created: {
    icon: FolderKanban,
    iconBg: "bg-sky-500/10 dark:bg-sky-500/15",
    iconColor: "text-sky-600 dark:text-sky-400",
    badge:
      "bg-sky-50 text-sky-700 ring-sky-500/15 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/25",
  },
  project_status_changed: {
    icon: FolderKanban,
    iconBg: "bg-cyan-500/10 dark:bg-cyan-500/15",
    iconColor: "text-cyan-600 dark:text-cyan-400",
    badge:
      "bg-cyan-50 text-cyan-700 ring-cyan-500/15 dark:bg-cyan-500/10 dark:text-cyan-300 dark:ring-cyan-500/25",
  },
  team_created: {
    icon: UsersRound,
    iconBg: "bg-teal-500/10 dark:bg-teal-500/15",
    iconColor: "text-teal-600 dark:text-teal-400",
    badge:
      "bg-teal-50 text-teal-700 ring-teal-500/15 dark:bg-teal-500/10 dark:text-teal-300 dark:ring-teal-500/25",
  },
  member_added: {
    icon: UserPlus,
    iconBg: "bg-rose-500/10 dark:bg-rose-500/15",
    iconColor: "text-rose-600 dark:text-rose-400",
    badge:
      "bg-rose-50 text-rose-700 ring-rose-500/15 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/25",
  },
};

function activityTargetHref(
  item: ActivityFeedItem,
  role: AppRole,
  currentUserId: string
) {
  if (role === "admin") {
    if (item.projectId) return `/admin/projects/${item.projectId}`;
    if (item.task_id) return `/admin/tasks`;
    if (item.teamId) return `/admin/teams`;
    return "/admin/activity";
  }
  if (role === "team_lead" && item.task_id) {
    return `/team-lead/tasks/${item.task_id}`;
  }
  if (item.task_id) {
    return `/member/tasks/${item.task_id}`;
  }
  if (item.projectId) return `/member/projects/${item.projectId}`;
  return "/member/tasks";
}

function getDateGroup(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  if (date >= startOfToday) return "Today";
  if (date >= startOfYesterday) return "Yesterday";
  if (date >= startOfWeek) return "This week";
  return "Earlier";
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

function activityStats(items: ActivityFeedItem[]) {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const thisWeek = items.filter(
    (i) => new Date(i.created_at).getTime() >= weekAgo
  ).length;
  const taskIds = new Set(
    items.map((i) => i.task_id).filter(Boolean) as string[]
  );
  const approvals = items.filter((i) => i.eventType === "task_approved").length;
  const updates = items.filter((i) =>
    ["task_status_changed", "task_rework", "task_reopened"].includes(
      i.eventType
    )
  ).length;

  return {
    total: items.length,
    thisWeek,
    tasksTouched: taskIds.size,
    approvals,
    updates,
  };
}

function ActivityStatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/80 p-4 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
        {value}
      </p>
      {hint && (
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      )}
    </div>
  );
}

function ActivityFeedRow({
  item,
  role,
  currentUserId,
  personal,
  isLast,
}: {
  item: ActivityFeedItem;
  role: AppRole;
  currentUserId: string;
  personal?: boolean;
  isLast?: boolean;
}) {
  const style = EVENT_STYLES[item.eventType] ?? EVENT_STYLES.task_status_changed;
  const Icon = style.icon;
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
    !personal && (item.eventType !== "member_added" || item.actor);

  const actionText = personal
    ? item.summary.toLowerCase()
    : item.summary.toLowerCase();

  return (
    <li className="relative flex gap-4 pb-8 last:pb-0">
      {!isLast && (
        <span
          aria-hidden
          className="absolute left-[18px] top-10 bottom-0 w-px bg-gradient-to-b from-slate-200 to-transparent dark:from-slate-700"
        />
      )}
      <div
        className={cn(
          "relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-4 ring-white dark:ring-slate-950",
          style.iconBg
        )}
      >
        <Icon className={cn("h-4 w-4", style.iconColor)} />
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset",
              style.badge
            )}
          >
            {label}
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            {formatRelativeTime(item.created_at)}
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-slate-900 dark:text-slate-100">
          {personal ? (
            <span className="font-medium text-slate-700 dark:text-slate-300">
              You {actionText}
            </span>
          ) : showActor ? (
            <>
              <span className="font-semibold">{actorName}</span>{" "}
              <span className="text-slate-600 dark:text-slate-400">
                {actionText}
              </span>
            </>
          ) : (
            <span className="text-slate-700 dark:text-slate-300">
              {item.detail ?? item.summary}
            </span>
          )}
        </p>
        {hasTaskLink && item.taskTitle ? (
          <Link
            href={href}
            className="mt-1.5 block text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"
          >
            {headline}
          </Link>
        ) : item.projectId && role === "admin" ? (
          <Link
            href={href}
            className="mt-1.5 block text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"
          >
            {headline}
          </Link>
        ) : (
          <p className="mt-1.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
            {headline}
          </p>
        )}
        {projectLabel && (
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {projectLabel}
          </p>
        )}
        {item.teamName && !projectLabel && (
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Team: {item.teamName}
          </p>
        )}
        {item.detail && item.eventType !== "member_added" && (
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            {item.detail}
          </p>
        )}
        {item.comment && (
          <p className="mt-2.5 flex items-start gap-2 rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2.5 text-xs leading-relaxed text-amber-950 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
            <MessageSquareQuote className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-70" />
            <span className="line-clamp-4">{item.comment}</span>
          </p>
        )}
        <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
          {formatDateTime(item.created_at)}
        </p>
      </div>
    </li>
  );
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
  personal = false,
}: {
  activity: ActivityFeedItem[];
  role: AppRole;
  currentUserId: string;
  emptyTitle?: string;
  emptyDescription?: string;
  pageSize?: number;
  paginate?: boolean;
  personal?: boolean;
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

  const stats = useMemo(() => activityStats(filtered), [filtered]);

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

  const grouped = useMemo(() => {
    const groups = new Map<string, ActivityFeedItem[]>();
    const order = ["Today", "Yesterday", "This week", "Earlier"];
    for (const item of paginated) {
      const key = getDateGroup(item.created_at);
      const list = groups.get(key) ?? [];
      list.push(item);
      groups.set(key, list);
    }
    return order
      .filter((key) => groups.has(key))
      .map((key) => ({ key, items: groups.get(key)! }));
  }, [paginated]);

  return (
    <div className="space-y-5">
      {activity.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ActivityStatCard label="Total events" value={stats.total} />
          <ActivityStatCard
            label="This week"
            value={stats.thisWeek}
            hint="Last 7 days"
          />
          <ActivityStatCard
            label="Tasks touched"
            value={stats.tasksTouched}
          />
          <ActivityStatCard
            label={personal ? "Your updates" : "Task updates"}
            value={personal ? stats.updates + stats.approvals : stats.updates}
            hint={
              stats.approvals > 0
                ? `${stats.approvals} approval${stats.approvals !== 1 ? "s" : ""}`
                : undefined
            }
          />
        </div>
      )}

      <Card className="border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                personal
                  ? "Search your activity by task, project, or keyword..."
                  : "Search activity by task, project, team, or person..."
              }
              className="h-10 border-slate-200 bg-slate-50 pl-10 dark:border-slate-700 dark:bg-slate-800/50"
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
          icon={personal ? Sparkles : History}
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
        <Card className="overflow-hidden border-slate-200/80 shadow-sm dark:border-slate-800">
          <CardContent className="p-4 sm:p-6">
            {paginate && filtered.length > pageSize && (
              <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                {filtered.length} event{filtered.length !== 1 ? "s" : ""} total
              </p>
            )}
            <div className="space-y-8">
              {grouped.map((group) => (
                <section key={group.key}>
                  <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    {group.key}
                  </h3>
                  <ul>
                    {group.items.map((item, index) => (
                      <ActivityFeedRow
                        key={item.id}
                        item={item}
                        role={role}
                        currentUserId={currentUserId}
                        personal={personal}
                        isLast={index === group.items.length - 1}
                      />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
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
