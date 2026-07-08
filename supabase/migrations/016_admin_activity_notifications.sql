-- Admin activity notifications
-- Notify every admin when members/teams: submit a task for review, complete a
-- task, or create a new task. The admin never gets notified about their own
-- actions. Adds three new notification types and wires them into the existing
-- task status-change trigger plus a new task-created trigger.

-- 1. Allow the new admin-facing notification types on the notifications table.
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'task_rejected', 'task_approved', 'task_reopened',
    'task_submitted', 'task_completed', 'task_created'
  ));

-- 2. Helper: insert one notification per admin, skipping the actor themselves.
CREATE OR REPLACE FUNCTION public.notify_admins(
  p_actor UUID,
  p_task_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (recipient_id, actor_id, task_id, type, title, message)
  SELECT p.id, p_actor, p_task_id, p_type, p_title, p_message
  FROM public.profiles p
  WHERE p.role = 'admin'
    AND (p_actor IS NULL OR p.id <> p_actor);
END;
$$;

-- 3. Extend the status-change trigger to also notify admins on submit/complete.
--    (Body preserved from migration 006, with the admin notifications appended.)
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
  END IF;

  RETURN NEW;
END;
$$;

-- 4. Notify admins when a brand-new task is created.
CREATE OR REPLACE FUNCTION public.handle_task_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.notify_admins(
    auth.uid(), NEW.id, 'task_created', 'New task created', NULL
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_task_created_notify ON public.tasks;
CREATE TRIGGER trg_task_created_notify
  AFTER INSERT ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_task_created();
