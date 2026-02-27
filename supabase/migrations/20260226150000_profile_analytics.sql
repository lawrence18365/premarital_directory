-- Per-counselor GA4 analytics for professional dashboard
CREATE TABLE IF NOT EXISTS profile_analytics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  pageviews integer DEFAULT 0,
  unique_visitors integer DEFAULT 0,
  avg_session_duration numeric(6,1) DEFAULT 0,
  top_sources jsonb DEFAULT '[]'::jsonb,
  top_search_terms jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(profile_id, period_start, period_end)
);

-- RLS: counselors can read their own analytics
ALTER TABLE profile_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Counselors can view own analytics"
  ON profile_analytics FOR SELECT
  USING (profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

-- Index for dashboard queries
CREATE INDEX idx_profile_analytics_profile_period
  ON profile_analytics(profile_id, period_start DESC);

-- Service role can insert/update (from edge function or GH Actions)
CREATE POLICY "Service role full access"
  ON profile_analytics FOR ALL
  USING (auth.role() = 'service_role');
