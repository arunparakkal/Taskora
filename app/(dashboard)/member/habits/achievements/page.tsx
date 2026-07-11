import { getCurrentProfile } from "@/lib/auth/get-profile";
import { getMemberAchievementsGallery } from "@/lib/data/habits";
import { AchievementsView } from "@/components/habits/achievements-view";

export default async function MemberHabitAchievementsPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const gallery = await getMemberAchievementsGallery(profile.id);

  return (
    <AchievementsView
      achievements={gallery.achievements}
      unlockedCount={gallery.unlockedCount}
      totalCount={gallery.totalCount}
    />
  );
}
