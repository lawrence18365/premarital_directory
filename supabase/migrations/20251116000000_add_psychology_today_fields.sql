-- Add Psychology Today-style enhanced profile fields
-- This migration adds fields to match the comprehensive data model of professional directories

-- Add pronouns for professional identity
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pronouns TEXT;

-- Add payment methods (cash, card, etc.)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payment_methods TEXT[];

-- Add treatment approaches (Gottman, EFT, CBT, etc.)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS treatment_approaches TEXT[];

-- Create indexes for new filterable fields
CREATE INDEX IF NOT EXISTS idx_profiles_payment_methods ON profiles USING GIN (payment_methods);
CREATE INDEX IF NOT EXISTS idx_profiles_treatment_approaches ON profiles USING GIN (treatment_approaches);

-- Update profile completeness score to include new fields
CREATE OR REPLACE FUNCTION calculate_profile_completeness(profile_record profiles)
RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 0;
BEGIN
    -- Core fields (10 points each, max 50)
    IF profile_record.full_name IS NOT NULL AND LENGTH(profile_record.full_name) > 0 THEN score := score + 10; END IF;
    IF profile_record.bio IS NOT NULL AND LENGTH(profile_record.bio) > 100 THEN score := score + 10; END IF;
    IF profile_record.profession IS NOT NULL THEN score := score + 10; END IF;
    IF profile_record.city IS NOT NULL THEN score := score + 10; END IF;
    IF profile_record.state_province IS NOT NULL THEN score := score + 10; END IF;

    -- Contact info (5 points each, max 15)
    IF profile_record.email IS NOT NULL THEN score := score + 5; END IF;
    IF profile_record.phone IS NOT NULL THEN score := score + 5; END IF;
    IF profile_record.website IS NOT NULL THEN score := score + 5; END IF;

    -- Enhanced fields (variable points, max 35)
    IF profile_record.photo_url IS NOT NULL THEN score := score + 5; END IF;
    IF profile_record.specialties IS NOT NULL AND array_length(profile_record.specialties, 1) > 0 THEN score := score + 5; END IF;
    IF profile_record.credentials IS NOT NULL AND array_length(profile_record.credentials, 1) > 0 THEN score := score + 5; END IF;
    IF profile_record.education IS NOT NULL AND array_length(profile_record.education, 1) > 0 THEN score := score + 3; END IF;
    IF profile_record.years_experience IS NOT NULL AND profile_record.years_experience > 0 THEN score := score + 5; END IF;
    IF profile_record.approach IS NOT NULL AND LENGTH(profile_record.approach) > 50 THEN score := score + 2; END IF;
    IF profile_record.languages IS NOT NULL AND array_length(profile_record.languages, 1) > 0 THEN score := score + 2; END IF;
    IF profile_record.session_types IS NOT NULL AND array_length(profile_record.session_types, 1) > 0 THEN score := score + 3; END IF;
    IF profile_record.insurance_accepted IS NOT NULL AND array_length(profile_record.insurance_accepted, 1) > 0 THEN score := score + 3; END IF;
    IF profile_record.pricing_range IS NOT NULL THEN score := score + 2; END IF;

    -- New Psychology Today fields (bonus points)
    IF profile_record.offers_free_consultation = true THEN score := score + 3; END IF;
    IF profile_record.treatment_approaches IS NOT NULL AND array_length(profile_record.treatment_approaches, 1) > 0 THEN score := score + 2; END IF;
    IF profile_record.client_focus IS NOT NULL AND array_length(profile_record.client_focus, 1) > 0 THEN score := score + 2; END IF;
    IF profile_record.payment_methods IS NOT NULL AND array_length(profile_record.payment_methods, 1) > 0 THEN score := score + 2; END IF;
    IF profile_record.session_fee_min IS NOT NULL AND profile_record.session_fee_max IS NOT NULL THEN score := score + 3; END IF;

    RETURN LEAST(score, 100); -- Cap at 100
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Recreate trigger
DROP TRIGGER IF EXISTS update_completeness_trigger ON profiles;
CREATE TRIGGER update_completeness_trigger
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_completeness();

-- Update all existing profiles to recalculate completeness score
UPDATE profiles SET profile_completeness_score = calculate_profile_completeness(profiles.*);

-- Add comments for documentation
COMMENT ON COLUMN profiles.pronouns IS 'Professional pronouns (he/him, she/her, they/them)';
COMMENT ON COLUMN profiles.payment_methods IS 'Accepted payment methods (Cash, Credit Card, HSA/FSA, etc.)';
COMMENT ON COLUMN profiles.treatment_approaches IS 'Therapeutic approaches (Gottman Method, EFT, CBT, etc.)';

-- Create view for profile analytics
CREATE OR REPLACE VIEW profile_completeness_analytics AS
SELECT
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN profile_completeness_score >= 80 THEN 1 END) as high_quality_profiles,
    COUNT(CASE WHEN profile_completeness_score >= 50 AND profile_completeness_score < 80 THEN 1 END) as medium_quality_profiles,
    COUNT(CASE WHEN profile_completeness_score < 50 THEN 1 END) as low_quality_profiles,
    AVG(profile_completeness_score)::INTEGER as avg_completeness_score,
    COUNT(CASE WHEN years_experience IS NOT NULL THEN 1 END) as profiles_with_experience,
    COUNT(CASE WHEN session_fee_min IS NOT NULL THEN 1 END) as profiles_with_pricing,
    COUNT(CASE WHEN offers_free_consultation = true THEN 1 END) as profiles_offering_free_consult,
    COUNT(CASE WHEN credentials IS NOT NULL AND array_length(credentials, 1) > 0 THEN 1 END) as profiles_with_credentials,
    COUNT(CASE WHEN insurance_accepted IS NOT NULL AND array_length(insurance_accepted, 1) > 0 THEN 1 END) as profiles_with_insurance,
    COUNT(CASE WHEN treatment_approaches IS NOT NULL AND array_length(treatment_approaches, 1) > 0 THEN 1 END) as profiles_with_approaches
FROM profiles
WHERE is_claimed = true;
