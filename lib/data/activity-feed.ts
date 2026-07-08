import {
  buildActivityFeed,
  buildPersonalActivityFeed,
} from "@/lib/activity/build-feed";
import { getMemberTeamIds } from "@/lib/data/queries";
import { getLedTeamIds } from "@/lib/data/team-lead";

/** Actions performed by the signed-in user (tasks, reviews, projects). */
export async function getPersonalActivityFeed(userId: string, limit = 80) {
  return buildPersonalActivityFeed(userId, limit);
}

/** Activity on tasks across the member's team projects. */
export async function getMemberActivityFeed(userId: string, limit = 80) {
  const teamIds = await getMemberTeamIds(userId);
  return buildActivityFeed({ teamIds }, limit);
}

/** Activity on tasks across projects on teams the user leads. */
export async function getTeamLeadActivityFeed(userId: string, limit = 80) {
  const teamIds = await getLedTeamIds(userId);
  return buildActivityFeed({ teamIds }, limit);
}

/** Org-wide recent activity for admins. */
export async function getAdminActivityFeed(limit = 80) {
  return buildActivityFeed({ orgWide: true }, limit);
}

/** Scoped project activity (project detail recent block). */
export async function getProjectActivityFeed(
  projectId: string,
  limit = 10
) {
  return buildActivityFeed({ projectIds: [projectId] }, limit);
}
