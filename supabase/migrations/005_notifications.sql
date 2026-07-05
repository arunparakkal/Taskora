-- Taskora Notifications
-- Adds a notifications inbox (Instagram-style activity feed) and an atomic
-- review_task() RPC so team leads/admins can approve or reject a task with an
-- optional/required reason, which is stored on the activity log AND surfaced
-- to the assignee as a notification.

-- 1. Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (
    type IN ('task_rejected', 'task_approved', 'task_reopened')
  ),
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient
  ON notifications(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON notifications(recipient_id) WHERE is_read = FALSE;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own notifications" ON notifications;
CREATE POLICY "Users read own notifications"
  ON notifications FOR SELECT
  USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "Users update own notifications" ON notifications;
CREATE POLICY "Users update own notifications"
  ON notifications FOR UPDATE
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- 2. review_task(): atomic review actions used by the team-lead review queue.
--    - approve  -> status "done", notifies assignee (task_approved)
--    - move_back -> status "in_progress", no rejection comment/notification
--    - reject   -> status "in_progress", REQUIRES a reason, stores it on the
--                  task_activity row created by the existing status trigger,
--                  and notifies the assignee (task_rejected) with that reason.
CREATE OR REPLACE FUNCTION public.review_task(
  p_task_id UUID,
  p_decision TEXT,
  p_comment TEXT DEFAULT NULL
)
RETURNS TABLE (task_id UUID, new_status task_status)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id UUID;
  v_team_id UUID;
  v_assignee UUID;
  v_current_status task_status;
  v_new_status task_status;
  v_type TEXT;
  v_title TEXT;
  v_activity_id UUID;
BEGIN
  SELECT t.project_id, t.assignee_id, t.status
    INTO v_project_id, v_assignee, v_current_status
  FROM public.tasks t
  WHERE t.id = p_task_id
  FOR UPDATE;

  IF v_project_id IS NULL THEN
    RAISE EXCEPTION 'Task not found';
  END IF;

  SELECT p.team_id INTO v_team_id FROM public.projects p WHERE p.id = v_project_id;

  IF NOT (public.is_admin() OR public.user_leads_team(v_team_id)) THEN
    RAISE EXCEPTION 'You are not authorized to review this task';
  END IF;

  IF v_current_status <> 'review' THEN
    RAISE EXCEPTION 'This task is not awaiting review';
  END IF;

  IF p_decision = 'approve' THEN
    v_new_status := 'done';
    v_type := 'task_approved';
    v_title := 'Task approved';
  ELSIF p_decision = 'move_back' THEN
    v_new_status := 'in_progress';
    v_type := NULL;
    v_title := NULL;
  ELSIF p_decision = 'reject' THEN
    v_new_status := 'in_progress';
    IF p_comment IS NOT NULL AND length(trim(p_comment)) > 0 THEN
      v_type := 'task_rejected';
      v_title := 'Changes requested';
    ELSE
      v_type := NULL;
      v_title := NULL;
    END IF;
  ELSE
    RAISE EXCEPTION 'Invalid decision: %', p_decision;
  END IF;

  UPDATE public.tasks SET status = v_new_status WHERE id = p_task_id;

  -- The status trigger (004) already inserted a task_activity row for this
  -- transition; attach the reviewer's comment to it.
  SELECT ta.id INTO v_activity_id
  FROM public.task_activity ta
  WHERE ta.task_id = p_task_id
  ORDER BY ta.created_at DESC
  LIMIT 1;

  IF p_decision = 'reject'
     AND v_activity_id IS NOT NULL
     AND p_comment IS NOT NULL
     AND length(trim(p_comment)) > 0 THEN
    UPDATE public.task_activity SET comment = p_comment WHERE id = v_activity_id;
  END IF;

  IF v_assignee IS NOT NULL AND v_type IS NOT NULL THEN
    INSERT INTO public.notifications (recipient_id, actor_id, task_id, type, title, message)
    VALUES (v_assignee, auth.uid(), p_task_id, v_type, v_title, p_comment);
  END IF;

  RETURN QUERY SELECT p_task_id, v_new_status;
END;
$$;

GRANT EXECUTE ON FUNCTION public.review_task(UUID, TEXT, TEXT) TO authenticated;
