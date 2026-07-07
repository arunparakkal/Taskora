import { redirect } from "next/navigation";
import { PageShell } from "@/components/layout/dashboard-shell";
import { MemberProfileView } from "@/components/members/member-profile-view";
import { TelegramConnectCard } from "@/components/telegram/telegram-connect-card";
import { PeriodFilter } from "@/components/performance/period-filter";
import { getCurrentProfile } from "@/lib/auth/get-profile";
import { getMemberProfile } from "@/lib/data/member-profile";
import { isPerformancePeriod } from "@/lib/performance/periods";

export default async function MemberProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const sp = await searchParams;
  const period = isPerformancePeriod(sp.period) ? sp.period : "month";

  const data = await getMemberProfile(profile.id, period);
  if (!data) redirect("/member/tasks");

  return (
    <PageShell
      title="My profile"
      description="Your tasks, projects, workload, and performance at a glance."
      action={<PeriodFilter current={period} />}
    >
      <div className="space-y-8">
        <TelegramConnectCard />
        <MemberProfileView
          data={data}
          projectHrefPrefix="/member/projects"
          taskHrefPrefix="/member/tasks"
          showRole={false}
        />
      </div>
    </PageShell>
  );
}
