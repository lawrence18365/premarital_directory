-- Track follow-up email sends on profile_leads for the automated reminder system
-- Provider gets a nudge at 48 hours, couple gets reassurance at 72 hours

ALTER TABLE profile_leads
ADD COLUMN IF NOT EXISTS provider_followup_sent_at TIMESTAMPTZ;

ALTER TABLE profile_leads
ADD COLUMN IF NOT EXISTS couple_followup_sent_at TIMESTAMPTZ;

-- Index for finding leads that need follow-up (status='new', delivered, no followup yet)
CREATE INDEX IF NOT EXISTS idx_leads_followup_pending
ON profile_leads (created_at)
WHERE status = 'new'
  AND delivery_status = 'delivered'
  AND provider_followup_sent_at IS NULL;

COMMENT ON COLUMN profile_leads.provider_followup_sent_at IS '48-hour reminder sent to provider about unanswered inquiry';
COMMENT ON COLUMN profile_leads.couple_followup_sent_at IS '72-hour reassurance email sent to couple when provider has not responded';

-- "Responds quickly" flag on profiles — computed daily by send-lead-followup
-- True when provider has 75%+ response rate in last 30 days with 3+ eligible leads
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS responds_quickly BOOLEAN DEFAULT false;

COMMENT ON COLUMN profiles.responds_quickly IS 'Computed daily: true if 75%+ response rate in last 30 days with 3+ leads';
