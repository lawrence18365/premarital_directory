-- Add city and state tracking to contact_reveals for geographic analytics
ALTER TABLE contact_reveals
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state_province TEXT,
ADD COLUMN IF NOT EXISTS page_url TEXT,
ADD COLUMN IF NOT EXISTS referrer TEXT;

-- Add index for city-based analytics queries
CREATE INDEX IF NOT EXISTS idx_contact_reveals_city ON contact_reveals(city);
CREATE INDEX IF NOT EXISTS idx_contact_reveals_state ON contact_reveals(state_province);
CREATE INDEX IF NOT EXISTS idx_contact_reveals_city_date ON contact_reveals(city, revealed_at);

-- Add comments
COMMENT ON COLUMN contact_reveals.city IS 'City where the profile was viewed when contact was revealed';
COMMENT ON COLUMN contact_reveals.state_province IS 'State/province of the profile viewed';
COMMENT ON COLUMN contact_reveals.page_url IS 'Full URL of the page where reveal occurred';
COMMENT ON COLUMN contact_reveals.referrer IS 'Referrer URL that led to the page';

-- Create a view for city-level analytics
CREATE OR REPLACE VIEW contact_reveals_by_city AS
SELECT
    city,
    state_province,
    COUNT(*) as total_reveals,
    COUNT(DISTINCT DATE(revealed_at)) as days_with_reveals,
    COUNT(CASE WHEN revealed_at >= NOW() - INTERVAL '7 days' THEN 1 END) as reveals_7d,
    COUNT(CASE WHEN revealed_at >= NOW() - INTERVAL '30 days' THEN 1 END) as reveals_30d,
    MAX(revealed_at) as last_reveal_at
FROM contact_reveals
WHERE city IS NOT NULL
GROUP BY city, state_province
ORDER BY total_reveals DESC;

-- Allow authenticated users to see the analytics view
GRANT SELECT ON contact_reveals_by_city TO authenticated;
