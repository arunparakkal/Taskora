import { redirect } from "next/navigation";
import { PageShell } from "@/components/layout/dashboard-shell";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { getAdminActivityFeed } from "@/lib/data/activity-feed";
import { getCurrentProfile } from "@/lib/auth/get-profile";

export default async function AdminActivityPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/");

  const activity = await getAdminActivityFeed();

  return (
    <PageShell
      title="Activity"
      description="Latest updates across all teams, projects, and tasks."
    >
      <ActivityFeed
        activity={activity}
        role="admin"
        currentUserId={profile.id}
        emptyDescription="Task status changes and reviews from across the organization will appear here."
      />
    </PageShell>
  );
}
