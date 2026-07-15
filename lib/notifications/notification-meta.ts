import {
  CheckCheck,
  CheckCircle2,
  History,
  Play,
  Plus,
  RotateCcw,
  Send,
} from "lucide-react";
import type { NotificationType } from "@/types/database";

export const NOTIFICATION_META: Record<
  NotificationType,
  {
    icon: typeof CheckCheck;
    badgeBg: string;
    badgeText: string;
    ring: string;
    verb: string;
    accentBg: string;
    accentBorder: string;
    accentText: string;
  }
> = {
  task_approved: {
    icon: CheckCheck,
    badgeBg: "bg-emerald-500",
    badgeText: "text-white",
    ring: "ring-emerald-100 dark:ring-slate-900",
    verb: "approved your task",
    accentBg: "bg-emerald-50 dark:bg-emerald-500/10",
    accentBorder: "border-emerald-100 dark:border-emerald-500/20",
    accentText: "text-emerald-900 dark:text-emerald-300",
  },
  task_rejected: {
    icon: RotateCcw,
    badgeBg: "bg-amber-500",
    badgeText: "text-white",
    ring: "ring-amber-100 dark:ring-slate-900",
    verb: "assigned rework on your task",
    accentBg: "bg-amber-50 dark:bg-amber-500/10",
    accentBorder: "border-amber-100 dark:border-amber-500/20",
    accentText: "text-amber-900 dark:text-amber-300",
  },
  task_reopened: {
    icon: History,
    badgeBg: "bg-orange-500",
    badgeText: "text-white",
    ring: "ring-orange-100 dark:ring-slate-900",
    verb: "reopened your task",
    accentBg: "bg-orange-50 dark:bg-orange-500/10",
    accentBorder: "border-orange-100 dark:border-orange-500/20",
    accentText: "text-orange-900 dark:text-orange-300",
  },
  task_submitted: {
    icon: Send,
    badgeBg: "bg-blue-500",
    badgeText: "text-white",
    ring: "ring-blue-100 dark:ring-slate-900",
    verb: "submitted for review",
    accentBg: "bg-blue-50 dark:bg-blue-500/10",
    accentBorder: "border-blue-100 dark:border-blue-500/20",
    accentText: "text-blue-900 dark:text-blue-300",
  },
  task_completed: {
    icon: CheckCircle2,
    badgeBg: "bg-emerald-500",
    badgeText: "text-white",
    ring: "ring-emerald-100 dark:ring-slate-900",
    verb: "completed",
    accentBg: "bg-emerald-50 dark:bg-emerald-500/10",
    accentBorder: "border-emerald-100 dark:border-emerald-500/20",
    accentText: "text-emerald-900 dark:text-emerald-300",
  },
  task_created: {
    icon: Plus,
    badgeBg: "bg-violet-500",
    badgeText: "text-white",
    ring: "ring-violet-100 dark:ring-slate-900",
    verb: "created",
    accentBg: "bg-violet-50 dark:bg-violet-500/10",
    accentBorder: "border-violet-100 dark:border-violet-500/20",
    accentText: "text-violet-900 dark:text-violet-300",
  },
  task_started: {
    icon: Play,
    badgeBg: "bg-sky-500",
    badgeText: "text-white",
    ring: "ring-sky-100 dark:ring-slate-900",
    verb: "started working on",
    accentBg: "bg-sky-50 dark:bg-sky-500/10",
    accentBorder: "border-sky-100 dark:border-sky-500/20",
    accentText: "text-sky-900 dark:text-sky-300",
  },
};

export function getNotificationHref(
  role: "admin" | "team_lead" | "member",
  taskId: string | null
): string {
  if (!taskId) return "#";
  // Members have a dedicated task detail page; admin/team-lead land on the
  // task list (no per-task detail route exists for those roles yet).
  if (role === "member") return `/member/tasks/${taskId}`;
  return role === "admin" ? "/admin/tasks" : "/team-lead/tasks";
}

export function getNotificationsHref(role: "admin" | "team_lead" | "member") {
  const prefix =
    role === "admin" ? "/admin" : role === "team_lead" ? "/team-lead" : "/member";
  return `${prefix}/notifications`;
}
