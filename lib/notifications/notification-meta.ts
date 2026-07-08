import {
  CheckCheck,
  CheckCircle2,
  History,
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
    ring: "ring-emerald-100",
    verb: "approved your task",
    accentBg: "bg-emerald-50",
    accentBorder: "border-emerald-100",
    accentText: "text-emerald-900",
  },
  task_rejected: {
    icon: RotateCcw,
    badgeBg: "bg-amber-500",
    badgeText: "text-white",
    ring: "ring-amber-100",
    verb: "assigned rework on your task",
    accentBg: "bg-amber-50",
    accentBorder: "border-amber-100",
    accentText: "text-amber-900",
  },
  task_reopened: {
    icon: History,
    badgeBg: "bg-orange-500",
    badgeText: "text-white",
    ring: "ring-orange-100",
    verb: "reopened your task",
    accentBg: "bg-orange-50",
    accentBorder: "border-orange-100",
    accentText: "text-orange-900",
  },
  task_submitted: {
    icon: Send,
    badgeBg: "bg-blue-500",
    badgeText: "text-white",
    ring: "ring-blue-100",
    verb: "submitted for review",
    accentBg: "bg-blue-50",
    accentBorder: "border-blue-100",
    accentText: "text-blue-900",
  },
  task_completed: {
    icon: CheckCircle2,
    badgeBg: "bg-emerald-500",
    badgeText: "text-white",
    ring: "ring-emerald-100",
    verb: "completed",
    accentBg: "bg-emerald-50",
    accentBorder: "border-emerald-100",
    accentText: "text-emerald-900",
  },
  task_created: {
    icon: Plus,
    badgeBg: "bg-violet-500",
    badgeText: "text-white",
    ring: "ring-violet-100",
    verb: "created",
    accentBg: "bg-violet-50",
    accentBorder: "border-violet-100",
    accentText: "text-violet-900",
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
