-- Officiant/provider outreach CRM table
-- Needed for officiant-outreach-v1 campaign
CREATE TABLE IF NOT EXISTS provider_outreach (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  website TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  outreach_status TEXT DEFAULT 'identified'
    CHECK (outreach_status IN ('identified', 'emailed', 'replied', 'claimed', 'bounced', 'unsubscribed')),
  profile_id UUID,
  claim_token UUID,
  emailed_at TIMESTAMPTZ,
  followed_up_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_contacted_at TIMESTAMPTZ,
  contact_count INTEGER DEFAULT 0,
  email_template_used TEXT
);

CREATE INDEX IF NOT EXISTS idx_outreach_status ON provider_outreach(outreach_status);
CREATE INDEX IF NOT EXISTS idx_outreach_city ON provider_outreach(city, state);
CREATE INDEX IF NOT EXISTS idx_outreach_email ON provider_outreach(email);
