-- Phase 1: Consent, removal, and legal safety
-- These changes are BLOCKING for any cold outreach

-- 1.1 Profile source tracking
-- Required to answer "where did we get this data?"
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_seeded BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS data_source TEXT,  -- 'manual_seed', 'their_signup', 'scraped_from_X'
  ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES auth.users(id);

COMMENT ON COLUMN profiles.is_seeded IS 'True if profile was pre-created from public data, not by the provider';
COMMENT ON COLUMN profiles.data_source IS 'Where this profile data originated (manual_seed, their_signup, etc)';
COMMENT ON COLUMN profiles.created_by_user_id IS 'User ID of person who created this profile (null for seeded)';

-- 1.2 Do not contact list
-- Critical for respecting removal requests and avoiding spam complaints
CREATE TABLE IF NOT EXISTS do_not_contact (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  reason TEXT NOT NULL,  -- 'unsubscribe', 'bounce', 'complaint', 'provider_request'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by_user_id UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_do_not_contact_email ON do_not_contact(email);

-- RLS for do_not_contact
ALTER TABLE do_not_contact ENABLE ROW LEVEL SECURITY;

-- Only admins can manage do_not_contact
CREATE POLICY "Admins can manage do_not_contact"
  ON do_not_contact
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.tier = 'admin'
    )
  );

-- 1.3 Soft delete / hide profiles
-- Required for immediate removal without losing audit trail
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS hidden_reason TEXT,
  ADD COLUMN IF NOT EXISTS hidden_at TIMESTAMPTZ;

COMMENT ON COLUMN profiles.is_hidden IS 'Hidden profiles are not shown to couples but data is preserved';
COMMENT ON COLUMN profiles.hidden_reason IS 'Why profile was hidden (provider_self_remove, unsubscribe_request, admin_action)';

-- Index for filtering hidden profiles
CREATE INDEX IF NOT EXISTS idx_profiles_is_hidden ON profiles(is_hidden) WHERE is_hidden = false;

-- 2.1 Token expiry for claim links
-- Required to prevent abuse of forwarded claim links
-- First ensure claim_token column exists (may have been added in previous migration)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS claim_token UUID DEFAULT gen_random_uuid();

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS claim_token_expires_at TIMESTAMPTZ;

COMMENT ON COLUMN profiles.claim_token_expires_at IS 'When the claim token becomes invalid';

-- Update existing tokens to expire in 7 days if they don't have expiry
UPDATE profiles
SET claim_token_expires_at = NOW() + INTERVAL '7 days'
WHERE claim_token IS NOT NULL AND claim_token_expires_at IS NULL;

-- 3.1 Provider events log for full audit trail
-- Required to answer "when did we first contact this person?"
CREATE TABLE IF NOT EXISTS provider_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_email TEXT NOT NULL,
  profile_id UUID REFERENCES profiles(id),
  event_type TEXT NOT NULL,  -- 'profile_seeded', 'email_sent', 'claimed', 'removed', 'bounce', 'complaint'
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by_user_id UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_provider_events_email ON provider_events(provider_email);
CREATE INDEX IF NOT EXISTS idx_provider_events_profile ON provider_events(profile_id);
CREATE INDEX IF NOT EXISTS idx_provider_events_type ON provider_events(event_type);
CREATE INDEX IF NOT EXISTS idx_provider_events_created ON provider_events(created_at DESC);

-- RLS for provider_events
ALTER TABLE provider_events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert events (for logging)
CREATE POLICY "Anyone can log provider events"
  ON provider_events
  FOR INSERT
  WITH CHECK (true);

-- Only admins can read events
CREATE POLICY "Admins can view provider events"
  ON provider_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.tier = 'admin'
    )
  );

-- 3.2 Outreach rate limiting tracking
-- Only add columns if provider_outreach table exists (created in previous migration)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'provider_outreach') THEN
    ALTER TABLE provider_outreach
      ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS contact_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS email_template_used TEXT;
  END IF;
END $$;

-- View for today's outreach count (for rate limiting)
CREATE OR REPLACE VIEW outreach_today AS
SELECT
  COUNT(*) as emails_sent_today,
  (SELECT value::int FROM app_settings WHERE key = 'max_outreach_per_day') as daily_limit
FROM provider_events
WHERE event_type = 'email_sent'
  AND created_at >= CURRENT_DATE;

-- App settings table for configurable limits
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Set initial rate limit
INSERT INTO app_settings (key, value, description)
VALUES ('max_outreach_per_day', '25', 'Maximum outreach emails per day')
ON CONFLICT (key) DO NOTHING;

-- Function to check if email is safe to contact
CREATE OR REPLACE FUNCTION is_safe_to_contact(check_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM do_not_contact WHERE email = check_email
  );
END;
$$ LANGUAGE plpgsql;

-- Function to check if under rate limit
CREATE OR REPLACE FUNCTION is_under_outreach_limit()
RETURNS BOOLEAN AS $$
DECLARE
  sent_today INTEGER;
  daily_limit INTEGER;
BEGIN
  SELECT COUNT(*) INTO sent_today
  FROM provider_events
  WHERE event_type = 'email_sent'
    AND created_at >= CURRENT_DATE;

  SELECT value::int INTO daily_limit
  FROM app_settings
  WHERE key = 'max_outreach_per_day';

  RETURN sent_today < COALESCE(daily_limit, 25);
END;
$$ LANGUAGE plpgsql;
