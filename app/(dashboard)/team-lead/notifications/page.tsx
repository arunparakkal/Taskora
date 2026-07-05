import { redirect } from "next/navigation";
import { PageShell } from "@/components/layout/dashboard-shell";
import { NotificationsList } from "@/components/notifications/notifications-list";
import { getCurrentProfile } from "@/lib/auth/get-profile";
import { getMyNotifications } from "@/lib/data/notifications";

export default async function TeamLeadNotificationsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const notifications = await getMyNotifications();

  return (
    <PageShell
      title="Notifications"
      description="Updates on tasks you review and manage."
    >
      <NotificationsList role={profile.role} initialNotifications={notifications} />
    </PageShell>
  );
}
