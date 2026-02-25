-- Add interest type and location to couple subscribers for personalized drip emails
ALTER TABLE couple_subscribers ADD COLUMN IF NOT EXISTS interest TEXT DEFAULT 'counseling';
  -- 'counseling', 'officiant', 'both'
ALTER TABLE couple_subscribers ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE couple_subscribers ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE couple_subscribers ADD COLUMN IF NOT EXISTS guide_sent_at TIMESTAMPTZ;
ALTER TABLE couple_subscribers ADD COLUMN IF NOT EXISTS drip_day3_sent_at TIMESTAMPTZ;
ALTER TABLE couple_subscribers ADD COLUMN IF NOT EXISTS drip_day7_sent_at TIMESTAMPTZ;
