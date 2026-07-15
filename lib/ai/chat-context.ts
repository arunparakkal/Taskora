import type { Profile } from "@/types/database";
import { getAdminDashboardStats } from "@/lib/data/admin-dashboard";
import { getUnreadNotificationCount } from "@/lib/data/notifications";
import {
  getMemberSelfPerformance,
  getTeamLeadPerformance,
} from "@/lib/data/performance";
import { getTasks } from "@/lib/data/queries";
import {
  getTeamLeadAvailability,
  getTeamLeadDashboardStats,
} from "@/lib/data/team-lead";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(days: number) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function isOpenStatus(status: string) {
  return status !== "done";
}

async function buildMemberCard(profile: Profile): Promise<string> {
  const [tasks, performance, unread] = await Promise.all([
    getTasks({ forUserId: profile.id }),
    getMemberSelfPerformance(profile.id, "month"),
    getUnreadNotificationCount(),
  ]);

  const today = todayIso();
  const weekEnd = addDaysIso(7);
  const open = tasks.filter((t) => isOpenStatus(t.status));
  const overdue = open.filter((t) => t.due_date && t.due_date < today);
  const dueThisWeek = open.filter(
    (t) => t.due_date && t.due_date >= today && t.due_date <= weekEnd
  );

  const topOverdue = overdue.slice(0, 5).map((t) => ({
    title: t.title,
    due: t.due_date,
    status: t.status,
    priority: t.priority,
  }));
  const topDue = dueThisWeek.slice(0, 5).map((t) => ({
    title: t.title,
    due: t.due_date,
    status: t.status,
    priority: t.priority,
  }));

  const perf = performance.performance;

  return [
    `Role: member`,
    `Open tasks: ${open.length}`,
    `Overdue: ${overdue.length}`,
    `Due this week: ${dueThisWeek.length}`,
    `Unread notifications: ${unread}`,
    `Performance (${performance.periodLabel}): overall ${perf.overall}/100 (${perf.level})`,
    `Pillars — quality ${perf.pillars.quality.percent}%, delivery ${perf.pillars.delivery.percent}%, productivity ${perf.pillars.productivity.percent}%, reliability ${perf.pillars.reliability.percent}%`,
    topOverdue.length
      ? `Sample overdue: ${JSON.stringify(topOverdue)}`
      : "Sample overdue: none",
    topDue.length
      ? `Sample due this week: ${JSON.stringify(topDue)}`
      : "Sample due this week: none",
  ].join("\n");
}

async function buildTeamLeadCard(profile: Profile): Promise<string> {
  const [stats, availability, performance, unread] = await Promise.all([
    getTeamLeadDashboardStats(profile.id),
    getTeamLeadAvailability(profile.id),
    getTeamLeadPerformance(profile.id, "month"),
    getUnreadNotificationCount(),
  ]);

  const free = availability.members
    .filter((m) => m.workload.status === "available")
    .slice(0, 5)
    .map((m) => ({
      name: m.profile.full_name || m.profile.email,
      load: m.workload.loadPoints,
      open: m.workload.openTasks,
      team: m.teamName,
    }));

  const overloaded = availability.members
    .filter((m) => m.workload.status === "overloaded")
    .slice(0, 5)
    .map((m) => ({
      name: m.profile.full_name || m.profile.email,
      load: m.workload.loadPoints,
      open: m.workload.openTasks,
    }));

  const atRisk = performance.entries
    .filter(
      (e) =>
        e.performance.level === "at_risk" ||
        e.performance.level === "needs_improvement"
    )
    .slice(0, 5)
    .map((e) => ({
      name: e.profile.full_name || e.profile.email,
      score: e.performance.overall,
      level: e.performance.level,
    }));

  return [
    `Role: team_lead`,
    `Teams led: ${stats.teams}`,
    `Members: ${stats.members}`,
    `Projects: ${stats.projects.total} (${stats.projects.active} active)`,
    `Tasks: ${stats.tasks.total} — review queue ${stats.tasks.inReview}, overdue ${stats.tasks.overdue}, unassigned ${stats.tasks.unassigned}`,
    `Availability: ${availability.summary.available} available, ${availability.summary.moderate} moderate, ${availability.summary.atCapacity} at capacity, ${availability.summary.overloaded} overloaded`,
    `Unread notifications: ${unread}`,
    free.length ? `Freest members: ${JSON.stringify(free)}` : "Freest members: none marked available",
    overloaded.length
      ? `Overloaded: ${JSON.stringify(overloaded)}`
      : "Overloaded: none",
    atRisk.length
      ? `At-risk / needs improvement performers: ${JSON.stringify(atRisk)}`
      : "At-risk performers: none",
  ].join("\n");
}

async function buildAdminCard(profile: Profile): Promise<string> {
  const [stats, unread] = await Promise.all([
    getAdminDashboardStats(),
    getUnreadNotificationCount(),
  ]);

  return [
    `Role: admin`,
    `Users: ${stats.users.total} (admins ${stats.users.byRole.admin}, leads ${stats.users.byRole.team_lead}, members ${stats.users.byRole.member})`,
    `Teams: ${stats.teams.total}`,
    `Projects: ${stats.projects.total} (${stats.projects.active} active)`,
    `Tasks: ${stats.tasks.total} — todo ${stats.tasks.byStatus.todo ?? 0}, in_progress ${stats.tasks.byStatus.in_progress ?? 0}, review ${stats.tasks.byStatus.review ?? 0}, done ${stats.tasks.byStatus.done ?? 0}`,
    `Unassigned tasks: ${stats.tasks.unassigned}`,
    `Overdue tasks: ${stats.tasks.overdue}`,
    `Unread notifications: ${unread}`,
    `Note: admin user ${profile.full_name || profile.email}`,
  ].join("\n");
}

/**
 * Compact, role-aware snapshot injected into the assistant system prompt.
 * Failures are swallowed into a short fallback so chat still works.
 */
export async function buildUserContextCard(profile: Profile): Promise<string> {
  try {
    if (profile.role === "admin") return await buildAdminCard(profile);
    if (profile.role === "team_lead") return await buildTeamLeadCard(profile);
    return await buildMemberCard(profile);
  } catch (error) {
    console.error("[chat-context] failed to build context card:", error);
    return `Role: ${profile.role}\nContext temporarily unavailable. Answer with general product guidance only.`;
  }
}
