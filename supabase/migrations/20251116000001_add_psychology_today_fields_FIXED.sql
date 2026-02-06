-- Add Psychology Today-style enhanced profile fields
-- COMPLETE WORKING VERSION - Run this in Supabase SQL Editor

-- ========================================
-- PART 1: Add all missing profile columns
-- ========================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credentials TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS years_experience INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS approach TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS client_focus TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS languages TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS session_types TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS insurance_accepted TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pricing_range TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS session_fee_min INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS session_fee_max INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS education TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS office_hours JSONB;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS booking_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS accepting_new_clients BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS offers_free_consultation BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_completeness_score INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pronouns TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payment_methods TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS treatment_approaches TEXT[];

-- ========================================
-- PART 2: Create indexes for filtering
-- ========================================
CREATE INDEX IF NOT EXISTS idx_profiles_languages ON profiles USING GIN (languages);
CREATE INDEX IF NOT EXISTS idx_profiles_insurance ON profiles USING GIN (insurance_accepted);
CREATE INDEX IF NOT EXISTS idx_profiles_session_types ON profiles USING GIN (session_types);
CREATE INDEX IF NOT EXISTS idx_profiles_accepting_clients ON profiles(accepting_new_clients) WHERE accepting_new_clients = true;
CREATE INDEX IF NOT EXISTS idx_profiles_payment_methods ON profiles USING GIN (payment_methods);
CREATE INDEX IF NOT EXISTS idx_profiles_treatment_approaches ON profiles USING GIN (treatment_approaches);

-- ========================================
-- PART 3: Fix credentials column type if it's TEXT instead of TEXT[]
-- ========================================
-- Only run this if credentials is TEXT type:
-- ALTER TABLE profiles ALTER COLUMN credentials TYPE TEXT[] USING CASE
--   WHEN credentials IS NULL THEN NULL
--   WHEN credentials = '' THEN NULL
--   ELSE ARRAY[credentials]
-- END;

-- ========================================
-- PART 4: Create profile completeness function
-- ========================================
DROP FUNCTION IF EXISTS calculate_profile_completeness(profiles) CASCADE;

CREATE OR REPLACE FUNCTION calculate_profile_completeness(p profiles)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN LEAST(
    COALESCE(
      (CASE WHEN p.full_name IS NOT NULL AND LENGTH(p.full_name) > 0 THEN 10 ELSE 0 END) +
      (CASE WHEN p.email IS NOT NULL THEN 5 ELSE 0 END) +
      (CASE WHEN p.profession IS NOT NULL THEN 10 ELSE 0 END) +
      (CASE WHEN p.city IS NOT NULL THEN 10 ELSE 0 END) +
      (CASE WHEN p.state_province IS NOT NULL THEN 10 ELSE 0 END) +
      (CASE WHEN p.bio IS NOT NULL AND LENGTH(p.bio) > 100 THEN 10 ELSE 0 END) +
      (CASE WHEN p.phone IS NOT NULL THEN 5 ELSE 0 END) +
      (CASE WHEN p.website IS NOT NULL THEN 5 ELSE 0 END) +
      (CASE WHEN p.photo_url IS NOT NULL THEN 5 ELSE 0 END) +
      (CASE WHEN p.years_experience IS NOT NULL AND p.years_experience > 0 THEN 5 ELSE 0 END) +
      (CASE WHEN p.offers_free_consultation = true THEN 3 ELSE 0 END) +
      (CASE WHEN p.session_fee_min IS NOT NULL AND p.session_fee_max IS NOT NULL THEN 3 ELSE 0 END) +
      (CASE WHEN p.specialties IS NOT NULL THEN 5 ELSE 0 END) +
      (CASE WHEN p.session_types IS NOT NULL THEN 3 ELSE 0 END) +
      (CASE WHEN p.credentials IS NOT NULL THEN 5 ELSE 0 END) +
      (CASE WHEN p.insurance_accepted IS NOT NULL THEN 3 ELSE 0 END) +
      (CASE WHEN p.treatment_approaches IS NOT NULL THEN 2 ELSE 0 END) +
      (CASE WHEN p.payment_methods IS NOT NULL THEN 2 ELSE 0 END) +
      (CASE WHEN p.client_focus IS NOT NULL THEN 2 ELSE 0 END)
    , 0),
  100);
END;
$$;

-- ========================================
-- PART 5: Create trigger function and trigger
-- ========================================
CREATE OR REPLACE FUNCTION update_profile_completeness()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.profile_completeness_score := calculate_profile_completeness(NEW);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_completeness_trigger ON profiles;
CREATE TRIGGER update_completeness_trigger
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_profile_completeness();

-- ========================================
-- PART 6: Update all existing profiles
-- ========================================
UPDATE profiles SET profile_completeness_score = calculate_profile_completeness(profiles.*);

-- ========================================
-- PART 7: Add documentation comments
-- ========================================
COMMENT ON COLUMN profiles.pronouns IS 'Professional pronouns (he/him, she/her, they/them)';
COMMENT ON COLUMN profiles.payment_methods IS 'Accepted payment methods (Cash, Credit Card, HSA/FSA, etc.)';
COMMENT ON COLUMN profiles.treatment_approaches IS 'Therapeutic approaches (Gottman Method, EFT, CBT, etc.)';
COMMENT ON COLUMN profiles.profile_completeness_score IS 'Automatically calculated score (0-100) based on profile field completeness';
