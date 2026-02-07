-- Add moderation_reviewed_at and moderation_notes columns to profiles
-- These were referenced in code but never created in the database
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS moderation_reviewed_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS moderation_notes TEXT;
