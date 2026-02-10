-- Program inventory model for Catholic Pre-Cana pages
-- Keeps professionals in `profiles` and introduces church/program entities.

-- 1) Churches (organization identity)
CREATE TABLE IF NOT EXISTS public.churches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name TEXT NOT NULL,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state_province TEXT NOT NULL,
  postal_code TEXT,
  website TEXT,
  office_email TEXT,
  office_phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  source TEXT NOT NULL DEFAULT 'manual'
);

CREATE INDEX IF NOT EXISTS idx_churches_city_state ON public.churches(city, state_province);
CREATE INDEX IF NOT EXISTS idx_churches_name ON public.churches(name);

-- 2) Programs (Pre-Cana offering)
CREATE TABLE IF NOT EXISTS public.programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tradition TEXT NOT NULL,
  program_type TEXT NOT NULL,
  format TEXT,
  cost TEXT,
  session_count INTEGER,
  timeline TEXT,
  registration_url TEXT,
  languages TEXT[] DEFAULT '{}',
  requirements_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  next_start_date DATE,
  summary TEXT,
  verification_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (verification_status IN ('draft', 'pending', 'pending_manual_review', 'verified', 'rejected')),
  is_published BOOLEAN NOT NULL DEFAULT false,
  allow_lead_form BOOLEAN NOT NULL DEFAULT false,
  lead_email TEXT,
  verified_at TIMESTAMPTZ,
  verified_by_user_id UUID REFERENCES auth.users(id),
  verification_notes TEXT,
  claimed_by_user_id UUID REFERENCES auth.users(id),
  CONSTRAINT programs_published_requires_verification
    CHECK (NOT is_published OR verification_status = 'verified')
);

CREATE INDEX IF NOT EXISTS idx_programs_tradition_publish
  ON public.programs(tradition, is_published, verification_status);
CREATE INDEX IF NOT EXISTS idx_programs_church_id ON public.programs(church_id);
CREATE INDEX IF NOT EXISTS idx_programs_next_start ON public.programs(next_start_date);

-- 3) Program claims (domain-based verification flow)
CREATE TABLE IF NOT EXISTS public.program_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  office_email TEXT NOT NULL,
  submitted_by_email TEXT,
  submitted_by_domain TEXT,
  claim_token UUID NOT NULL DEFAULT gen_random_uuid(),
  token_expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'verified', 'pending_manual_review', 'rejected', 'expired')),
  verified_at TIMESTAMPTZ,
  verified_by_user_id UUID REFERENCES auth.users(id),
  notes TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_program_claims_token ON public.program_claims(claim_token);
CREATE INDEX IF NOT EXISTS idx_program_claims_program_status
  ON public.program_claims(program_id, status, token_expires_at DESC);

-- 4) Program leads (only when a program opts in)
CREATE TABLE IF NOT EXISTS public.program_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  couple_name TEXT,
  couple_email TEXT NOT NULL,
  couple_phone TEXT,
  wedding_date DATE,
  timeline TEXT,
  location TEXT,
  message TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'program_page',
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'scheduled', 'closed')),
  program_notified BOOLEAN NOT NULL DEFAULT false,
  notified_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_program_leads_program_created
  ON public.program_leads(program_id, created_at DESC);

-- Keep updated_at fresh on writes
CREATE OR REPLACE FUNCTION public.touch_program_inventory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS churches_touch_updated_at ON public.churches;
CREATE TRIGGER churches_touch_updated_at
  BEFORE UPDATE ON public.churches
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_program_inventory_updated_at();

DROP TRIGGER IF EXISTS programs_touch_updated_at ON public.programs;
CREATE TRIGGER programs_touch_updated_at
  BEFORE UPDATE ON public.programs
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_program_inventory_updated_at();

-- RLS
ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_leads ENABLE ROW LEVEL SECURITY;

