import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageShell } from "@/components/layout/dashboard-shell";
import { TeamLeadMemberProfileView } from "@/components/members/team-lead-member-profile-view";
import { PeriodFilter } from "@/components/performance/period-filter";
import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/auth/get-profile";
import {
  getMemberProfile,
  teamLeadCanViewMember,
} from "@/lib/data/member-profile";
import { isPerformancePeriod } from "@/lib/performance/periods";

export default async function TeamLeadMemberProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const { id } = await params;
  const sp = await searchParams;
  const period = isPerformancePeriod(sp.period) ? sp.period : "week";

  const canView = await teamLeadCanViewMember(profile.id, id);
  if (!canView) notFound();

  const data = await getMemberProfile(id, period);
  if (!data) notFound();

  return (
    <PageShell
      title="Member profile"
      description="Workload, capacity, tasks, skills, and activity for this team member."
      action={<PeriodFilter current={period} />}
    >
      <Button variant="ghost" size="sm" className="mb-4 -ml-2 gap-1" asChild>
        <Link href="/team-lead/team">
          <ArrowLeft className="h-4 w-4" />
          Back to my team
        </Link>
      </Button>
      <TeamLeadMemberProfileView data={data} />
    </PageShell>
  );
}
