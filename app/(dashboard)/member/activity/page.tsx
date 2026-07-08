import { redirect } from "next/navigation";
import { PageShell } from "@/components/layout/dashboard-shell";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { getPersonalActivityFeed } from "@/lib/data/activity-feed";
import { getCurrentProfile } from "@/lib/auth/get-profile";

export default async function MemberActivityPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const activity = await getPersonalActivityFeed(profile.id);

  return (
    <PageShell
      title="Activity"
      description="A timeline of tasks you updated, reviews you submitted, and work you created."
    >
      <ActivityFeed
        activity={activity}
        role={profile.role}
        currentUserId={profile.id}
        personal
        emptyTitle="No activity yet"
        emptyDescription="When you update tasks, submit reviews, or create work, it will appear here."
      />
    </PageShell>
  );
}
