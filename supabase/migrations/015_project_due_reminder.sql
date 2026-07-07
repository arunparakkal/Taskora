-- Track Telegram due-date reminder for team leads (sent once per due date).

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS telegram_due_reminder_sent_at TIMESTAMPTZ;
