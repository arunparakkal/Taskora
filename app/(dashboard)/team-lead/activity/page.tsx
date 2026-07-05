import { redirect } from "next/navigation";
import { PageShell } from "@/components/layout/dashboard-shell";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { getTeamLeadActivityFeed } from "@/lib/data/activity-feed";
import { getCurrentProfile } from "@/lib/auth/get-profile";

export default async function TeamLeadActivityPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const activity = await getTeamLeadActivityFeed(profile.id);

  return (
    <PageShell
      title="Activity"
      description="Recent updates from your team members across led projects."
    >
      <ActivityFeed
        activity={activity}
        role={profile.role}
        currentUserId={profile.id}
        emptyDescription="Task status changes and reviews from your team will appear here."
      />
    </PageShell>
  );
}
