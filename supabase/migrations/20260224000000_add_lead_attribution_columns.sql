-- Add attribution columns to profile_leads for couple-side tracking
-- These columns capture WHERE the couple came from when they submitted a lead

ALTER TABLE profile_leads ADD COLUMN IF NOT EXISTS source_page TEXT;
ALTER TABLE profile_leads ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE profile_leads ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE profile_leads ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
ALTER TABLE profile_leads ADD COLUMN IF NOT EXISTS partner_ref TEXT;
ALTER TABLE profile_leads ADD COLUMN IF NOT EXISTS referrer TEXT;

-- Add partner_ref to profile_clicks for church widget tracking
ALTER TABLE profile_clicks ADD COLUMN IF NOT EXISTS partner_ref TEXT;
ALTER TABLE profile_clicks ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE profile_clicks ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE profile_clicks ADD COLUMN IF NOT EXISTS utm_campaign TEXT;

-- Index for attribution queries
CREATE INDEX IF NOT EXISTS idx_leads_utm_source ON profile_leads (utm_source);
CREATE INDEX IF NOT EXISTS idx_leads_partner_ref ON profile_leads (partner_ref);
CREATE INDEX IF NOT EXISTS idx_leads_source_page ON profile_leads (source_page);
CREATE INDEX IF NOT EXISTS idx_clicks_partner_ref ON profile_clicks (partner_ref);
CREATE INDEX IF NOT EXISTS idx_clicks_utm_source ON profile_clicks (utm_source);

COMMENT ON COLUMN profile_leads.source_page IS 'URL path where lead was submitted (e.g. /premarital-counseling/ohio/columbus)';
COMMENT ON COLUMN profile_leads.partner_ref IS 'Church/partner ref ID from widget embed';
COMMENT ON COLUMN profile_leads.referrer IS 'HTTP referrer at time of session start';
