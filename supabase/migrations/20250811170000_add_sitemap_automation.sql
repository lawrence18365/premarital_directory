-- =====================================================
-- Add Sitemap Automation Fields
-- =====================================================

-- Add indexing control columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ready_for_indexing BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS queued_for_sitemap BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sitemap_queue_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_indexed TIMESTAMP WITH TIME ZONE;

-- Create settings table for rollout phase tracking
CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial rollout phase
INSERT INTO settings (key, value, description) VALUES 
('rollout_phase', '1', 'Current SEO rollout phase (1=core, 2=states, 3=cities, 4=profiles)')
ON CONFLICT (key) DO NOTHING;

-- Create sitemap submissions tracking
CREATE TABLE IF NOT EXISTS sitemap_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  type VARCHAR(50) NOT NULL, -- 'automated_weekly', 'manual', 'phase_rollout'
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'success', 'failed', 'pending'
  profiles_count INTEGER DEFAULT 0,
  states_count INTEGER DEFAULT 0,
  cities_count INTEGER DEFAULT 0,
  notes TEXT
);

-- Function to auto-queue approved profiles for indexing
CREATE OR REPLACE FUNCTION auto_queue_for_indexing()
RETURNS TRIGGER AS $$
BEGIN
  -- If profile status changes to 'approved', queue for indexing
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    NEW.ready_for_indexing = TRUE;
    NEW.queued_for_sitemap = TRUE;
    NEW.sitemap_queue_date = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic queuing
DROP TRIGGER IF EXISTS trigger_auto_queue_indexing ON profiles;
CREATE TRIGGER trigger_auto_queue_indexing
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_queue_for_indexing();

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_ready_for_indexing ON profiles(ready_for_indexing) WHERE ready_for_indexing = TRUE;
CREATE INDEX IF NOT EXISTS idx_profiles_queued_sitemap ON profiles(queued_for_sitemap, sitemap_queue_date) WHERE queued_for_sitemap = TRUE;

-- RLS policies
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sitemap_submissions ENABLE ROW LEVEL SECURITY;

-- Allow read access to settings
CREATE POLICY "Allow public read on settings" ON settings FOR SELECT USING (true);

-- Allow service role full access
CREATE POLICY "Allow service role all on settings" ON settings FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Allow service role all on sitemap_submissions" ON sitemap_submissions FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

COMMENT ON TABLE settings IS 'Application configuration settings';
COMMENT ON TABLE sitemap_submissions IS 'Track sitemap submissions to search engines';
COMMENT ON COLUMN profiles.ready_for_indexing IS 'Profile approved and ready for search indexing';
COMMENT ON COLUMN profiles.queued_for_sitemap IS 'Profile queued for next sitemap generation';