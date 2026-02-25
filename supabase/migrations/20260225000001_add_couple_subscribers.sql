-- Couple email subscribers for remarketing + guide delivery
CREATE TABLE IF NOT EXISTS couple_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  first_name TEXT,
  source_page TEXT, -- which page they signed up from
  created_at TIMESTAMPTZ DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ,
  UNIQUE(email)
);

CREATE INDEX IF NOT EXISTS idx_couple_subscribers_email
  ON couple_subscribers(email);
