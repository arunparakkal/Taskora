-- Notify the project's team lead when an assigned member moves their task
-- to "in_progress" (started working). Skips self-notifications.

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'task_rejected', 'task_approved', 'task_reopened',
    'task_submitted', 'task_completed', 'task_created',
    'task_started'
  ));

-- Insert one notification for the team lead of the task's project team.
CREATE OR REPLACE FUNCTION public.notify_team_lead_for_task(
  p_actor UUID,
  p_task_id UUID,
  p_project_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead_id UUID;
BEGIN
  SELECT t.lead_id
    INTO v_lead_id
  FROM public.projects p
  JOIN public.teams t ON t.id = p.team_id
  WHERE p.id = p_project_id;

  IF v_lead_id IS NULL THEN
    RETURN;
  END IF;

  -- Never notify the actor about their own action.
  IF p_actor IS NOT NULL AND v_lead_id = p_actor THEN
    RETURN;
  END IF;

  INSERT INTO public.notifications (recipient_id, actor_id, task_id, type, title, message)
  VALUES (v_lead_id, p_actor, p_task_id, p_type, p_title, p_message);
END;
$$;

-- Extend status-change trigger: keep existing admin notify logic, and notify
-- the team lead when the assignee moves the task into in_progress.
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

    -- Admin activity feed via the bell.
    IF NEW.status = 'review' AND OLD.status IS DISTINCT FROM 'review' THEN
      PERFORM public.notify_admins(
        auth.uid(), NEW.id, 'task_submitted', 'Task submitted for review', NULL
      );
    ELSIF NEW.status = 'done' AND OLD.status IS DISTINCT FROM 'done' THEN
      PERFORM public.notify_admins(
        auth.uid(), NEW.id, 'task_completed', 'Task completed', NULL
      );
    END IF;

    -- Team lead: assigned member started (or resumed) work on the task.
    IF NEW.status = 'in_progress'
       AND OLD.status IS DISTINCT FROM 'in_progress'
       AND NEW.assignee_id IS NOT NULL
       AND auth.uid() IS NOT NULL
       AND auth.uid() = NEW.assignee_id
    THEN
      PERFORM public.notify_team_lead_for_task(
        auth.uid(),
        NEW.id,
        NEW.project_id,
        'task_started',
        'Task moved to In Progress',
        NULL
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
