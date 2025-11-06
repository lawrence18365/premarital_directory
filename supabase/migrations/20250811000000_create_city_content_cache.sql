-- Create table for caching AI-generated city content
CREATE TABLE city_content_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    state VARCHAR(50) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state_abbr CHAR(2) NOT NULL,
    
    -- SEO Content Fields
    title VARCHAR(200),
    description TEXT,
    h1_content VARCHAR(200),
    intro_paragraph TEXT,
    
    -- Generated Content Sections
    marriage_statistics JSONB,
    local_venues JSONB,
    pricing_insights JSONB,
    legal_requirements TEXT,
    nearby_cities JSONB,
    demographics JSONB,
    
    -- Meta Fields  
    content_generated_at TIMESTAMP DEFAULT NOW(),
    last_updated TIMESTAMP DEFAULT NOW(),
    cache_expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    
    -- Performance tracking
    generation_cost_tokens INTEGER DEFAULT 0,
    api_provider VARCHAR(50),
    
    -- Unique constraint on city/state combination
    UNIQUE(state, city)
);

-- Add indexes for fast lookups
CREATE INDEX idx_city_content_state_city ON city_content_cache(state, city);
CREATE INDEX idx_city_content_expires ON city_content_cache(cache_expires_at);
CREATE INDEX idx_city_content_active ON city_content_cache(is_active);

-- Add RLS policies
ALTER TABLE city_content_cache ENABLE ROW LEVEL SECURITY;

-- Allow read access for all users (including anon)
CREATE POLICY "Allow read access for all users" ON city_content_cache
    FOR SELECT USING (true);

-- Allow insert/update for service role and anon (for testing)
CREATE POLICY "Allow insert for service role" ON city_content_cache
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update for service role" ON city_content_cache
    FOR UPDATE USING (true);