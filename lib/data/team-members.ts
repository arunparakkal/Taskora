import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

/** Fetch team member profiles (RPC + fallback; filters null/missing profiles). */
export async function fetchTeamMemberProfiles(teamId: string): Promise<Profile[]> {
  const supabase = await createClient();

  const { data: rpcProfiles, error: rpcError } = await supabase.rpc(
    "get_team_member_profiles",
    { p_team_id: teamId }
  );

  if (!rpcError && rpcProfiles?.length) {
    return (rpcProfiles as Profile[]).filter(
      (p): p is Profile => p != null && typeof p.id === "string"
    );
  }

  const { data: memberships, error: memberError } = await supabase
    .from("team_members")
    .select("user_id")
    .eq("team_id", teamId);

  if (memberError) throw memberError;
  if (!memberships?.length) return [];

  const userIds = memberships.map((m) => m.user_id).filter(Boolean);
  if (!userIds.length) return [];

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .in("id", userIds)
    .order("full_name", { ascending: true });

  if (profileError) throw profileError;

  return (profiles ?? []).filter(
    (p): p is Profile => p != null && typeof p.id === "string"
  );
}
