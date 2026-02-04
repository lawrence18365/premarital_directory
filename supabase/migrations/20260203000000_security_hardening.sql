-- Security hardening: rate-limit logs + restrict sensitive columns from public roles

-- 1) Lightweight request log for edge-function rate limiting
CREATE TABLE IF NOT EXISTS public.edge_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_edge_request_logs_endpoint_ip_created
  ON public.edge_request_logs (endpoint, ip_address, created_at DESC);

ALTER TABLE public.edge_request_logs ENABLE ROW LEVEL SECURITY;
-- No policies: only service role (bypassrls) can read/write.

-- 2) Restrict sensitive columns from anon/authenticated roles
-- NOTE: Keep public-facing profile fields accessible.

-- Always hide claim tokens from any client role
REVOKE SELECT (claim_token, claim_token_expires_at)
  ON public.profiles FROM anon, authenticated;

-- Hide internal-only fields from anonymous users
REVOKE SELECT (
  user_id,
  spam_score,
  hidden_reason,
  hidden_at,
  outreach_sent_at,
  outreach_opened_at,
  outreach_clicked_at,
  subscription_plan_id,
  last_login
) ON public.profiles FROM anon;
