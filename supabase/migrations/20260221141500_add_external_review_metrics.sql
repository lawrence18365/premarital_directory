-- Add external review score and count fields for aggregate rating schema snippet
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS external_review_score DECIMAL(3,2),
  ADD COLUMN IF NOT EXISTS external_review_count INTEGER;

-- Ensure constraints: Score must be between 1 and 5
ALTER TABLE profiles
  ADD CONSTRAINT external_review_score_check
  CHECK (external_review_score >= 1.0 AND external_review_score <= 5.0);

-- Ensure count is non-negative
ALTER TABLE profiles
  ADD CONSTRAINT external_review_count_check
  CHECK (external_review_count >= 0);
