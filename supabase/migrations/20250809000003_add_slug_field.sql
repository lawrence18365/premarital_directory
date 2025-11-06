-- Add slug field for SEO-friendly URLs
-- Migration: 0001_add_slug_field.sql

ALTER TABLE profiles ADD COLUMN slug TEXT UNIQUE;

-- Create index for fast slug lookups
CREATE INDEX idx_profiles_slug ON profiles(slug);

-- Function to generate slug from name
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(input_text, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Update existing profiles with slugs
UPDATE profiles 
SET slug = generate_slug(full_name) || '-' || substr(id::text, 1, 8)
WHERE slug IS NULL;

-- Ensure all future profiles have slugs
CREATE OR REPLACE FUNCTION set_profile_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL THEN
    NEW.slug := generate_slug(NEW.full_name) || '-' || substr(NEW.id::text, 1, 8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_profile_slug
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_profile_slug();
