import { getCurrentProfile } from "@/lib/auth/get-profile";
import { ChatWidget } from "@/components/chat/chat-widget";

/**
 * Single mount point: guests get the site guide; logged-in users get the
 * role-aware assistant. Avoids double widgets across layouts.
 */
export async function ChatMount() {
  const profile = await getCurrentProfile();

  if (profile) {
    return (
      <ChatWidget
        variant="assistant"
        role={profile.role}
        name={profile.full_name}
      />
    );
  }

  return <ChatWidget variant="guest" />;
}
