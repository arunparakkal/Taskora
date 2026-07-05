import { Suspense } from "react";
import { Users, Shield, UserCog, User } from "lucide-react";
import { PageShell } from "@/components/layout/dashboard-shell";
import { CreateUserDialog } from "@/components/admin/create-user-dialog";
import { UsersList } from "@/components/admin/users-list";
import { StatCard, StatsGrid } from "@/components/admin/stat-card";
import { AdminPageSkeleton } from "@/app/(dashboard)/admin/loading";
import { getCurrentProfile } from "@/lib/auth/get-profile";
import { getUsers } from "@/lib/data/queries";
import type { AppRole } from "@/types/database";

function countByRole(users: { role: AppRole }[]) {
  const counts: Record<AppRole, number> = {
    admin: 0,
    team_lead: 0,
    member: 0,
  };
  for (const user of users) {
    counts[user.role]++;
  }
  return counts;
}

async function AdminUsersContent() {
  const [users, currentProfile] = await Promise.all([
    getUsers(),
    getCurrentProfile(),
  ]);

  const roleCounts = countByRole(users);

  return (
    <PageShell
      title="Users"
      description="Create and manage user accounts and roles across your organization."
      action={<CreateUserDialog />}
      stats={
        <StatsGrid>
          <StatCard
            label="Total Users"
            value={users.length}
            subtext="Across your organization"
            icon={Users}
            accent="blue"
          />
          <StatCard
            label="Admins"
            value={roleCounts.admin}
            subtext="Full access users"
            icon={Shield}
            accent="purple"
          />
          <StatCard
            label="Team Leads"
            value={roleCounts.team_lead}
            subtext="Managing teams"
            icon={UserCog}
            accent="green"
          />
          <StatCard
            label="Members"
            value={roleCounts.member}
            subtext="Standard users"
            icon={User}
            accent="orange"
          />
        </StatsGrid>
      }
    >
      <Suspense fallback={null}>
        <UsersList users={users} currentUserId={currentProfile?.id} />
      </Suspense>
    </PageShell>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <AdminUsersContent />
    </Suspense>
  );
}
