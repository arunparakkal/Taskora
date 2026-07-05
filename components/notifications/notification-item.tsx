"use client";

import Link from "next/link";
import {
  Calendar,
  Clock,
  FolderKanban,
  MessageSquareQuote,
  UserRound,
} from "lucide-react";
import { EntityAvatar } from "@/components/shared/entity-avatar";
import { PriorityBadge, RoleBadge, StatusBadge } from "@/components/shared/badges";
import { cn, formatDate, formatDateTime, formatRelativeTime } from "@/lib/utils";
import {
  getNotificationHref,
  NOTIFICATION_META,
} from "@/lib/notifications/notification-meta";
import type { AppRole } from "@/types/database";
import type { NotificationWithDetails } from "@/lib/data/notifications";

export function NotificationItem({
  notification,
  role,
  expanded,
  onToggle,
  compact = false,
}: {
  notification: NotificationWithDetails;
  role: AppRole;
  expanded: boolean;
  onToggle: () => void;
  compact?: boolean;
}) {
  const meta = NOTIFICATION_META[notification.type];
  const Icon = meta.icon;
  const actorName =
    notification.actor?.full_name || notification.actor?.email || "Someone";
  const taskTitle = notification.task?.title ?? "a task";
  const projectLabel = notification.task?.project
    ? `[${notification.task.project.key}] ${notification.task.project.name}`
    : null;
  const href = getNotificationHref(role, notification.task_id);
  const isRejected = notification.type === "task_rejected";

  return (
    <li
      className={cn(
        "transition-colors",
        !notification.is_read &&
          (isRejected ? "bg-red-50/80" : "bg-blue-50/60")
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50",
          !notification.is_read &&
            (isRejected ? "hover:bg-red-50" : "hover:bg-blue-50")
        )}
      >
        <div className="relative shrink-0">
          <EntityAvatar name={actorName} size={compact ? "sm" : "md"} />
          <span
            className={cn(
              "absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-white",
              meta.badgeBg
            )}
          >
            <Icon className={cn("h-3 w-3", meta.badgeText)} />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm leading-snug text-slate-800">
            <span className="font-semibold text-slate-900">{actorName}</span>{" "}
            {meta.verb}{" "}
            <span className="font-semibold text-slate-900">
              &ldquo;{taskTitle}&rdquo;
            </span>
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            {formatRelativeTime(notification.created_at)} ago
          </p>
        </div>

        {!notification.is_read && (
          <span
            className={cn(
              "mt-1.5 h-2 w-2 shrink-0 rounded-full",
              isRejected ? "bg-red-500" : "bg-blue-600"
            )}
          />
        )}
      </button>

      {expanded && (
        <div
          className={cn(
            "mx-4 mb-3 space-y-3 rounded-xl border p-3.5 shadow-sm",
            meta.accentBg,
            meta.accentBorder
          )}
        >
          {notification.message && (
            <div className="rounded-xl border border-amber-200 bg-white p-3 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100">
                  <MessageSquareQuote className="h-3.5 w-3.5 text-amber-700" />
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">
                    {isRejected ? "Reason from reviewer" : "Message"}
                  </p>
                  <p className="text-xs text-slate-400">
                    Read this before updating the task.
                  </p>
                </div>
              </div>
              <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-900">
                {notification.message}
              </p>
            </div>
          )}

          <div className="rounded-xl border border-white/70 bg-white/70 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Task details
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {taskTitle}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {notification.task?.status && (
                <StatusBadge status={notification.task.status} />
              )}
              {notification.task?.priority && (
                <PriorityBadge priority={notification.task.priority} />
              )}
              {notification.task?.due_date && (
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                  <Calendar className="h-3 w-3 text-slate-400" />
                  Due {formatDate(notification.task.due_date)}
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
            <div className="flex items-center gap-2 rounded-lg bg-white/70 p-2.5">
              <UserRound className={cn("h-3.5 w-3.5", meta.accentText)} />
              <div className="min-w-0">
                <p className="font-medium text-slate-900">{actorName}</p>
                {notification.actor?.role && (
                  <div className="mt-1">
                    <RoleBadge role={notification.actor.role} />
                  </div>
                )}
              </div>
            </div>

            {projectLabel && (
              <div className="flex items-center gap-2 rounded-lg bg-white/70 p-2.5">
                <FolderKanban className="h-3.5 w-3.5 text-slate-400" />
                <span>{projectLabel}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Clock className="h-3.5 w-3.5" />
              {formatDateTime(notification.created_at)}
            </div>
            {notification.task_id && href !== "#" && (
              <Link
                href={href}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                View task →
              </Link>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
