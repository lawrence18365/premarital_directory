-- Track profile clicks from city pages for conversion analytics
-- This helps measure which cities generate interest and which profiles get attention

CREATE TABLE IF NOT EXISTS profile_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source_city TEXT NOT NULL,
  source_state TEXT NOT NULL,
  source_page TEXT NOT NULL DEFAULT 'city_page',
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_profile_clicks_profile ON profile_clicks(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_clicks_city ON profile_clicks(source_city, source_state);
CREATE INDEX IF NOT EXISTS idx_profile_clicks_created ON profile_clicks(created_at DESC);

-- Enable RLS
ALTER TABLE profile_clicks ENABLE ROW LEVEL SECURITY;

-- Allow inserts from anyone (anonymous tracking)
CREATE POLICY "Anyone can log profile clicks"
  ON profile_clicks
  FOR INSERT
  WITH CHECK (true);

-- Only admins can read click data
CREATE POLICY "Admins can view profile clicks"
  ON profile_clicks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.tier IN ('admin', 'area_spotlight')
    )
  );

-- View for city-level analytics
CREATE OR REPLACE VIEW profile_clicks_by_city AS
SELECT
  source_city,
  source_state,
  COUNT(*) as total_clicks,
  COUNT(DISTINCT profile_id) as unique_profiles_clicked,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as clicks_last_7d,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as clicks_last_30d
FROM profile_clicks
GROUP BY source_city, source_state
ORDER BY total_clicks DESC;

-- View for profile-level analytics
CREATE OR REPLACE VIEW profile_clicks_summary AS
SELECT
  p.id as profile_id,
  p.full_name,
  p.city,
  p.state_province,
  COUNT(pc.id) as total_clicks,
  COUNT(pc.id) FILTER (WHERE pc.created_at >= NOW() - INTERVAL '7 days') as clicks_last_7d,
  COUNT(pc.id) FILTER (WHERE pc.created_at >= NOW() - INTERVAL '30 days') as clicks_last_30d,
  MAX(pc.created_at) as last_click_at
FROM profiles p
LEFT JOIN profile_clicks pc ON p.id = pc.profile_id
GROUP BY p.id, p.full_name, p.city, p.state_province
ORDER BY total_clicks DESC;
