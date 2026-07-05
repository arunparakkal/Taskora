-- Taskora Performance Module
-- Adds task lifecycle tracking (activity log + completion/quality counters),
-- performance snapshots, and a trigger that records status transitions.

-- 1. New task columns for quality/delivery scoring
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS review_cycles INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reopened_count INT NOT NULL DEFAULT 0;

-- 2. Task activity log (status transitions + review actions)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_activity_action') THEN
    CREATE TYPE task_activity_action AS ENUM (
      'status_changed',
      'approved',
      'changes_requested',
      'reopened'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS task_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  from_status task_status,
  to_status task_status,
  action task_activity_action NOT NULL DEFAULT 'status_changed',
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_activity_task ON task_activity(task_id);
CREATE INDEX IF NOT EXISTS idx_task_activity_created ON task_activity(created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at);

-- 3. Performance snapshots (stable, period-based scores)
CREATE TABLE IF NOT EXISTS performance_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  quality NUMERIC(5,2) NOT NULL DEFAULT 0,
  delivery NUMERIC(5,2) NOT NULL DEFAULT 0,
  productivity NUMERIC(5,2) NOT NULL DEFAULT 0,
  reliability NUMERIC(5,2) NOT NULL DEFAULT 0,
  collaboration NUMERIC(5,2) NOT NULL DEFAULT 0,
  overall NUMERIC(5,2) NOT NULL DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, period_type, period_start)
);

CREATE INDEX IF NOT EXISTS idx_perf_snapshots_user ON performance_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_perf_snapshots_team ON performance_snapshots(team_id);

-- 4. Trigger: record status transitions and maintain quality counters
CREATE OR REPLACE FUNCTION public.handle_task_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    -- Returned from review to in_progress = a review round-trip
    IF OLD.status = 'review' AND NEW.status = 'in_progress' THEN
      NEW.review_cycles := COALESCE(OLD.review_cycles, 0) + 1;
    END IF;

    -- Reopened after being marked done
    IF OLD.status = 'done' AND NEW.status <> 'done' THEN
      NEW.reopened_count := COALESCE(OLD.reopened_count, 0) + 1;
      NEW.completed_at := NULL;
    END IF;

    -- Completion timestamp when first entering done
    IF NEW.status = 'done' AND OLD.status <> 'done' THEN
      NEW.completed_at := NOW();
    END IF;

    INSERT INTO public.task_activity (task_id, actor_id, from_status, to_status, action)
    VALUES (
      NEW.id,
      auth.uid(),
      OLD.status,
      NEW.status,
      CASE
        WHEN OLD.status = 'review' AND NEW.status = 'done' THEN 'approved'::task_activity_action
        WHEN OLD.status = 'review' AND NEW.status = 'in_progress' THEN 'changes_requested'::task_activity_action
        WHEN OLD.status = 'done' AND NEW.status <> 'done' THEN 'reopened'::task_activity_action
        ELSE 'status_changed'::task_activity_action
      END
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_task_status_change ON tasks;
CREATE TRIGGER on_task_status_change
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_task_status_change();

-- 5. RLS
ALTER TABLE task_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read task activity" ON task_activity;
CREATE POLICY "Read task activity"
  ON task_activity FOR SELECT
  USING (
    public.is_admin()
    OR task_id IN (
      SELECT t.id FROM tasks t
      WHERE t.assignee_id = auth.uid()
        OR t.project_id IN (
          SELECT p.id FROM projects p
          WHERE public.user_leads_team(p.team_id)
            OR p.team_id IN (SELECT public.user_team_ids())
        )
    )
  );

DROP POLICY IF EXISTS "Read performance snapshots" ON performance_snapshots;
CREATE POLICY "Read performance snapshots"
  ON performance_snapshots FOR SELECT
  USING (
    public.is_admin()
    OR user_id = auth.uid()
    OR team_id IN (SELECT t.id FROM teams t WHERE t.lead_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins manage performance snapshots" ON performance_snapshots;
CREATE POLICY "Admins manage performance snapshots"
  ON performance_snapshots FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 6. Backfill completed_at for already-done tasks (approximate with created_at)
UPDATE tasks
SET completed_at = created_at
WHERE status = 'done' AND completed_at IS NULL;
