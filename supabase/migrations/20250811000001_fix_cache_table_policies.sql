-- Fix RLS policies for city_content_cache table

-- Drop existing policies
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON city_content_cache;
DROP POLICY IF EXISTS "Allow insert/update for service role" ON city_content_cache;

-- Allow read access for all users (including anon)
CREATE POLICY "Allow read access for all users" ON city_content_cache
    FOR SELECT USING (true);

-- Allow insert/update for all users (needed for caching system)
CREATE POLICY "Allow insert for all users" ON city_content_cache
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update for all users" ON city_content_cache
    FOR UPDATE USING (true);

-- Allow delete for all users (for cleanup)
CREATE POLICY "Allow delete for all users" ON city_content_cache
    FOR DELETE USING (true);