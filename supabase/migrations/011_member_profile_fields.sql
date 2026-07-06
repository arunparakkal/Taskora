-- Member profile fields for skills and leave tracking

DO $$ BEGIN
  CREATE TYPE member_leave_status AS ENUM ('active', 'on_leave', 'partial');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS skills TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS leave_status member_leave_status NOT NULL DEFAULT 'active';
