-- Add attribution fields to profiles table for tracking signup sources
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS signup_source TEXT,
ADD COLUMN IF NOT EXISTS utm_source TEXT,
ADD COLUMN IF NOT EXISTS utm_medium TEXT,
ADD COLUMN IF NOT EXISTS utm_campaign TEXT;

-- Add index for attribution analytics queries
CREATE INDEX IF NOT EXISTS idx_profiles_signup_source ON profiles(signup_source);
CREATE INDEX IF NOT EXISTS idx_profiles_utm_source ON profiles(utm_source);

-- Add comment explaining the fields
COMMENT ON COLUMN profiles.signup_source IS 'How the provider found the directory (e.g., email_outreach, organic, fb_group, google_ads)';
COMMENT ON COLUMN profiles.utm_source IS 'UTM source parameter from signup URL';
COMMENT ON COLUMN profiles.utm_medium IS 'UTM medium parameter from signup URL';
COMMENT ON COLUMN profiles.utm_campaign IS 'UTM campaign parameter from signup URL';
