import { redirect } from "next/navigation";
import { PageShell } from "@/components/layout/dashboard-shell";
import { AdminProfileView } from "@/components/members/admin-profile-view";
import { TelegramConnectCard } from "@/components/telegram/telegram-connect-card";
import { PeriodFilter } from "@/components/performance/period-filter";
import { getCurrentProfile } from "@/lib/auth/get-profile";
import { getAdminProfile } from "@/lib/data/admin-profile";
import { isPerformancePeriod } from "@/lib/performance/periods";

export default async function AdminSelfProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/");

  const sp = await searchParams;
  const period = isPerformancePeriod(sp.period) ? sp.period : "month";

  const data = await getAdminProfile(profile.id, period, {
    includeOrgSnapshot: true,
  });
  if (!data) redirect("/admin");

  return (
    <PageShell
      title="My profile"
      description="Your administrative activity and organization overview."
      action={<PeriodFilter current={period} />}
    >
      <div className="space-y-6">
        <TelegramConnectCard />
        <AdminProfileView data={data} isSelf />
      </div>
    </PageShell>
  );
}
