-- Program Leads RLS smoke test (anon role)
-- Run in Supabase SQL Editor after applying:
--   - 20260210000000_add_program_inventory.sql
--   - 20260210001000_harden_program_rls_and_lead_policy.sql
--
-- This script verifies:
-- 1) `public.is_program_open_for_leads(uuid)` owner can SELECT from public.programs
-- 2) INSERT policy uses public.is_program_open_for_leads(program_id)
-- 3) anon INSERT succeeds for an open (published+verified+lead-enabled) program
-- 4) anon INSERT is blocked for a closed program
--
-- It runs in a transaction and ROLLBACKs at the end (no persistent test data).

BEGIN;

-- 0) Assert function owner can read public.programs
DO $$
DECLARE
  fn_owner text;
  owner_can_select boolean;
BEGIN
  SELECT pg_get_userbyid(p.proowner)
  INTO fn_owner
  FROM pg_proc p
  WHERE p.oid = 'public.is_program_open_for_leads(uuid)'::regprocedure;

  IF fn_owner IS NULL THEN
    RAISE EXCEPTION 'Function public.is_program_open_for_leads(uuid) not found';
  END IF;

  SELECT has_table_privilege(fn_owner, 'public.programs', 'SELECT')
  INTO owner_can_select;

  IF owner_can_select IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Function owner (%) cannot SELECT public.programs', fn_owner;
  END IF;

  RAISE NOTICE 'PASS: function owner is "%" and has SELECT on public.programs', fn_owner;
END $$;

-- 1) Assert INSERT policy is wired to the guard function
DO $$
DECLARE
  with_check_expr text;
BEGIN
  SELECT with_check
  INTO with_check_expr
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'program_leads'
    AND policyname = 'Anyone can submit leads to published opted-in programs';

  IF with_check_expr IS NULL THEN
    RAISE EXCEPTION 'Expected INSERT policy not found on public.program_leads';
  END IF;

  IF with_check_expr NOT ILIKE '%is_program_open_for_leads%' THEN
    RAISE EXCEPTION 'Policy WITH CHECK is not using is_program_open_for_leads: %', with_check_expr;
  END IF;

  RAISE NOTICE 'PASS: lead INSERT policy WITH CHECK uses is_program_open_for_leads(program_id)';
END $$;

-- 2) Fixture data (as privileged role)
RESET ROLE;

INSERT INTO public.churches (
  id,
  name,
  city,
  state_province,
  is_active,
  source
)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'RLS Smoke Test Parish',
  'Test City',
  'CA',
  true,
  'policy-smoke'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  city = EXCLUDED.city,
  state_province = EXCLUDED.state_province,
  is_active = EXCLUDED.is_active,
  source = EXCLUDED.source;

-- Open program: should allow anon lead inserts
INSERT INTO public.programs (
  id,
  church_id,
  name,
  tradition,
  program_type,
  verification_status,
  is_published,
  allow_lead_form
)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'RLS Open Program',
  'Catholic',
  'Pre-Cana',
  'verified',
  true,
  true
)
ON CONFLICT (id) DO UPDATE SET
  verification_status = EXCLUDED.verification_status,
  is_published = EXCLUDED.is_published,
  allow_lead_form = EXCLUDED.allow_lead_form;

-- Closed program: should block anon lead inserts
INSERT INTO public.programs (
  id,
  church_id,
  name,
  tradition,
  program_type,
  verification_status,
  is_published,
  allow_lead_form
)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'RLS Closed Program',
  'Catholic',
  'Pre-Cana',
  'verified',
  true,
  false
)
ON CONFLICT (id) DO UPDATE SET
  verification_status = EXCLUDED.verification_status,
  is_published = EXCLUDED.is_published,
  allow_lead_form = EXCLUDED.allow_lead_form;

-- Sanity-check function output directly
SELECT
  public.is_program_open_for_leads('22222222-2222-2222-2222-222222222222'::uuid) AS open_program_allows_leads,
  public.is_program_open_for_leads('33333333-3333-3333-3333-333333333333'::uuid) AS closed_program_allows_leads;

-- 3) Positive test: anon insert on open program should succeed
SET LOCAL ROLE anon;
INSERT INTO public.program_leads (
  id,
  program_id,
  couple_name,
  couple_email,
  message,
  source
)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  '22222222-2222-2222-2222-222222222222',
  'RLS Smoke Couple',
  'open-test@example.com',
  'Open program insert should succeed',
  'policy-smoke'
);
RESET ROLE;

SELECT
  CASE WHEN EXISTS (
    SELECT 1
    FROM public.program_leads
    WHERE id = '44444444-4444-4444-4444-444444444444'
  )
  THEN 'PASS: anon insert succeeded for open program'
  ELSE 'FAIL: open-program insert was not persisted in transaction'
  END AS open_insert_result;

-- 4) Negative test: anon insert on closed program should fail (captured)
SET LOCAL ROLE anon;
DO $$
BEGIN
  BEGIN
    INSERT INTO public.program_leads (
      id,
      program_id,
      couple_name,
      couple_email,
      message,
      source
    )
    VALUES (
      '55555555-5555-5555-5555-555555555555',
      '33333333-3333-3333-3333-333333333333',
      'RLS Smoke Couple',
      'closed-test@example.com',
      'Closed program insert should be blocked',
      'policy-smoke'
    );

    RAISE EXCEPTION 'FAIL: closed-program insert unexpectedly succeeded';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM ILIKE '%row-level security%'
         OR SQLERRM ILIKE '%violates row-level security%'
         OR SQLERRM ILIKE '%permission denied%' THEN
        RAISE NOTICE 'PASS: closed-program insert blocked as expected (%).', SQLERRM;
      ELSE
        RAISE EXCEPTION 'Unexpected error during closed-program test: %', SQLERRM;
      END IF;
  END;
END $$;
RESET ROLE;

ROLLBACK;
