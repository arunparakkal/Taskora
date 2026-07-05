import { redirect } from "next/navigation";
import { PageShell } from "@/components/layout/dashboard-shell";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { getMemberActivityFeed } from "@/lib/data/activity-feed";
import { getCurrentProfile } from "@/lib/auth/get-profile";

export default async function MemberActivityPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const activity = await getMemberActivityFeed(profile.id);

  return (
    <PageShell
      title="Activity"
      description="Recent updates on tasks across your team projects."
    >
      <ActivityFeed
        activity={activity}
        role={profile.role}
        currentUserId={profile.id}
        emptyDescription="When teammates update tasks on your projects, you'll see it here."
      />
    </PageShell>
  );
}
