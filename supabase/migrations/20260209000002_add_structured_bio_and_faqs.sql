-- Add structured bio fields for better SEO content
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS bio_approach TEXT,
  ADD COLUMN IF NOT EXISTS bio_ideal_client TEXT,
  ADD COLUMN IF NOT EXISTS bio_outcomes TEXT,
  ADD COLUMN IF NOT EXISTS faqs JSONB;

-- Comments for documentation
COMMENT ON COLUMN profiles.bio_approach IS 'Counselor approach in 2-3 sentences (SEO-optimized)';
COMMENT ON COLUMN profiles.bio_ideal_client IS 'Description of ideal client fit (SEO-optimized)';
COMMENT ON COLUMN profiles.bio_outcomes IS 'Expected outcomes for couples (SEO-optimized)';
COMMENT ON COLUMN profiles.faqs IS 'Array of {id, question, answer} objects for profile FAQ section';

-- For existing profiles with bio, we don't auto-split it - they can update if needed
-- New profiles will use the structured fields from the start
