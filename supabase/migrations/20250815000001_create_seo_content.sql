-- Create SEO content table for programmatically generated location pages
CREATE TABLE IF NOT EXISTS public.seo_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(50) NOT NULL CHECK (type IN ('city', 'state', 'blog')),
    location VARCHAR(255) NOT NULL,
    state VARCHAR(100),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    meta_description TEXT,
    keywords TEXT[],
    slug VARCHAR(500) UNIQUE NOT NULL,
    is_published BOOLEAN DEFAULT TRUE,
    word_count INTEGER,
    readability_score DECIMAL(3,2),
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_seo_content_type ON public.seo_content(type);
CREATE INDEX IF NOT EXISTS idx_seo_content_location ON public.seo_content(location);
CREATE INDEX IF NOT EXISTS idx_seo_content_state ON public.seo_content(state);
CREATE INDEX IF NOT EXISTS idx_seo_content_slug ON public.seo_content(slug);
CREATE INDEX IF NOT EXISTS idx_seo_content_published ON public.seo_content(is_published);

-- Function to calculate word count
CREATE OR REPLACE FUNCTION update_word_count()
RETURNS TRIGGER AS $$
BEGIN
    NEW.word_count = array_length(string_to_array(regexp_replace(NEW.content, '<[^>]*>', '', 'g'), ' '), 1);
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update word count
CREATE TRIGGER trigger_update_word_count
    BEFORE INSERT OR UPDATE ON public.seo_content
    FOR EACH ROW
    EXECUTE FUNCTION update_word_count();

-- RLS policies
ALTER TABLE public.seo_content ENABLE ROW LEVEL SECURITY;

-- Allow public read access for published content
CREATE POLICY "Public can read published SEO content" ON public.seo_content
    FOR SELECT USING (is_published = TRUE);

-- Allow service role full access
CREATE POLICY "Service role can manage SEO content" ON public.seo_content
    FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT ALL ON public.seo_content TO service_role;
GRANT SELECT ON public.seo_content TO anon;
GRANT SELECT ON public.seo_content TO authenticated;