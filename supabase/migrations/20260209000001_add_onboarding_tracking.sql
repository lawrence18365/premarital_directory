-- Add onboarding tracking columns to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_last_saved_at TIMESTAMPTZ;

-- Create index for efficient querying of incomplete onboarding profiles
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_incomplete
  ON profiles(user_id, onboarding_completed)
  WHERE onboarding_completed = false;

-- Mark existing claimed profiles as having completed onboarding
-- This ensures the new flow only applies to new signups
UPDATE profiles
SET onboarding_completed = true
WHERE is_claimed = true AND user_id IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN profiles.onboarding_step IS 'Tracks which question (1-19) the user is on during signup';
COMMENT ON COLUMN profiles.onboarding_completed IS 'True when user has published their profile';
COMMENT ON COLUMN profiles.onboarding_started_at IS 'Timestamp when user first started onboarding';
COMMENT ON COLUMN profiles.onboarding_last_saved_at IS 'Timestamp of last auto-save during onboarding';
