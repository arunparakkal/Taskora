import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  History,
  MessageSquareQuote,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/badges";
import { cn, formatDateTime, formatRelativeTime } from "@/lib/utils";
import type { MemberActivityItem } from "@/lib/data/member-profile";

type EventStyle = {
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  badge: string;
};

const APPROVED_STYLE: EventStyle = {
  icon: CheckCircle2,
  iconBg: "bg-emerald-500/10 dark:bg-emerald-500/15",
  iconColor: "text-emerald-600 dark:text-emerald-400",
  badge:
    "bg-emerald-50 text-emerald-700 ring-emerald-500/15 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/25",
};

const REWORK_STYLE: EventStyle = {
  icon: RotateCcw,
  iconBg: "bg-orange-500/10 dark:bg-orange-500/15",
  iconColor: "text-orange-600 dark:text-orange-400",
  badge:
    "bg-orange-50 text-orange-800 ring-orange-500/15 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-orange-500/25",
};

const REOPENED_STYLE: EventStyle = {
  icon: RotateCcw,
  iconBg: "bg-violet-500/10 dark:bg-violet-500/15",
  iconColor: "text-violet-600 dark:text-violet-400",
  badge:
    "bg-violet-50 text-violet-700 ring-violet-500/15 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/25",
};

const STATUS_STYLE: EventStyle = {
  icon: History,
  iconBg: "bg-blue-500/10 dark:bg-blue-500/15",
  iconColor: "text-blue-600 dark:text-blue-400",
  badge:
    "bg-blue-50 text-blue-700 ring-blue-500/15 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/25",
};

function getStyle(item: MemberActivityItem): EventStyle {
  if (item.action === "approved") return APPROVED_STYLE;
  if (item.action === "changes_requested") return REWORK_STYLE;
  if (item.action === "reopened") return REOPENED_STYLE;
  return STATUS_STYLE;
}

function getLabel(item: MemberActivityItem): string {
  if (item.action === "approved") return "Approved";
  if (item.action === "changes_requested") return "Changes requested";
  if (item.action === "reopened") return "Reopened";
  if (item.from_status && item.to_status) return "Status updated";
  return "Updated";
}

function isStatusChange(item: MemberActivityItem): boolean {
  return (
    !!item.from_status &&
    !!item.to_status &&
    item.action !== "approved" &&
    item.action !== "changes_requested" &&
    item.action !== "reopened"
  );
}

function ActivityRow({
  item,
  taskHrefPrefix,
  isLast,
}: {
  item: MemberActivityItem;
  taskHrefPrefix?: string;
  isLast: boolean;
}) {
  const style = getStyle(item);
  const Icon = style.icon;
  const label = getLabel(item);
  const href =
    taskHrefPrefix && item.taskId ? `${taskHrefPrefix}/${item.taskId}` : null;

  const projectLabel =
    item.projectKey && item.projectName
      ? `[${item.projectKey}] ${item.projectName}`
      : item.projectName;

  return (
    <li className="relative flex gap-4 pb-6 last:pb-0">
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
          <span
            className="text-[11px] text-slate-400 dark:text-slate-500"
            title={formatDateTime(item.created_at)}
          >
            {formatRelativeTime(item.created_at)}
          </span>
        </div>

        {href ? (
          <Link
            href={href}
            className="mt-1.5 block truncate text-sm font-semibold text-slate-900 hover:text-blue-600 hover:underline dark:text-slate-100 dark:hover:text-blue-400"
          >
            {item.taskTitle}
          </Link>
        ) : (
          <p className="mt-1.5 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
            {item.taskTitle}
          </p>
        )}

        {projectLabel && (
          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
            {projectLabel}
          </p>
        )}

        {isStatusChange(item) && (
          <div className="mt-2 flex items-center gap-1.5">
            <StatusBadge status={item.from_status as string} />
            <ArrowRight className="h-3 w-3 text-slate-400 dark:text-slate-500" />
            <StatusBadge status={item.to_status as string} />
          </div>
        )}

        {item.comment && (
          <p className="mt-2.5 flex items-start gap-2 rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2.5 text-xs leading-relaxed text-amber-950 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
            <MessageSquareQuote className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-70" />
            <span className="line-clamp-3">{item.comment}</span>
          </p>
        )}
      </div>
    </li>
  );
}

export function ProfileActivityPreview({
  items,
  taskHrefPrefix,
  viewAllHref,
  limit = 6,
}: {
  items: MemberActivityItem[];
  taskHrefPrefix?: string;
  viewAllHref?: string;
  limit?: number;
}) {
  const visible = items.slice(0, limit);
  const hasMore = items.length > limit;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
          <History className="h-5 w-5 text-slate-500 dark:text-slate-400" />
          Recent activity
        </h3>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      <Card className="border-slate-200 shadow-sm dark:border-slate-800">
        <CardContent className="p-5 sm:p-6">
          <ul>
            {visible.map((item, index) => (
              <ActivityRow
                key={item.id}
                item={item}
                taskHrefPrefix={taskHrefPrefix}
                isLast={index === visible.length - 1}
              />
            ))}
          </ul>
          {hasMore && viewAllHref && (
            <div className="mt-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <Link
                href={viewAllHref}
                className="flex items-center justify-center gap-1.5 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                View all activity
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
