import { getCurrentProfile } from "@/lib/auth/get-profile";
import { getLedTeamsForUser, getTeamLeadManagedProjects } from "@/lib/data/team-lead-projects";
import { TeamLeadProjectsManager } from "@/components/team-lead/team-lead-projects-manager";

export default async function TeamLeadProjectsPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const [projects, teams] = await Promise.all([
    getTeamLeadManagedProjects(profile.id),
    getLedTeamsForUser(profile.id),
  ]);

  return (
    <div className="flex flex-1 flex-col p-6 lg:p-8">
      <TeamLeadProjectsManager projects={projects} teams={teams} />
    </div>
  );
}
