-- Rebuild city_content_cache to be more flexible for AI content
-- We drop the old table because it is just a cache and the structure is changing significantly

DROP TABLE IF EXISTS city_content_cache;

CREATE TABLE city_content_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Lookup fields (indexed for speed)
    state_slug TEXT NOT NULL,
    city_slug TEXT NOT NULL,
    
    -- The Core Payload (Flexible JSON)
    content_data JSONB NOT NULL,
    
    -- Meta info
    provider TEXT DEFAULT 'gemini', -- 'gemini' or 'tavily'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraint to prevent duplicates
    UNIQUE(state_slug, city_slug)
);

-- Indexes for fast lookups by the API
CREATE INDEX idx_city_content_lookup ON city_content_cache(state_slug, city_slug);

-- Enable RLS
ALTER TABLE city_content_cache ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Everyone can READ the cache (so the frontend displays it)
CREATE POLICY "Public read access" ON city_content_cache
    FOR SELECT USING (true);

-- 2. Service Role (Edge Function) can INSERT/UPDATE
-- We also allow anon for now so the client-side generator can work if needed, 
-- though the Edge Function uses the Service Key usually.
CREATE POLICY "Service write access" ON city_content_cache
    FOR ALL USING (true) WITH CHECK (true);
