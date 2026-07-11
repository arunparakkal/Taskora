import { getCurrentProfile } from "@/lib/auth/get-profile";
import { getMemberHabitStreaks } from "@/lib/data/habits";
import { StreaksView } from "@/components/habits/streaks-view";

export default async function MemberHabitStreaksPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const streaks = await getMemberHabitStreaks(profile.id);

  return <StreaksView streaks={streaks} />;
}
