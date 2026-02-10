-- Hardening patch for program inventory permissions + lead insert policy.
-- Safe to run after initial program inventory migration.

-- Ensure RLS is active on all program inventory tables.
ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_leads ENABLE ROW LEVEL SECURITY;

-- Lock base tables for anon/authenticated; public reads go through safe views.
REVOKE ALL ON TABLE public.churches FROM anon, authenticated;
REVOKE ALL ON TABLE public.programs FROM anon, authenticated;
REVOKE ALL ON TABLE public.program_claims FROM anon, authenticated;
REVOKE ALL ON TABLE public.program_leads FROM anon, authenticated;

-- Couple submissions are insert-only.
GRANT INSERT ON TABLE public.program_leads TO anon, authenticated;

-- Validate program_id without requiring anon SELECT on public.programs.
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

DROP POLICY IF EXISTS "Anyone can submit leads to published opted-in programs" ON public.program_leads;
CREATE POLICY "Anyone can submit leads to published opted-in programs"
  ON public.program_leads
  FOR INSERT
  WITH CHECK (public.is_program_open_for_leads(program_id));

-- Rebuild safe public views to guarantee no email leakage.
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
