-- Add enhanced profile fields for better content and SEO
-- This migration adds missing fields that are referenced in the ProfilePage component

-- Add credentials array (licenses, certifications)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credentials TEXT[];

-- Add years of experience
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS years_experience INTEGER;

-- Add therapeutic approach/methodology
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS approach TEXT;

-- Add client focus areas
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS client_focus TEXT[];

-- Add languages spoken
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS languages TEXT[];

-- Add session types (in-person, online, hybrid)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS session_types TEXT[];

-- Add insurance information
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS insurance_accepted TEXT[];

-- Add pricing information
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pricing_range TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS session_fee_min INTEGER; -- in cents
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS session_fee_max INTEGER; -- in cents

-- Add education background
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS education TEXT[];

-- Add availability/office hours
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS office_hours JSONB;

-- Add booking URL
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS booking_url TEXT;

-- Add accepting new clients flag
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS accepting_new_clients BOOLEAN DEFAULT true;

-- Add free consultation flag
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS offers_free_consultation BOOLEAN DEFAULT false;

-- Add profile completeness score (for internal use)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_completeness_score INTEGER DEFAULT 0;

-- Create index for filtering by languages
CREATE INDEX IF NOT EXISTS idx_profiles_languages ON profiles USING GIN (languages);

-- Create index for filtering by insurance
CREATE INDEX IF NOT EXISTS idx_profiles_insurance ON profiles USING GIN (insurance_accepted);

-- Create index for filtering by session types
CREATE INDEX IF NOT EXISTS idx_profiles_session_types ON profiles USING GIN (session_types);

-- Create index for accepting new clients
CREATE INDEX IF NOT EXISTS idx_profiles_accepting_clients ON profiles(accepting_new_clients) WHERE accepting_new_clients = true;

-- Create function to calculate profile completeness
-- Drop first because parameter name may differ from existing version
DROP FUNCTION IF EXISTS calculate_profile_completeness(profiles);
CREATE OR REPLACE FUNCTION calculate_profile_completeness(profile_record profiles)
RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 0;
BEGIN
    -- Core fields (10 points each)
    IF profile_record.full_name IS NOT NULL AND LENGTH(profile_record.full_name) > 0 THEN score := score + 10; END IF;
    IF profile_record.bio IS NOT NULL AND LENGTH(profile_record.bio) > 100 THEN score := score + 10; END IF;
    IF profile_record.profession IS NOT NULL THEN score := score + 10; END IF;
    IF profile_record.city IS NOT NULL THEN score := score + 10; END IF;
    IF profile_record.state_province IS NOT NULL THEN score := score + 10; END IF;

    -- Contact info (5 points each)
    IF profile_record.email IS NOT NULL THEN score := score + 5; END IF;
    IF profile_record.phone IS NOT NULL THEN score := score + 5; END IF;
    IF profile_record.website IS NOT NULL THEN score := score + 5; END IF;

    -- Enhanced fields (5 points each)
    IF profile_record.photo_url IS NOT NULL THEN score := score + 5; END IF;
    IF profile_record.specialties IS NOT NULL AND array_length(profile_record.specialties, 1) > 0 THEN score := score + 5; END IF;
    IF profile_record.credentials IS NOT NULL AND array_length(profile_record.credentials, 1) > 0 THEN score := score + 5; END IF;
    IF profile_record.education IS NOT NULL AND array_length(profile_record.education, 1) > 0 THEN score := score + 5; END IF;
    IF profile_record.years_experience IS NOT NULL AND profile_record.years_experience > 0 THEN score := score + 5; END IF;
    IF profile_record.approach IS NOT NULL AND LENGTH(profile_record.approach) > 50 THEN score := score + 5; END IF;
    IF profile_record.languages IS NOT NULL AND array_length(profile_record.languages, 1) > 0 THEN score := score + 5; END IF;
    IF profile_record.session_types IS NOT NULL AND array_length(profile_record.session_types, 1) > 0 THEN score := score + 5; END IF;
    IF profile_record.insurance_accepted IS NOT NULL AND array_length(profile_record.insurance_accepted, 1) > 0 THEN score := score + 5; END IF;
    IF profile_record.pricing_range IS NOT NULL THEN score := score + 5; END IF;

    RETURN LEAST(score, 100); -- Cap at 100
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create trigger to update completeness score
CREATE OR REPLACE FUNCTION update_profile_completeness()
RETURNS TRIGGER AS $$
BEGIN
    NEW.profile_completeness_score := calculate_profile_completeness(NEW);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_completeness_trigger ON profiles;
CREATE TRIGGER update_completeness_trigger
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_completeness();

-- Update existing profiles to calculate their completeness score
UPDATE profiles SET profile_completeness_score = calculate_profile_completeness(profiles.*);

-- Add comment for documentation
COMMENT ON COLUMN profiles.profile_completeness_score IS 'Automatically calculated score (0-100) based on profile field completeness';
