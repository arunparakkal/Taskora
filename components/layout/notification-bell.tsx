"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationItem } from "@/components/notifications/notification-item";
import { getNotificationsHref } from "@/lib/notifications/notification-meta";
import type { AppRole } from "@/types/database";
import type { NotificationWithDetails } from "@/lib/data/notifications";

const POLL_INTERVAL_MS = 30000;
const BELL_PREVIEW_LIMIT = 10;

export function NotificationBell({ role }: { role: AppRole }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationWithDetails[]>(
    []
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=0");
      if (!res.ok) return;
      const json = await res.json();
      setUnreadCount(json.unreadCount ?? 0);
    } catch {
      // Silent — notifications are non-critical background data.
    }
  }, []);

  const fetchRecentNotifications = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/notifications?limit=${BELL_PREVIEW_LIMIT}`
      );
      if (!res.ok) return;
      const json = await res.json();
      setNotifications((json.notifications ?? []).slice(0, BELL_PREVIEW_LIMIT));
      setUnreadCount(json.unreadCount ?? 0);
    } catch {
      // Silent — notifications are non-critical background data.
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setExpandedId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function markRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
  }

  async function handleToggle(notification: NotificationWithDetails) {
    const willExpand = expandedId !== notification.id;
    setExpandedId(willExpand ? notification.id : null);
    if (willExpand && !notification.is_read) {
      markRead(notification.id);
    }
  }

  async function handleOpen() {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      await fetchRecentNotifications();
      setLoading(false);
    } else {
      setExpandedId(null);
    }
  }

  const unreadRejections = notifications.filter(
    (n) => !n.is_read && n.type === "task_rejected"
  ).length;
  const hasUnreadRejections = unreadRejections > 0;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5",
          hasUnreadRejections &&
            "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
        )}
        aria-label="Notifications"
      >
        <Bell
          className={cn(
            "h-5 w-5",
            hasUnreadRejections && "text-red-600 dark:text-red-400"
          )}
        />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 animate-pulse items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className={cn(
            "absolute right-0 top-[calc(100%+10px)] z-[100] w-[22rem] max-w-[calc(100vw-2rem)]",
            "overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl",
            "dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40"
          )}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Notifications
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                {notifications.length > 0
                  ? `${Math.min(notifications.length, BELL_PREVIEW_LIMIT)} most recent`
                  : "No recent notifications"}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[26rem] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500 dark:text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <div className="rounded-full bg-slate-100 p-3 dark:bg-slate-800">
                  <Bell className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  You&apos;re all caught up
                </p>
                <p className="max-w-[14rem] text-xs text-slate-400 dark:text-slate-500">
                  Review approvals and change requests will show up here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-50 dark:divide-slate-800">
                {notifications.map((n) => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    role={role}
                    expanded={expandedId === n.id}
                    onToggle={() => handleToggle(n)}
                    compact
                  />
                ))}
              </ul>
            )}
          </div>

          <Link
            href={getNotificationsHref(role)}
            onClick={() => setOpen(false)}
            className="block border-t border-slate-100 px-4 py-2.5 text-center text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-slate-100"
          >
            See all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
