import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageShell } from "@/components/layout/dashboard-shell";
import { AdminProfileView } from "@/components/members/admin-profile-view";
import { MemberProfileView } from "@/components/members/member-profile-view";
import { PeriodFilter } from "@/components/performance/period-filter";
import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/auth/get-profile";
import { getAdminProfile } from "@/lib/data/admin-profile";
import { getMemberProfile } from "@/lib/data/member-profile";
import { isPerformancePeriod } from "@/lib/performance/periods";

export default async function AdminUserProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const currentUser = await getCurrentProfile();
  if (!currentUser) redirect("/login");
  if (currentUser.role !== "admin") redirect("/");

  const { id } = await params;
  const sp = await searchParams;
  const period = isPerformancePeriod(sp.period) ? sp.period : "month";

  const adminData = await getAdminProfile(id, period, {
    includeOrgSnapshot: currentUser.id === id,
  });
  if (adminData) {
    const isSelf = currentUser.id === id;

    return (
      <PageShell
        title={isSelf ? "My profile" : "Admin profile"}
        description="Administrative activity, created resources, and audit trail."
        action={<PeriodFilter current={period} />}
      >
        {!isSelf && (
          <Button variant="ghost" size="sm" className="mb-4 -ml-2 gap-1" asChild>
            <Link href="/admin/users">
              <ArrowLeft className="h-4 w-4" />
              Back to users
            </Link>
          </Button>
        )}
        <AdminProfileView
          data={adminData}
          isSelf={isSelf}
        />
      </PageShell>
    );
  }

  const memberData = await getMemberProfile(id, period);
  if (!memberData) notFound();

  return (
    <PageShell
      title="Member profile"
      description="Task history, projects, workload, and performance."
      action={<PeriodFilter current={period} />}
    >
      <Button variant="ghost" size="sm" className="mb-4 -ml-2 gap-1" asChild>
        <Link href="/admin/users">
          <ArrowLeft className="h-4 w-4" />
          Back to users
        </Link>
      </Button>
      <MemberProfileView
        data={memberData}
        projectHrefPrefix="/admin/projects"
        showRole
      />
    </PageShell>
  );
}
