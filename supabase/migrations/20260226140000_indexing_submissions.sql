-- Track Google Indexing API submissions for dedup and quota management
CREATE TABLE IF NOT EXISTS indexing_submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  url text NOT NULL,
  status_code integer,
  response text,
  submitted_at timestamptz DEFAULT now(),
  source text DEFAULT 'manual'  -- 'manual', 'cron-new-profiles', 'cron-sitemap', 'cron-priority'
);

-- Dedup index: prevent re-submitting the same URL within 48 hours
CREATE INDEX idx_indexing_submissions_url_time
  ON indexing_submissions(url, submitted_at DESC);

-- Quota tracking: count submissions per day
CREATE INDEX idx_indexing_submissions_daily
  ON indexing_submissions(submitted_at);

-- No RLS needed — this table is only accessed by service role from scripts
