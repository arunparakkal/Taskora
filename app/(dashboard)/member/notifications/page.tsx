import { redirect } from "next/navigation";
import { PageShell } from "@/components/layout/dashboard-shell";
import { NotificationsList } from "@/components/notifications/notifications-list";
import { getCurrentProfile } from "@/lib/auth/get-profile";
import { getMyNotifications } from "@/lib/data/notifications";

export default async function MemberNotificationsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const notifications = await getMyNotifications();

  return (
    <PageShell
      title="Notifications"
      description="Approvals, change requests, and updates on your tasks."
    >
      <NotificationsList role={profile.role} initialNotifications={notifications} />
    </PageShell>
  );
}
