import { Suspense } from "react";
import {
  UsersRound,
  Users,
  UserCog,
  CalendarDays,
} from "lucide-react";
import { PageShell } from "@/components/layout/dashboard-shell";
import { CreateTeamDialog } from "@/components/admin/create-team-dialog";
import { TeamsList } from "@/components/admin/teams-list";
import { StatCard, StatsGrid } from "@/components/admin/stat-card";
import { getUsers, getTeams, getTeamMembers } from "@/lib/data/queries";

export default async function AdminTeamsPage() {
  const [teams, users] = await Promise.all([getTeams(), getUsers()]);

  const teamsWithMembers = await Promise.all(
    teams.map(async (team) => {
      const members = await getTeamMembers(team.id);
      return { ...team, members, memberIds: members.map((m) => m.id) };
    })
  );

  const totalMembers = teamsWithMembers.reduce(
    (sum, team) => sum + team.memberIds.length,
    0
  );
  const teamLeads = teams.filter((t) => t.lead_id).length;
  const thisMonth = teams.filter((t) => {
    const created = new Date(t.created_at);
    const now = new Date();
    return (
      created.getMonth() === now.getMonth() &&
      created.getFullYear() === now.getFullYear()
    );
  }).length;

  return (
    <PageShell
      title="Teams"
      description="Create teams and assign members to manage work efficiently."
      action={<CreateTeamDialog users={users} />}
      stats={
        <StatsGrid>
          <StatCard
            label="Total Teams"
            value={teams.length}
            subtext="Across your organization"
            icon={UsersRound}
            accent="blue"
          />
          <StatCard
            label="Total Members"
            value={totalMembers}
            subtext="Active team members"
            icon={Users}
            accent="green"
          />
          <StatCard
            label="Team Leads"
            value={teamLeads}
            subtext="Leading teams"
            icon={UserCog}
            accent="purple"
          />
          <StatCard
            label="Recently Created"
            value={thisMonth}
            subtext="This month"
            icon={CalendarDays}
            accent="orange"
          />
        </StatsGrid>
      }
    >
      <Suspense fallback={null}>
        <TeamsList teams={teamsWithMembers} users={users} />
      </Suspense>
    </PageShell>
  );
}
