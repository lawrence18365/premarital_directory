-- Fix: trg_set_referral_code fires BEFORE trigger_auto_generate_slug (alphabetically)
-- which means it copies an empty/incomplete slug to referral_code before the slug
-- is actually generated. This causes ALL new profile inserts (draft profiles with
-- empty full_name) to get referral_code = '' and hit the unique constraint.
--
-- Fix 1: Update the function to skip empty strings (defensive)
-- Fix 2: Drop and recreate with a name that sorts AFTER the slug triggers

-- Fix the function to be defensive about empty slugs
CREATE OR REPLACE FUNCTION set_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Only copy slug → referral_code when slug is a meaningful value
  -- (not null, not empty) and referral_code hasn't been set yet.
  IF NEW.slug IS NOT NULL
     AND NEW.slug != ''
     AND NEW.referral_code IS NULL THEN
    NEW.referral_code := NEW.slug;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the old trigger (fires too early due to alphabetical ordering)
DROP TRIGGER IF EXISTS trg_set_referral_code ON profiles;

-- Recreate with a name that sorts AFTER trigger_auto_generate_slug
CREATE TRIGGER trigger_z_set_referral_code
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_referral_code();

-- Fix the existing profile stuck with referral_code = '' (empty string)
UPDATE profiles
SET referral_code = slug
WHERE referral_code = '' AND slug IS NOT NULL AND slug != '';

-- For any remaining '' referral_codes where slug is also empty, set to NULL
UPDATE profiles
SET referral_code = NULL
WHERE referral_code = '';
