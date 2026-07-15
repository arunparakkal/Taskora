import { Suspense } from "react";
import { Users, Shield, UserCog, User } from "lucide-react";
import { PageShell } from "@/components/layout/dashboard-shell";
import { CreateUserDialog } from "@/components/admin/create-user-dialog";
import { UsersList } from "@/components/admin/users-list";
import { StatCard, StatsGrid } from "@/components/admin/stat-card";
import { AdminPageSkeleton } from "@/app/(dashboard)/admin/loading";
import { getCurrentProfile } from "@/lib/auth/get-profile";
import { getUsers, getUsersPage } from "@/lib/data/queries";
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

async function AdminUsersContent({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const params = await searchParams;
  const search = params.q ?? "";
  const page = Math.max(1, Number(params.page) || 1);

  // Role counts still reflect the full org (not just the current page/search).
  const [allUsers, currentProfile, usersPage] = await Promise.all([
    getUsers(),
    getCurrentProfile(),
    getUsersPage({ page, search }),
  ]);

  const roleCounts = countByRole(allUsers);

  return (
    <PageShell
      title="Users"
      description="Create and manage user accounts and roles across your organization."
      action={<CreateUserDialog />}
      stats={
        <StatsGrid>
          <StatCard
            label="Total Users"
            value={allUsers.length}
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
        <UsersList
          users={usersPage.items}
          currentUserId={currentProfile?.id}
          page={usersPage.page}
          pageSize={usersPage.pageSize}
          total={usersPage.total}
          search={search}
        />
      </Suspense>
    </PageShell>
  );
}

export default function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <AdminUsersContent searchParams={searchParams} />
    </Suspense>
  );
}
