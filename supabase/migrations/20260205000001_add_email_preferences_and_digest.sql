-- Add email preferences to profiles and digest tracking

-- Email preferences column (JSONB for flexibility)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_preferences JSONB
  DEFAULT '{"weekly_digest": true, "inquiry_notifications": true, "marketing": true}';

-- Digest send log - prevents duplicate sends and provides audit trail
CREATE TABLE IF NOT EXISTS digest_send_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  digest_type TEXT NOT NULL CHECK (digest_type IN ('weekly', 'monthly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  email_id TEXT, -- Resend message ID
  stats_snapshot JSONB, -- Stats included in the email
  UNIQUE(profile_id, digest_type, period_start)
);

CREATE INDEX IF NOT EXISTS idx_digest_send_log_profile
  ON digest_send_log(profile_id, digest_type, period_start DESC);

-- Drip email tracking for welcome sequences
CREATE TABLE IF NOT EXISTS drip_email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  drip_type TEXT NOT NULL CHECK (drip_type IN ('welcome', 'claim_welcome')),
  step INTEGER NOT NULL, -- 0=immediate, 1=day2, 2=day7, 3=day14
  sent_at TIMESTAMPTZ DEFAULT now(),
  email_id TEXT,
  UNIQUE(profile_id, drip_type, step)
);

CREATE INDEX IF NOT EXISTS idx_drip_email_log_profile
  ON drip_email_log(profile_id, drip_type);