-- Explicit privilege baseline:
-- - Base tables are not readable/writable by anon users.
-- - Program management is handled by service-role edge functions.
-- - Couple submissions are insert-only on program_leads.
REVOKE ALL ON TABLE public.churches FROM anon, authenticated;
REVOKE ALL ON TABLE public.programs FROM anon, authenticated;
REVOKE ALL ON TABLE public.program_claims FROM anon, authenticated;
REVOKE ALL ON TABLE public.program_leads FROM anon, authenticated;
GRANT INSERT ON TABLE public.program_leads TO anon, authenticated;

-- SECURITY DEFINER guard prevents anon INSERT checks from requiring direct
-- SELECT privileges on public.programs while still validating publish state.
CREATE OR REPLACE FUNCTION public.is_program_open_for_leads(target_program_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.programs p
    WHERE p.id = target_program_id
      AND p.is_published = true
      AND p.verification_status = 'verified'
      AND p.allow_lead_form = true
  );
$$;

REVOKE ALL ON FUNCTION public.is_program_open_for_leads(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_program_open_for_leads(UUID) TO anon, authenticated;

-- Public can submit program leads only when program is published and opted into lead forms
DROP POLICY IF EXISTS "Anyone can submit leads to published opted-in programs" ON public.program_leads;
CREATE POLICY "Anyone can submit leads to published opted-in programs"
  ON public.program_leads
  FOR INSERT
  WITH CHECK (public.is_program_open_for_leads(program_id));

-- Admin management policies
DROP POLICY IF EXISTS "Admins can manage churches" ON public.churches;
CREATE POLICY "Admins can manage churches"
  ON public.churches
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.id = auth.uid() AND au.is_active = true
    )
  );

DROP POLICY IF EXISTS "Admins can manage programs" ON public.programs;
CREATE POLICY "Admins can manage programs"
  ON public.programs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.id = auth.uid() AND au.is_active = true
    )
  );

DROP POLICY IF EXISTS "Admins can manage program claims" ON public.program_claims;
CREATE POLICY "Admins can manage program claims"
  ON public.program_claims
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.id = auth.uid() AND au.is_active = true
    )
  );

DROP POLICY IF EXISTS "Admins can manage program leads" ON public.program_leads;
CREATE POLICY "Admins can manage program leads"
  ON public.program_leads
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.id = auth.uid() AND au.is_active = true
    )
  );

-- Public views expose only safe columns (no office_email / lead_email).
CREATE OR REPLACE VIEW public.churches_public AS
SELECT
  c.id,
  c.name,
  c.address_line1,
  c.address_line2,
  c.city,
  c.state_province,
  c.postal_code,
  c.website,
  c.office_phone
FROM public.churches c
WHERE c.is_active = true;

CREATE OR REPLACE VIEW public.programs_public AS
SELECT
  p.id,
  p.church_id,
  p.name AS program_name,
  p.tradition,
  p.program_type,
  p.format,
  p.cost,
  p.session_count,
  p.timeline,
  p.registration_url,
  p.languages,
  p.requirements_json,
  p.next_start_date,
  p.summary,
  p.allow_lead_form
FROM public.programs p
WHERE p.is_published = true
  AND p.verification_status = 'verified';

-- Public directory view: flattened program + church fields for fast frontend queries
CREATE OR REPLACE VIEW public.program_directory_public AS
SELECT
  p.id,
  p.church_id,
  p.program_name,
  p.tradition,
  p.program_type,
  p.format,
  p.cost,
  p.session_count,
  p.timeline,
  p.registration_url,
  p.languages,
  p.requirements_json,
  p.next_start_date,
  p.summary,
  p.allow_lead_form,
  c.name AS church_name,
  c.address_line1,
  c.address_line2,
  c.city,
  c.state_province,
  c.postal_code,
  c.website,
  c.office_phone
FROM public.programs_public p
JOIN public.churches_public c ON c.id = p.church_id;

GRANT SELECT ON public.churches_public TO anon, authenticated;
GRANT SELECT ON public.programs_public TO anon, authenticated;
GRANT SELECT ON public.program_directory_public TO anon, authenticated;
