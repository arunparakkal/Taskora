export type AdminSearchType = "users" | "teams" | "projects";

export type AdminSearchResult = {
  id: string;
  type: AdminSearchType;
  title: string;
  subtitle: string;
  href: string;
};

/** Escape special characters for safe ILIKE patterns in Postgres */
export function escapeIlike(term: string) {
  return term.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export function buildIlikePattern(term: string) {
  const cleaned = term.trim().replace(/,/g, " ");
  return `%${escapeIlike(cleaned)}%`;
}

/** PostgREST-safe OR filter for ILIKE across multiple columns */
export function buildOrIlikeFilter(fields: string[], term: string) {
  const pattern = buildIlikePattern(term).replace(/"/g, '""');
  return fields.map((field) => `${field}.ilike."${pattern}"`).join(",");
}

export function adminSearchHref(type: AdminSearchType, query: string) {
  const q = encodeURIComponent(query.trim());
  const base = {
    users: "/admin/users",
    teams: "/admin/teams",
    projects: "/admin/projects",
  }[type];
  return q ? `${base}?q=${q}` : base;
}
