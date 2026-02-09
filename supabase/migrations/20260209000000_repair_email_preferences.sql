-- Repair: add email_preferences column that was missed
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_preferences JSONB
  DEFAULT '{"weekly_digest": true, "inquiry_notifications": true, "marketing": true}';

-- Ensure digest_send_log table exists
CREATE TABLE IF NOT EXISTS digest_send_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  digest_type TEXT NOT NULL CHECK (digest_type IN ('weekly', 'monthly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  email_id TEXT,
  stats_snapshot JSONB,
  UNIQUE(profile_id, digest_type, period_start)
);

CREATE INDEX IF NOT EXISTS idx_digest_send_log_profile
  ON digest_send_log(profile_id, digest_type, period_start DESC);

-- Ensure drip_email_log table exists
CREATE TABLE IF NOT EXISTS drip_email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  drip_type TEXT NOT NULL CHECK (drip_type IN ('welcome', 'claim_welcome')),
  step INTEGER NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  email_id TEXT,
  UNIQUE(profile_id, drip_type, step)
);

CREATE INDEX IF NOT EXISTS idx_drip_email_log_profile
  ON drip_email_log(profile_id, drip_type);
