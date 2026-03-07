CREATE TABLE IF NOT EXISTS distribution_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel TEXT NOT NULL,
  audience TEXT NOT NULL DEFAULT 'community'
    CHECK (audience IN ('officiant', 'church', 'planner', 'community')),
  market TEXT NOT NULL,
  target_name TEXT,
  target_url TEXT,
  destination_url TEXT NOT NULL,
  ref_code TEXT,
  owner TEXT,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'contacted', 'live', 'won', 'done', 'paused', 'dropped')),
  notes TEXT,
  next_action_at TIMESTAMPTZ,
  last_contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_distribution_tasks_status ON distribution_tasks(status);
CREATE INDEX IF NOT EXISTS idx_distribution_tasks_channel ON distribution_tasks(channel);
CREATE INDEX IF NOT EXISTS idx_distribution_tasks_next_action ON distribution_tasks(next_action_at);
CREATE INDEX IF NOT EXISTS idx_distribution_tasks_ref_code ON distribution_tasks(ref_code);

ALTER TABLE distribution_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage distribution tasks"
  ON distribution_tasks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM admin_users
      WHERE admin_users.id = auth.uid()
        AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM admin_users
      WHERE admin_users.id = auth.uid()
        AND admin_users.is_active = true
    )
  );

COMMENT ON TABLE distribution_tasks IS 'Lightweight CRM for community, planner, church, and partner distribution work.';
