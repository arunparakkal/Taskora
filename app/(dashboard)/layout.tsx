import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/get-profile";
import { DashboardShellClient } from "@/components/layout/dashboard-shell-client";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return <DashboardShellClient profile={profile}>{children}</DashboardShellClient>;
}
