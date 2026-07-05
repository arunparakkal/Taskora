-- Add "rework" task status for team-lead review feedback (separate from In Progress).

ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'rework';

-- Review → rework counts as a review round-trip / changes requested.
CREATE OR REPLACE FUNCTION public.handle_task_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF OLD.status = 'review' AND NEW.status IN ('in_progress', 'rework') THEN
      NEW.review_cycles := COALESCE(OLD.review_cycles, 0) + 1;
    END IF;

    IF OLD.status = 'done' AND NEW.status <> 'done' THEN
      NEW.reopened_count := COALESCE(OLD.reopened_count, 0) + 1;
      NEW.completed_at := NULL;
    END IF;

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
        WHEN OLD.status = 'review' AND NEW.status IN ('in_progress', 'rework') THEN 'changes_requested'::task_activity_action
        WHEN OLD.status = 'done' AND NEW.status <> 'done' THEN 'reopened'::task_activity_action
        ELSE 'status_changed'::task_activity_action
      END
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Assign rework from review (optional comment → member notification).
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
  ELSIF p_decision = 'rework' THEN
    v_new_status := 'rework';
    IF p_comment IS NOT NULL AND length(trim(p_comment)) > 0 THEN
      v_type := 'task_rejected';
      v_title := 'Rework assigned';
    ELSE
      v_type := NULL;
      v_title := NULL;
    END IF;
  ELSE
    RAISE EXCEPTION 'Invalid decision: %', p_decision;
  END IF;

  UPDATE public.tasks SET status = v_new_status WHERE id = p_task_id;

  SELECT ta.id INTO v_activity_id
  FROM public.task_activity ta
  WHERE ta.task_id = p_task_id
  ORDER BY ta.created_at DESC
  LIMIT 1;

  IF p_decision = 'rework'
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
