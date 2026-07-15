-- Rate limiting for public endpoints (login brute-force, telegram webhook abuse).
-- Storage-backed (not in-memory) since the app runs on serverless functions
-- where counters would not persist across invocations/instances.

CREATE TABLE IF NOT EXISTS public.rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS enabled with no policies — only the service-role client
-- (lib/supabase/admin.ts) can read/write this table, same pattern as
-- telegram_link_tokens in 014_telegram_notifications.sql.
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Atomically increments (or resets, if the window has elapsed) the counter
-- for a given key and returns the resulting count + window start, so
-- concurrent serverless invocations can't race on a read-then-write.
CREATE OR REPLACE FUNCTION public.increment_rate_limit(
  p_key TEXT,
  p_window_seconds INT
)
RETURNS TABLE (current_count INT, window_start TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_row public.rate_limits;
BEGIN
  INSERT INTO public.rate_limits (key, count, window_start, updated_at)
  VALUES (p_key, 1, v_now, v_now)
  ON CONFLICT (key) DO UPDATE
  SET
    count = CASE
      WHEN public.rate_limits.window_start < v_now - (p_window_seconds || ' seconds')::interval
        THEN 1
      ELSE public.rate_limits.count + 1
    END,
    window_start = CASE
      WHEN public.rate_limits.window_start < v_now - (p_window_seconds || ' seconds')::interval
        THEN v_now
      ELSE public.rate_limits.window_start
    END,
    updated_at = v_now
  RETURNING * INTO v_row;

  RETURN QUERY SELECT v_row.count, v_row.window_start;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_rate_limit(TEXT, INT) TO service_role;

CREATE INDEX IF NOT EXISTS idx_rate_limits_updated_at
  ON public.rate_limits(updated_at);

COMMENT ON TABLE public.rate_limits IS
  'Counters for API rate limiting, keyed by a caller-defined string (e.g. login:<ip>:<email>). Rows are small and safe to prune periodically by updated_at if it grows large.';
