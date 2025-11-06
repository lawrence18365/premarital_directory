-- Create campaign_logs table to track email campaigns
CREATE TABLE IF NOT EXISTS public.campaign_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    campaign VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('sent', 'failed', 'bounced', 'delivered')),
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    email_request_id VARCHAR(255),
    error_message TEXT,
    test_mode BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_campaign_logs_profile_id ON public.campaign_logs(profile_id);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_campaign ON public.campaign_logs(campaign);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_sent_at ON public.campaign_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_status ON public.campaign_logs(status);

-- Create RLS policies
ALTER TABLE public.campaign_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role to access all records
CREATE POLICY "Service role can access campaign logs" ON public.campaign_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Function to create the table (for the campaign function)
CREATE OR REPLACE FUNCTION create_campaign_logs_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Table creation is handled by migration, this is just a no-op
    -- to satisfy the function call in the campaign code
    NULL;
END;
$$;

-- Grant necessary permissions
GRANT ALL ON public.campaign_logs TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;