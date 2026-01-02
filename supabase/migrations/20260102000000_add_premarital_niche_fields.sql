-- Add premarital counseling niche-specific fields
-- These fields help counselors stand out and help couples find the right match

-- ========================================
-- PART 1: Add new profile columns
-- ========================================

-- Certifications specific to premarital counseling
-- e.g., 'SYMBIS Certified', 'PREPARE/ENRICH Certified', 'Gottman Certified Therapist'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS certifications TEXT[];

-- Faith tradition - important for couples choosing counselors
-- e.g., 'secular', 'catholic', 'christian', 'jewish', 'muslim', 'interfaith', 'all-faiths'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS faith_tradition TEXT;

-- ========================================
-- PART 2: Create indexes for filtering
-- ========================================

-- Index for filtering by certifications
CREATE INDEX IF NOT EXISTS idx_profiles_certifications ON profiles USING GIN (certifications);

-- Index for filtering by faith tradition
CREATE INDEX IF NOT EXISTS idx_profiles_faith_tradition ON profiles(faith_tradition);

-- ========================================
-- PART 3: Update profile completeness function
-- ========================================

-- Drop and recreate the function with new fields
DROP FUNCTION IF EXISTS calculate_profile_completeness(profiles) CASCADE;

CREATE OR REPLACE FUNCTION calculate_profile_completeness(p profiles)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN LEAST(
    COALESCE(
      -- Core fields (10 points each = 50 max)
      (CASE WHEN p.full_name IS NOT NULL AND LENGTH(p.full_name) > 0 THEN 10 ELSE 0 END) +
      (CASE WHEN p.profession IS NOT NULL THEN 10 ELSE 0 END) +
      (CASE WHEN p.city IS NOT NULL THEN 10 ELSE 0 END) +
      (CASE WHEN p.state_province IS NOT NULL THEN 10 ELSE 0 END) +
      (CASE WHEN p.bio IS NOT NULL AND LENGTH(p.bio) > 100 THEN 10 ELSE 0 END) +

      -- Contact info (5 points each = 15 max)
      (CASE WHEN p.email IS NOT NULL THEN 5 ELSE 0 END) +
      (CASE WHEN p.phone IS NOT NULL THEN 5 ELSE 0 END) +
      (CASE WHEN p.website IS NOT NULL THEN 5 ELSE 0 END) +

      -- Visual (5 points)
      (CASE WHEN p.photo_url IS NOT NULL THEN 5 ELSE 0 END) +

      -- Professional details (3 points each = 18 max)
      (CASE WHEN p.years_experience IS NOT NULL AND p.years_experience > 0 THEN 3 ELSE 0 END) +
      (CASE WHEN p.certifications IS NOT NULL THEN 3 ELSE 0 END) +
      (CASE WHEN p.faith_tradition IS NOT NULL THEN 3 ELSE 0 END) +
      (CASE WHEN p.specialties IS NOT NULL THEN 3 ELSE 0 END) +
      (CASE WHEN p.treatment_approaches IS NOT NULL THEN 3 ELSE 0 END) +
      (CASE WHEN p.client_focus IS NOT NULL THEN 3 ELSE 0 END) +

      -- Practical info (2 points each = 10 max)
      (CASE WHEN p.session_types IS NOT NULL THEN 2 ELSE 0 END) +
      (CASE WHEN p.offers_free_consultation = true THEN 2 ELSE 0 END) +
      (CASE WHEN p.session_fee_min IS NOT NULL AND p.session_fee_max IS NOT NULL THEN 2 ELSE 0 END) +
      (CASE WHEN p.insurance_accepted IS NOT NULL THEN 2 ELSE 0 END) +
      (CASE WHEN p.payment_methods IS NOT NULL THEN 2 ELSE 0 END)
    , 0),
  100);
END;
$$;

-- ========================================
-- PART 4: Recreate trigger
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
-- PART 5: Update existing profiles
-- ========================================

UPDATE profiles SET profile_completeness_score = calculate_profile_completeness(profiles.*);

-- ========================================
-- PART 6: Add documentation comments
-- ========================================

COMMENT ON COLUMN profiles.certifications IS 'Premarital counseling certifications (SYMBIS, PREPARE/ENRICH, Gottman, etc.)';
COMMENT ON COLUMN profiles.faith_tradition IS 'Faith background/approach (secular, catholic, christian, jewish, muslim, interfaith, all-faiths)';
