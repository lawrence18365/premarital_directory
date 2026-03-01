-- Referral system: lets counselors invite colleagues
-- Referrer gets "Community Builder" badge + ranking boost after referee claims

-- Add referral code + referred_by + signup_referral_code to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS signup_referral_code TEXT;

-- Generate referral codes for all existing profiles that have a slug
UPDATE profiles
SET referral_code = slug
WHERE slug IS NOT NULL AND referral_code IS NULL;

-- Index for fast lookup when someone signs up via referral link
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles (referral_code) WHERE referral_code IS NOT NULL;

-- Referrals tracking table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id),
  referee_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded')),
  reward_granted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(referrer_id, referee_id)
);

-- RLS: referrers can see their own referrals
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY referrals_select_own ON referrals
  FOR SELECT USING (referrer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Allow service role / edge functions full access (no policy needed — they bypass RLS)

-- Public read access to referral_code (needed to validate referral links)
-- Already handled by profiles RLS if the profile is public

-- Trigger: when a profile completes onboarding, resolve signup_referral_code → referred_by
-- and create a referrals record
CREATE OR REPLACE FUNCTION resolve_referral()
RETURNS TRIGGER AS $$
DECLARE
  referrer_profile_id UUID;
BEGIN
  -- Only fire when onboarding_completed flips to true
  IF NEW.onboarding_completed = true
     AND (OLD.onboarding_completed IS DISTINCT FROM true)
     AND NEW.signup_referral_code IS NOT NULL
     AND NEW.referred_by IS NULL
  THEN
    -- Look up the referrer by their referral_code
    SELECT id INTO referrer_profile_id
    FROM profiles
    WHERE referral_code = NEW.signup_referral_code
    LIMIT 1;

    IF referrer_profile_id IS NOT NULL AND referrer_profile_id != NEW.id THEN
      -- Set referred_by on the new profile
      NEW.referred_by := referrer_profile_id;

      -- Create referral record (ignore if already exists)
      INSERT INTO referrals (referrer_id, referee_id, status)
      VALUES (referrer_profile_id, NEW.id, 'completed')
      ON CONFLICT (referrer_id, referee_id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_resolve_referral
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION resolve_referral();

-- Auto-generate referral_code from slug when slug is set and referral_code is null
CREATE OR REPLACE FUNCTION set_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NOT NULL AND NEW.referral_code IS NULL THEN
    NEW.referral_code := NEW.slug;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_referral_code
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_referral_code();

COMMENT ON TABLE referrals IS 'Tracks counselor-to-counselor referrals for the Community Builder program';
COMMENT ON COLUMN profiles.referral_code IS 'Unique referral code for invite-a-colleague links (defaults to slug)';
COMMENT ON COLUMN profiles.referred_by IS 'Profile ID of the counselor who referred this professional';
COMMENT ON COLUMN profiles.signup_referral_code IS 'Raw referral code from signup URL, resolved to referred_by on completion';
