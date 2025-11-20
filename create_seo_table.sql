-- Create SEO Content Table
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_seo_content_type ON public.seo_content(type);
CREATE INDEX IF NOT EXISTS idx_seo_content_location ON public.seo_content(location);
CREATE INDEX IF NOT EXISTS idx_seo_content_slug ON public.seo_content(slug);
CREATE INDEX IF NOT EXISTS idx_seo_content_published ON public.seo_content(is_published);

-- Enable Row Level Security
ALTER TABLE public.seo_content ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access" ON public.seo_content
    FOR SELECT
    USING (is_published = true);

-- Create policy to allow authenticated users to manage content
CREATE POLICY "Allow authenticated users to manage" ON public.seo_content
    FOR ALL
    USING (auth.role() = 'authenticated');
