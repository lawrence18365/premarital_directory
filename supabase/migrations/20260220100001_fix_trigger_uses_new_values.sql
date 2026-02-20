-- Fix: trigger was calling compute_jb_readiness_score(NEW.id) which re-queries
-- the table and reads OLD values during a BEFORE UPDATE trigger. Inline the
-- score computation using NEW.* so it always reflects the values being written.

CREATE OR REPLACE FUNCTION public.auto_score_jurisdiction_benefit()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  score INTEGER := 0;
BEGIN
  -- 20 pts: at least one source with url and excerpt
  IF jsonb_typeof(NEW.official_sources) = 'array'
     AND jsonb_array_length(NEW.official_sources) > 0
     AND (NEW.official_sources->0->>'url') IS NOT NULL
     AND (NEW.official_sources->0->>'excerpt') IS NOT NULL
  THEN
    score := score + 20;
  END IF;

  -- 15 pts: statute_citation
  IF NEW.statute_citation IS NOT NULL AND NEW.statute_citation != '' THEN
    score := score + 15;
  END IF;

  -- 15 pts: hours_required or program not required
  IF NEW.hours_required IS NOT NULL OR NEW.premarital_program_required = false THEN
    score := score + 15;
  END IF;

  -- 15 pts: accepted_formats non-empty
  IF array_length(NEW.accepted_formats, 1) > 0 THEN
    score := score + 15;
  END IF;

  -- 10 pts: approved_provider_rules has accepted_types
  IF jsonb_typeof(NEW.approved_provider_rules->'accepted_types') = 'array'
     AND jsonb_array_length(NEW.approved_provider_rules->'accepted_types') > 0
  THEN
    score := score + 10;
  END IF;

  -- 10 pts: certificate_fields has required_fields
  IF jsonb_typeof(NEW.certificate_fields->'required_fields') = 'array'
     AND jsonb_array_length(NEW.certificate_fields->'required_fields') > 0
  THEN
    score := score + 10;
  END IF;

  -- 10 pts: submission_process.where present
  IF (NEW.submission_process->>'where') IS NOT NULL
     AND (NEW.submission_process->>'where') != ''
  THEN
    score := score + 10;
  END IF;

  -- 5 pts: last_verified_at within 90 days
  IF NEW.last_verified_at IS NOT NULL
     AND NEW.last_verified_at > now() - INTERVAL '90 days'
  THEN
    score := score + 5;
  END IF;

  NEW.page_readiness_score := LEAST(score, 100);

  NEW.is_indexed := (
    NEW.page_readiness_score >= 70
    AND NEW.verification_status = 'verified'
    AND NEW.last_verified_at IS NOT NULL
  );

  IF NOT NEW.is_indexed AND NEW.page_readiness_score < 70 THEN
    NEW.noindex_reason := 'low_readiness_score:' || NEW.page_readiness_score::text;
  ELSIF NOT NEW.is_indexed AND NEW.verification_status != 'verified' THEN
    NEW.noindex_reason := 'unverified:' || NEW.verification_status;
  ELSIF NOT NEW.is_indexed AND NEW.last_verified_at IS NULL THEN
    NEW.noindex_reason := 'never_verified';
  ELSE
    NEW.noindex_reason := NULL;
  END IF;

  RETURN NEW;
END;
$$;
