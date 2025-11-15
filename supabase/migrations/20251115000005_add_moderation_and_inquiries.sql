-- Add moderation status to profiles for spam prevention
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'pending'
  CHECK (moderation_status IN ('pending', 'approved', 'rejected'));

-- Add spam score for flagging suspicious profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS spam_score INTEGER DEFAULT 0;

-- Index for moderation queries
CREATE INDEX IF NOT EXISTS idx_profiles_moderation ON profiles(moderation_status);

-- Multi-provider inquiry system (the "money" feature)
CREATE TABLE IF NOT EXISTS city_inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_name TEXT,
  couple_email TEXT NOT NULL,
  couple_message TEXT NOT NULL,
  preferred_type TEXT, -- 'therapist', 'clergy', 'either'
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  provider_ids UUID[] NOT NULL,
  source TEXT DEFAULT 'city_page',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics
CREATE INDEX IF NOT EXISTS idx_city_inquiries_city ON city_inquiries(city, state);
CREATE INDEX IF NOT EXISTS idx_city_inquiries_created ON city_inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_city_inquiries_providers ON city_inquiries USING GIN(provider_ids);

-- Enable RLS
ALTER TABLE city_inquiries ENABLE ROW LEVEL SECURITY;

-- Anyone can create inquiries (couples are anonymous)
CREATE POLICY "Anyone can create inquiries"
  ON city_inquiries
  FOR INSERT
  WITH CHECK (true);

-- Providers can see inquiries that include them
CREATE POLICY "Providers can see their inquiries"
  ON city_inquiries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.id = ANY(city_inquiries.provider_ids)
    )
  );

-- Provider outreach CRM for tracking campaigns
CREATE TABLE IF NOT EXISTS provider_outreach (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  website TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  outreach_status TEXT DEFAULT 'identified'
    CHECK (outreach_status IN ('identified', 'emailed', 'replied', 'claimed', 'bounced', 'unsubscribed')),
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  claim_token UUID,
  emailed_at TIMESTAMPTZ,
  followed_up_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for outreach queries
CREATE INDEX IF NOT EXISTS idx_outreach_status ON provider_outreach(outreach_status);
CREATE INDEX IF NOT EXISTS idx_outreach_city ON provider_outreach(city, state);
CREATE INDEX IF NOT EXISTS idx_outreach_email ON provider_outreach(email);

-- One-click claim tokens on profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS claim_token UUID DEFAULT gen_random_uuid();

-- Index for claim lookup
CREATE INDEX IF NOT EXISTS idx_profiles_claim_token ON profiles(claim_token);

-- View for moderation queue
CREATE OR REPLACE VIEW moderation_queue AS
SELECT
  p.id,
  p.full_name,
  p.email,
  p.phone,
  p.city,
  p.state_province,
  p.website,
  p.bio,
  p.moderation_status,
  p.spam_score,
  p.created_at,
  CASE
    WHEN p.email IS NULL THEN 10
    ELSE 0
  END +
  CASE
    WHEN p.phone IS NULL THEN 10
    ELSE 0
  END +
  CASE
    WHEN p.bio IS NULL OR LENGTH(p.bio) < 50 THEN 15
    ELSE 0
  END +
  CASE
    WHEN p.website IS NULL THEN 5
    ELSE 0
  END +
  CASE
    WHEN p.profile_photo_url IS NULL THEN 10
    ELSE 0
  END AS calculated_spam_score
FROM profiles p
WHERE p.moderation_status = 'pending'
ORDER BY calculated_spam_score DESC, p.created_at DESC;

-- View for city health metrics
CREATE OR REPLACE VIEW city_health_metrics AS
SELECT
  p.city,
  p.state_province as state,
  COUNT(DISTINCT p.id) as profile_count,
  COUNT(DISTINCT p.id) FILTER (WHERE p.moderation_status = 'approved') as approved_profiles,
  COUNT(DISTINCT pc.id) FILTER (WHERE pc.created_at >= NOW() - INTERVAL '30 days') as clicks_30d,
  COUNT(DISTINCT cr.id) FILTER (WHERE cr.revealed_at >= NOW() - INTERVAL '30 days') as reveals_30d,
  (SELECT COUNT(*) FROM city_inquiries ci WHERE ci.city = p.city AND ci.state = p.state_province AND ci.created_at >= NOW() - INTERVAL '30 days') as inquiries_30d,
  MAX(p.created_at) as last_new_profile
FROM profiles p
LEFT JOIN profile_clicks pc ON pc.source_city = p.city AND pc.source_state = p.state_province
LEFT JOIN contact_reveals cr ON cr.city = p.city AND cr.state_province = p.state_province
GROUP BY p.city, p.state_province
ORDER BY profile_count DESC;

-- Analytics view for provider dashboard
CREATE OR REPLACE VIEW provider_analytics AS
SELECT
  p.id as profile_id,
  p.full_name,
  p.user_id,
  COUNT(DISTINCT pc.id) as total_clicks,
  COUNT(DISTINCT pc.id) FILTER (WHERE pc.created_at >= NOW() - INTERVAL '30 days') as clicks_30d,
  COUNT(DISTINCT pc.id) FILTER (WHERE pc.created_at >= NOW() - INTERVAL '7 days') as clicks_7d,
  COUNT(DISTINCT cr.id) as total_reveals,
  COUNT(DISTINCT cr.id) FILTER (WHERE cr.revealed_at >= NOW() - INTERVAL '30 days') as reveals_30d,
  COUNT(DISTINCT cr.id) FILTER (WHERE cr.revealed_at >= NOW() - INTERVAL '7 days') as reveals_7d,
  (SELECT COUNT(*) FROM city_inquiries ci WHERE p.id = ANY(ci.provider_ids)) as total_inquiries,
  (SELECT COUNT(*) FROM city_inquiries ci WHERE p.id = ANY(ci.provider_ids) AND ci.created_at >= NOW() - INTERVAL '30 days') as inquiries_30d
FROM profiles p
LEFT JOIN profile_clicks pc ON pc.profile_id = p.id
LEFT JOIN contact_reveals cr ON cr.profile_id = p.id
GROUP BY p.id, p.full_name, p.user_id;
