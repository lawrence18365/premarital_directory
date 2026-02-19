-- Fix compute_jb_readiness_score: has_cert_fields now counts any extracted cert data,
-- not just rows with a non-empty required_fields array.
-- Mirrors the updated JS computeReadinessScore() in jurisdictionBenefitsSchema.js.

CREATE OR REPLACE FUNCTION compute_jb_readiness_score(rec jurisdiction_benefits)
RETURNS integer
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  score integer := 0;
  sources jsonb;
  first_source jsonb;
BEGIN
  sources := COALESCE(rec.official_sources, '[]'::jsonb);

  -- has_source_with_excerpt (20 pts)
  IF jsonb_array_length(sources) > 0 THEN
    first_source := sources->0;
    IF (first_source->>'url') IS NOT NULL
       AND (first_source->>'excerpt') IS NOT NULL
       AND (first_source->>'excerpt') <> ''
    THEN
      score := score + 20;
    END IF;
  END IF;

  -- has_statute_citation (15 pts)
  IF rec.statute_citation IS NOT NULL AND rec.statute_citation <> '' THEN
    score := score + 15;
  END IF;

  -- has_hours_or_no_program (15 pts)
  IF rec.hours_required IS NOT NULL OR rec.premarital_program_required = FALSE THEN
    score := score + 15;
  END IF;

  -- has_accepted_formats (15 pts)
  IF rec.accepted_formats IS NOT NULL
     AND jsonb_array_length(rec.accepted_formats::jsonb) > 0
  THEN
    score := score + 15;
  END IF;

  -- has_provider_types (10 pts)
  IF rec.approved_provider_rules IS NOT NULL
     AND (rec.approved_provider_rules->'accepted_types') IS NOT NULL
     AND jsonb_array_length(rec.approved_provider_rules->'accepted_types') > 0
  THEN
    score := score + 10;
  END IF;

  -- has_cert_fields (10 pts) — any cert data extracted counts
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

  -- has_submission_where (10 pts)
  IF rec.submission_process IS NOT NULL
     AND (rec.submission_process->>'where') IS NOT NULL
     AND (rec.submission_process->>'where') <> ''
  THEN
    score := score + 10;
  END IF;

  -- recently_verified (5 pts) — verified within 90 days
  IF rec.last_verified_at IS NOT NULL
     AND rec.last_verified_at > NOW() - INTERVAL '90 days'
  THEN
    score := score + 5;
  END IF;

  RETURN LEAST(score, 100);
END;
$$;

-- Re-score Florida (the only extracted row) by touching it
UPDATE jurisdiction_benefits
SET updated_at = NOW()
WHERE jurisdiction_id = 'florida';
