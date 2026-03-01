-- Add updated_at column to posts for SEO dateModified structured data
ALTER TABLE posts ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone;

-- Backfill: set updated_at to date (or created_at) for existing posts
UPDATE posts SET updated_at = COALESCE(date::timestamptz, created_at) WHERE updated_at IS NULL;

-- Auto-update on row change
CREATE OR REPLACE FUNCTION update_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER posts_updated_at_trigger
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_posts_updated_at();
