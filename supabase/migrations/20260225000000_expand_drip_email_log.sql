-- Expand drip_email_log to support engagement milestones and badge campaigns
-- The original CHECK constraint only allowed 'welcome' and 'claim_welcome'

ALTER TABLE drip_email_log DROP CONSTRAINT IF EXISTS drip_email_log_drip_type_check;

ALTER TABLE drip_email_log
  ADD CONSTRAINT drip_email_log_drip_type_check
  CHECK (drip_type IN ('welcome', 'claim_welcome', 'engagement', 'badge_campaign'));

-- Change step column from INTEGER to TEXT to support named steps
-- (e.g., 'backlink_ask', '5_views', '15_views', 'first_lead')
ALTER TABLE drip_email_log ALTER COLUMN step TYPE TEXT USING step::text;
