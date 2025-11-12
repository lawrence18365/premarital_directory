-- Add index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_slug ON profiles(slug);

-- Add unique constraint on slug to prevent duplicates
-- Note: This will fail if you have duplicate slugs, which is why we generate unique ones first
-- ALTER TABLE profiles ADD CONSTRAINT unique_profile_slug UNIQUE (slug);

-- Add helper function to generate slugs
CREATE OR REPLACE FUNCTION generate_profile_slug(name TEXT, city TEXT, state TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(
        regexp_replace(
            regexp_replace(
                regexp_replace(
                    name || '-' || COALESCE(city, 'unknown') || '-' || COALESCE(state, 'unknown'),
                    '[^a-zA-Z0-9\s-]', '', 'g'  -- Remove special chars
                ),
                '\s+', '-', 'g'  -- Spaces to hyphens
            ),
            '-+', '-', 'g'  -- Multiple hyphens to single
        )
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to auto-generate slug on insert if not provided
CREATE OR REPLACE FUNCTION auto_generate_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := generate_profile_slug(NEW.full_name, NEW.city, NEW.state_province);

        -- Handle duplicates by appending ID
        IF EXISTS (SELECT 1 FROM profiles WHERE slug = NEW.slug AND id != NEW.id) THEN
            NEW.slug := NEW.slug || '-' || substring(NEW.id::text from 1 for 8);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_slug
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION auto_generate_slug();
