-- Add an email delivery status column to track whether the Edge Function successfully notified the provider
ALTER TABLE profile_leads
ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'pending'
  CHECK (delivery_status IN ('pending', 'delivered', 'failed'));

-- Create an index to quickly find leads that need to be re-notified
CREATE INDEX IF NOT EXISTS idx_profile_leads_delivery_status ON profile_leads(delivery_status);

-- Add an error message column to store why a webhook or email failed
ALTER TABLE profile_leads
ADD COLUMN IF NOT EXISTS delivery_error TEXT;
