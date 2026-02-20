-- Fix: jsonb_array_length() throws on NULL (when key doesn't exist in JSONB).
-- Use jsonb_typeof() guard before calling jsonb_array_length().
-- Affected line: certificate_fields->'required_fields' may be NULL.

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
  IF jsonb_typeof(rec.official_sources) = 'array'
     AND jsonb_array_length(rec.official_sources) > 0
     AND (rec.official_sources->0->>'url') IS NOT NULL
     AND (rec.official_sources->0->>'excerpt') IS NOT NULL
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
  IF jsonb_typeof(rec.approved_provider_rules->'accepted_types') = 'array'
     AND jsonb_array_length(rec.approved_provider_rules->'accepted_types') > 0
  THEN
    score := score + 10;
  END IF;

  -- 10 pts: certificate_fields has required_fields (key may be absent — guard with jsonb_typeof)
  IF jsonb_typeof(rec.certificate_fields->'required_fields') = 'array'
     AND jsonb_array_length(rec.certificate_fields->'required_fields') > 0
  THEN
    score := score + 10;
  END IF;

  -- 10 pts: submission_process.where present
  IF (rec.submission_process->>'where') IS NOT NULL
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
