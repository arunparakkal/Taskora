-- Search indexes for fast admin global search (pg_trgm + btree)

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Users: trigram indexes for ILIKE on name and email
CREATE INDEX IF NOT EXISTS idx_profiles_full_name_trgm
  ON public.profiles USING gin (full_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_profiles_email_trgm
  ON public.profiles USING gin (email gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_profiles_full_name_lower
  ON public.profiles (lower(full_name));

CREATE INDEX IF NOT EXISTS idx_profiles_email_lower
  ON public.profiles (lower(email));

-- Teams
CREATE INDEX IF NOT EXISTS idx_teams_name_trgm
  ON public.teams USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_teams_name_lower
  ON public.teams (lower(name));

-- Projects
CREATE INDEX IF NOT EXISTS idx_projects_name_trgm
  ON public.projects USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_projects_key_trgm
  ON public.projects USING gin (key gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_projects_name_lower
  ON public.projects (lower(name));

CREATE INDEX IF NOT EXISTS idx_projects_key_lower
  ON public.projects (lower(key));
