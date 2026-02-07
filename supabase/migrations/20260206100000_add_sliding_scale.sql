-- Add sliding_scale boolean to profiles for SEO-valuable "affordable therapy" queries
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sliding_scale BOOLEAN DEFAULT false;

COMMENT ON COLUMN profiles.sliding_scale IS 'Whether the professional offers sliding scale pricing based on income';
