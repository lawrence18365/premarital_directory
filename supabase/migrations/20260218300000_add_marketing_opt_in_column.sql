-- Add explicit marketing opt-in columns to profiles
-- Previously buried inside email_preferences JSONB — now a proper queryable column
-- with an audit timestamp so we know exactly when consent was recorded.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS marketing_opt_in BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS marketing_opt_in_at TIMESTAMPTZ;

-- Backfill from existing JSONB for any rows already in the table.
-- Rows where email_preferences->>'marketing' is explicitly 'false' get opted out.
-- Everything else (true, null, missing key) stays opted in.
UPDATE profiles
SET
  marketing_opt_in    = COALESCE((email_preferences->>'marketing')::boolean, true),
  marketing_opt_in_at = COALESCE(created_at, now())
WHERE marketing_opt_in_at IS NULL;

-- Index for fast opt-out filtering (drip emails, digest sends, etc.)
CREATE INDEX IF NOT EXISTS idx_profiles_marketing_opt_in
  ON profiles(marketing_opt_in)
  WHERE marketing_opt_in = false;

-- Keep email_preferences.marketing in sync going forward via a trigger
-- so existing code that reads JSONB doesn't break.
CREATE OR REPLACE FUNCTION sync_marketing_opt_in()
RETURNS TRIGGER AS $$
BEGIN
  -- If the dedicated column changed, mirror it into JSONB
  IF NEW.marketing_opt_in IS DISTINCT FROM OLD.marketing_opt_in THEN
    NEW.email_preferences = jsonb_set(
      COALESCE(NEW.email_preferences, '{}'::jsonb),
      '{marketing}',
      to_jsonb(NEW.marketing_opt_in)
    );
    IF NEW.marketing_opt_in_at IS NULL OR NEW.marketing_opt_in_at = OLD.marketing_opt_in_at THEN
      NEW.marketing_opt_in_at = now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_marketing_opt_in ON profiles;
CREATE TRIGGER trg_sync_marketing_opt_in
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION sync_marketing_opt_in();
