"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/layout/dashboard-shell";
import { NotificationItem } from "@/components/notifications/notification-item";
import type { AppRole } from "@/types/database";
import type { NotificationWithDetails } from "@/lib/data/notifications";

export function NotificationsList({
  role,
  initialNotifications,
}: {
  role: AppRole;
  initialNotifications: NotificationWithDetails[];
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      setLoading(true);
      try {
        const res = await fetch("/api/notifications");
        if (res.ok && !cancelled) {
          const json = await res.json();
          setNotifications(json.notifications ?? []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    refresh();
    return () => {
      cancelled = true;
    };
  }, []);

  async function markRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
  }

  function handleToggle(notification: NotificationWithDetails) {
    const willExpand = expandedId !== notification.id;
    setExpandedId(willExpand ? notification.id : null);
    if (willExpand && !notification.is_read) {
      markRead(notification.id);
    }
  }

  if (notifications.length === 0 && !loading) {
    return (
      <EmptyState
        icon={Bell}
        title="No notifications yet"
        description="When a team lead approves or requests changes on your tasks, you'll see it here."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {unreadCount > 0
            ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
            : "You're all caught up"}
        </p>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all as read
          </button>
        )}
      </div>

      {loading && notifications.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500 dark:text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
          Loading notifications...
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
            />
          ))}
        </ul>
      )}
    </div>
  );
}
