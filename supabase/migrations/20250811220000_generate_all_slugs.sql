-- Generate slugs for all profiles directly in database
-- Run this in Supabase SQL Editor

-- Function to generate clean slugs
CREATE OR REPLACE FUNCTION generate_slug(name TEXT, city TEXT, state TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(
        regexp_replace(
            regexp_replace(
                regexp_replace(
                    COALESCE(name, 'unknown') || '-' || COALESCE(city, 'unknown') || '-' || COALESCE(state, 'unknown'),
                    '[^a-zA-Z0-9\s-]', '', 'g'  -- Remove special chars
                ),
                '\s+', '-', 'g'  -- Spaces to hyphens
            ),
            '-+', '-', 'g'  -- Multiple hyphens to single
        )
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update all profiles with proper slugs
DO $$
DECLARE
    profile_record RECORD;
    new_slug TEXT;
    slug_counter INTEGER;
BEGIN
    -- Loop through all profiles that need slugs
    FOR profile_record IN
        SELECT id, full_name, city, state_province, slug
        FROM profiles
        WHERE slug IS NULL
           OR slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}'  -- UUID pattern
        ORDER BY created_at ASC
    LOOP
        -- Generate base slug
        new_slug := generate_slug(
            profile_record.full_name,
            profile_record.city,
            profile_record.state_province
        );

        -- Check for duplicates and append number if needed
        slug_counter := 1;
        WHILE EXISTS (SELECT 1 FROM profiles WHERE slug = new_slug AND id != profile_record.id) LOOP
            new_slug := generate_slug(
                profile_record.full_name,
                profile_record.city,
                profile_record.state_province
            ) || '-' || slug_counter;
            slug_counter := slug_counter + 1;
        END LOOP;

        -- Update the profile
        UPDATE profiles
        SET slug = new_slug
        WHERE id = profile_record.id;

        RAISE NOTICE 'Updated % to slug: %', profile_record.full_name, new_slug;
    END LOOP;
END $$;

-- Verify results
SELECT
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}' THEN 1 END) as still_uuid_slugs,
    COUNT(CASE WHEN slug IS NOT NULL AND slug !~ '^[0-9a-f]{8}-[0-9a-f]{4}' THEN 1 END) as proper_slugs
FROM profiles;

-- Show some examples
SELECT full_name, city, state_province, slug
FROM profiles
WHERE slug IS NOT NULL
LIMIT 10;
