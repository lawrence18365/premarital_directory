-- Badge submissions table
CREATE TABLE badge_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  profile_url TEXT NOT NULL,
  source_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  checked_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add badge_verified to profiles (separate from existing is_verified which tracks PT scrape verification)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS badge_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS badge_verified_at TIMESTAMPTZ;

-- RLS
ALTER TABLE badge_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Providers see own submissions" ON badge_submissions FOR SELECT USING (provider_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Providers insert own submissions" ON badge_submissions FOR INSERT WITH CHECK (provider_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Admins full access" ON badge_submissions FOR ALL USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true));

-- Indexes
CREATE INDEX idx_badge_submissions_status ON badge_submissions(status) WHERE status = 'pending';
CREATE INDEX idx_badge_submissions_provider ON badge_submissions(provider_id);
CREATE INDEX idx_profiles_badge_verified ON profiles(badge_verified) WHERE badge_verified = true;
