import type { AppRole } from "@/types/database";

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Admin",
  team_lead: "Team Lead",
  member: "Member",
};

export const ROLE_HOME: Record<AppRole, string> = {
  admin: "/admin",
  team_lead: "/team-lead",
  member: "/member/tasks",
};

export function canAccessAdmin(role: AppRole) {
  return role === "admin";
}

/** Admins manage the org; they are not assignable as team members or leads. */
export function canJoinTeam(role: AppRole) {
  return role !== "admin";
}

export function canBeTeamLead(role: AppRole) {
  return role === "team_lead";
}

export function canEditUser(role: AppRole) {
  return role !== "admin";
}

export function canUpdateTaskStatus(
  role: AppRole,
  options: { isAssignee: boolean; isTeamLead: boolean }
) {
  if (role === "admin") return true;
  if (role === "team_lead" && options.isTeamLead) return true;
  if (role === "member" && options.isAssignee) return true;
  return false;
}
