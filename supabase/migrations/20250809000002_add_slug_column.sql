-- Add slug column for SEO-friendly URLs
-- Migration: Add slug column to profiles table

ALTER TABLE profiles ADD COLUMN slug TEXT UNIQUE;

-- Create index for fast slug lookups
CREATE INDEX idx_profiles_slug ON profiles(slug);

-- Update RLS policies to include slug-based access
CREATE POLICY "Public profiles are viewable by slug." ON profiles
    FOR SELECT USING (true);

-- Add comment for documentation
COMMENT ON COLUMN profiles.slug IS 'SEO-friendly URL slug for profile pages (e.g., dr-sarah-mitchell)';
