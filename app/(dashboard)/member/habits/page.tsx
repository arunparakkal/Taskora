import { getCurrentProfile } from "@/lib/auth/get-profile";
import { getMemberHabitsDashboard } from "@/lib/data/habits";
import { HabitsDashboard } from "@/components/habits/habits-dashboard";

export default async function MemberHabitsPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const dashboard = await getMemberHabitsDashboard(profile.id);

  return (
    <div className="mx-auto max-w-[1400px] px-1 py-2">
      <HabitsDashboard
        data={dashboard}
        memberName={profile.full_name || profile.email}
      />
    </div>
  );
}
