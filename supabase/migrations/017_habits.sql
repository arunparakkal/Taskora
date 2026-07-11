-- Member habits tracking

DO $$ BEGIN
  CREATE TYPE habit_frequency AS ENUM ('daily', 'weekdays', 'weekly', 'custom');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'target', 
  color TEXT NOT NULL DEFAULT 'violet',
  frequency habit_frequency NOT NULL DEFAULT 'daily',
  days_of_week INT[] NOT NULL DEFAULT ARRAY[1, 2, 3, 4, 5, 6, 7],
  target_value INT,
  target_unit TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT habits_title_length CHECK (char_length(title) BETWEEN 1 AND 120)
);

CREATE TABLE IF NOT EXISTS habit_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  completed_on DATE NOT NULL DEFAULT CURRENT_DATE,
  current_value INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (habit_id, completed_on)
);

CREATE INDEX IF NOT EXISTS idx_habits_user ON habits(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_habit_completions_user ON habit_completions(user_id, completed_on DESC);
CREATE INDEX IF NOT EXISTS idx_habit_completions_habit ON habit_completions(habit_id, completed_on DESC);

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY habits_select_own ON habits
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY habits_insert_own ON habits
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY habits_update_own ON habits
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY habits_delete_own ON habits
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY habit_completions_select_own ON habit_completions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY habit_completions_insert_own ON habit_completions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY habit_completions_update_own ON habit_completions
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY habit_completions_delete_own ON habit_completions
  FOR DELETE USING (user_id = auth.uid());
