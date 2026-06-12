-- Self-serve upgrade funnel tracking: view and click events before Stripe checkout.

CREATE TABLE IF NOT EXISTS upgrade_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'click')),
  surface TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_upgrade_events_profile_created
  ON upgrade_events(profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_upgrade_events_event_type
  ON upgrade_events(event_type);

CREATE INDEX IF NOT EXISTS idx_upgrade_events_surface
  ON upgrade_events(surface);

ALTER TABLE upgrade_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log upgrade events"
  ON upgrade_events
  FOR INSERT
  WITH CHECK (
    event_type IN ('view', 'click')
    AND surface <> ''
  );

CREATE POLICY "Admins can view upgrade events"
  ON upgrade_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );
