-- Create platform_leads table for the Concierge Matchmaker form
CREATE TABLE IF NOT EXISTS public.platform_leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    couple_name TEXT,
    couple_email TEXT NOT NULL,
    couple_phone TEXT,
    timeline TEXT,
    preference TEXT,
    message TEXT,
    city TEXT,
    state TEXT,
    source_url TEXT,
    status TEXT DEFAULT 'new' NOT NULL, -- new, forwarded, closed
    forwarded_to_provider_ids UUID[] DEFAULT '{}',
    email_delivery_status TEXT DEFAULT 'pending', -- pending, sent, failed
    email_delivery_error TEXT
);

-- Turn on Row Level Security
ALTER TABLE public.platform_leads ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert a new platform lead (public submission)
CREATE POLICY "Allow public inserts to platform_leads"
    ON public.platform_leads
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Only authenticated users (admins) can view platform leads
CREATE POLICY "Allow authenticated to view platform_leads"
    ON public.platform_leads
    FOR SELECT
    TO authenticated
    USING (true);

-- Create an index to quickly filter by email status if we need a retry cron
CREATE INDEX idx_platform_leads_email_status ON public.platform_leads(email_delivery_status);
