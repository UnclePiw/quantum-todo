CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title varchar(80) NOT NULL CHECK (length(trim(title)) > 0),
  description varchar(240) NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  due_at timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done')),
  completed_at timestamptz,
  monster_level text NOT NULL DEFAULT 'fresh' CHECK (monster_level IN ('fresh', 'warning', 'critical'))
);

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_at timestamptz;

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status text;
UPDATE tasks SET status = CASE WHEN completed_at IS NULL THEN 'pending' ELSE 'done' END WHERE status IS NULL;
ALTER TABLE tasks ALTER COLUMN status SET DEFAULT 'pending';
ALTER TABLE tasks ALTER COLUMN status SET NOT NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_completion_state_check') THEN
    ALTER TABLE tasks ADD CONSTRAINT tasks_completion_state_check CHECK ((status = 'done') = (completed_at IS NOT NULL));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS tasks_user_status_created_idx ON tasks(user_id, status, created_at);
