-- Fix compute_jb_readiness_score: has_cert_fields now counts any extracted cert data.
-- Uses the correct UUID signature (called by trigger as compute_jb_readiness_score(NEW.id)).
-- Mirrors the updated JS computeReadinessScore() in jurisdictionBenefitsSchema.js.

CREATE OR REPLACE FUNCTION public.compute_jb_readiness_score(row_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec   public.jurisdiction_benefits%ROWTYPE;
  score INTEGER := 0;
BEGIN
  SELECT * INTO rec FROM public.jurisdiction_benefits WHERE id = row_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  -- 20 pts: at least one source with url and excerpt
  IF jsonb_array_length(rec.official_sources) > 0
     AND (rec.official_sources->0->>'url') IS NOT NULL
     AND (rec.official_sources->0->>'excerpt') IS NOT NULL
     AND (rec.official_sources->0->>'excerpt') != ''
  THEN
    score := score + 20;
  END IF;

  -- 15 pts: statute_citation
  IF rec.statute_citation IS NOT NULL AND rec.statute_citation != '' THEN
    score := score + 15;
  END IF;

  -- 15 pts: hours_required or program not required
  IF rec.hours_required IS NOT NULL OR rec.premarital_program_required = false THEN
    score := score + 15;
  END IF;

  -- 15 pts: accepted_formats non-empty
  IF array_length(rec.accepted_formats, 1) > 0 THEN
    score := score + 15;
  END IF;

  -- 10 pts: approved_provider_rules has accepted_types
  IF rec.approved_provider_rules IS NOT NULL
     AND (rec.approved_provider_rules->'accepted_types') IS NOT NULL
     AND jsonb_array_length(rec.approved_provider_rules->'accepted_types') > 0
  THEN
    score := score + 10;
  END IF;

  -- 10 pts: certificate_fields — any extracted cert data counts
  IF rec.certificate_fields IS NOT NULL AND (
    (rec.certificate_fields->>'state_issued_form') IS NOT NULL OR
    (rec.certificate_fields->>'validity_days') IS NOT NULL OR
    (
      (rec.certificate_fields->'required_fields') IS NOT NULL AND
      jsonb_array_length(rec.certificate_fields->'required_fields') > 0
    )
  ) THEN
    score := score + 10;
  END IF;

  -- 10 pts: submission_process.where present
  IF rec.submission_process IS NOT NULL
     AND (rec.submission_process->>'where') IS NOT NULL
     AND (rec.submission_process->>'where') != ''
  THEN
    score := score + 10;
  END IF;

  -- 5 pts: last_verified_at within 90 days
  IF rec.last_verified_at IS NOT NULL
     AND rec.last_verified_at > now() - INTERVAL '90 days'
  THEN
    score := score + 5;
  END IF;

  RETURN LEAST(score, 100);
END;
$$;

-- Drop the incorrectly-signatured overload created by the previous migration
DROP FUNCTION IF EXISTS public.compute_jb_readiness_score(jurisdiction_benefits);

-- Re-score Florida now
UPDATE public.jurisdiction_benefits
SET fee_varies_by_county = fee_varies_by_county
WHERE jurisdiction_id = 'florida';
