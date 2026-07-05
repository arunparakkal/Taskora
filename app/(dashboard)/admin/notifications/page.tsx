import { redirect } from "next/navigation";
import { PageShell } from "@/components/layout/dashboard-shell";
import { NotificationsList } from "@/components/notifications/notifications-list";
import { getCurrentProfile } from "@/lib/auth/get-profile";
import { getMyNotifications } from "@/lib/data/notifications";

export default async function AdminNotificationsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const notifications = await getMyNotifications();

  return (
    <PageShell
      title="Notifications"
      description="Organization-wide task and review updates."
    >
      <NotificationsList role={profile.role} initialNotifications={notifications} />
    </PageShell>
  );
}
