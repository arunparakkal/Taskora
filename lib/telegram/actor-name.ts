import { createAdminClient } from "@/lib/supabase/admin";

export async function getActorDisplayName(actorId: string): Promise<string> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", actorId)
    .single();

  return data?.full_name?.trim() || "Someone";
}
