-- Outreach tracking for automated email campaigns
-- Tracks which emails were sent to which unclaimed profiles

CREATE TABLE IF NOT EXISTS outreach_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    email_type TEXT NOT NULL CHECK (email_type IN ('initial', 'followup1', 'followup2', 'final')),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    success BOOLEAN DEFAULT true,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT
);

-- Add outreach tracking columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS outreach_sent_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS outreach_opened_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS outreach_clicked_at TIMESTAMP WITH TIME ZONE;

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_outreach_log_profile ON outreach_log(profile_id);
CREATE INDEX IF NOT EXISTS idx_outreach_log_type ON outreach_log(email_type);
CREATE INDEX IF NOT EXISTS idx_outreach_log_sent ON outreach_log(sent_at);
CREATE INDEX IF NOT EXISTS idx_profiles_outreach_sent ON profiles(outreach_sent_at);

-- RLS policies
ALTER TABLE outreach_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view outreach logs
CREATE POLICY "Admins can view outreach logs" ON outreach_log
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true)
    );

-- Service role can insert (for automation scripts)
CREATE POLICY "Service can insert outreach logs" ON outreach_log
    FOR INSERT WITH CHECK (true);

-- View for outreach statistics
CREATE OR REPLACE VIEW outreach_stats AS
SELECT
    email_type,
    COUNT(*) as total_sent,
    COUNT(*) FILTER (WHERE success = true) as successful,
    COUNT(*) FILTER (WHERE opened_at IS NOT NULL) as opened,
    COUNT(*) FILTER (WHERE clicked_at IS NOT NULL) as clicked
FROM outreach_log
GROUP BY email_type;

-- Function to get conversion rate
CREATE OR REPLACE FUNCTION get_outreach_conversion_rate()
RETURNS TABLE (
    emails_sent BIGINT,
    profiles_claimed BIGINT,
    conversion_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(DISTINCT ol.profile_id)::BIGINT as emails_sent,
        COUNT(DISTINCT p.id) FILTER (WHERE p.is_claimed = true)::BIGINT as profiles_claimed,
        CASE
            WHEN COUNT(DISTINCT ol.profile_id) > 0
            THEN ROUND(
                (COUNT(DISTINCT p.id) FILTER (WHERE p.is_claimed = true)::NUMERIC /
                 COUNT(DISTINCT ol.profile_id)::NUMERIC) * 100, 2
            )
            ELSE 0
        END as conversion_rate
    FROM outreach_log ol
    JOIN profiles p ON ol.profile_id = p.id
    WHERE ol.email_type = 'initial';
END;
$$ LANGUAGE plpgsql;
