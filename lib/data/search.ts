import { createClient } from "@/lib/supabase/server";
import {
  type AdminSearchResult,
  type AdminSearchType,
  adminSearchHref,
  buildOrIlikeFilter,
} from "@/lib/search-utils";

const SEARCH_LIMIT = 10;

export async function searchAdminEntities(
  type: AdminSearchType,
  query: string
): Promise<AdminSearchResult[]> {
  const term = query.trim();
  if (term.length < 2) return [];

  const supabase = await createClient();

  if (type === "users") {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .or(buildOrIlikeFilter(["full_name", "email"], term))
      .order("full_name", { ascending: true })
      .limit(SEARCH_LIMIT);

    if (error) throw error;

    return (data ?? []).map((user) => ({
      id: user.id,
      type: "users" as const,
      title: user.full_name || user.email,
      subtitle: `${user.email} · ${user.role.replace("_", " ")}`,
      href: adminSearchHref("users", user.full_name || user.email),
    }));
  }

  if (type === "teams") {
    const { data, error } = await supabase
      .from("teams")
      .select("id, name, description, lead:profiles!teams_lead_id_fkey(full_name)")
      .or(buildOrIlikeFilter(["name", "description"], term))
      .order("name", { ascending: true })
      .limit(SEARCH_LIMIT);

    if (error) throw error;

    return (data ?? []).map((team) => ({
      id: team.id,
      type: "teams" as const,
      title: team.name,
      subtitle:
        team.description ||
        `Lead: ${(team.lead as { full_name?: string } | null)?.full_name ?? "None"}`,
      href: adminSearchHref("teams", team.name),
    }));
  }

  const { data, error } = await supabase
    .from("projects")
    .select("id, name, key, status, team:teams(name)")
    .or(buildOrIlikeFilter(["name", "key", "description"], term))
    .order("name", { ascending: true })
    .limit(SEARCH_LIMIT);

  if (error) throw error;

  return (data ?? []).map((project) => ({
    id: project.id,
    type: "projects" as const,
    title: project.name,
    subtitle: `[${project.key}] · ${(project.team as { name?: string } | null)?.name ?? "No team"} · ${project.status}`,
    href: adminSearchHref("projects", project.name),
  }));
}
