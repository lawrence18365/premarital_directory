-- Ensure one user can only have one profile.
-- user_id can be NULL (unclaimed/imported profiles), so use a partial unique index.
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_profile
  ON profiles (user_id)
  WHERE user_id IS NOT NULL;
