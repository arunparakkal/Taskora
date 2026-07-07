-- Always notify the assignee when rework is assigned, even without a comment.

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
  v_message TEXT;
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
    v_message := NULL;
  ELSIF p_decision = 'rework' THEN
    v_new_status := 'rework';
    v_type := 'task_rejected';
    v_title := 'Rework assigned';
    v_message := NULLIF(trim(p_comment), '');
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
     AND v_message IS NOT NULL THEN
    UPDATE public.task_activity SET comment = v_message WHERE id = v_activity_id;
  END IF;

  IF v_assignee IS NOT NULL AND v_type IS NOT NULL THEN
    INSERT INTO public.notifications (recipient_id, actor_id, task_id, type, title, message)
    VALUES (v_assignee, auth.uid(), p_task_id, v_type, v_title, v_message);
  END IF;

  RETURN QUERY SELECT p_task_id, v_new_status;
END;
$$;
