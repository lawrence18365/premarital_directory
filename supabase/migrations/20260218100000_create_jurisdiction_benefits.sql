-- ============================================================
-- Step 1: Jurisdiction Benefits Schema
-- Marriage License Discount / Premarital Education Benefits
--
-- Design principles:
--   - Fees stored as integer cents (no floats)
--   - JSONB for structured-but-flexible sub-objects
--   - Self-referential FK: county records point to state parent
--   - official_sources[] is the citation chain per field
--   - page_readiness_score is computed + stored (0-100)
--   - change_log is append-only JSONB array
-- ============================================================

-- --------------------------------------------------------
-- Main table
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.jurisdiction_benefits (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- ---- Jurisdiction identity ----
  jurisdiction_id           TEXT        NOT NULL UNIQUE,  -- slug: "florida", "florida-orange-county"
  jurisdiction_type         TEXT        NOT NULL
    CHECK (jurisdiction_type IN ('state', 'county', 'city')),
  jurisdiction_name         TEXT        NOT NULL,          -- "Florida", "Orange County, FL"
  state_abbr                TEXT        NOT NULL,          -- "FL" (always, even for counties)
  parent_jurisdiction_id    TEXT        REFERENCES public.jurisdiction_benefits(jurisdiction_id)
                                          ON DELETE SET NULL,  -- null for state rows

  -- ---- Benefit summary ----
  benefit_types             TEXT[]      NOT NULL DEFAULT '{}',
    -- values: 'discount', 'fee_waiver', 'waiting_period_reduction', 'waiting_period_waiver'
  license_fee_cents         INTEGER     CHECK (license_fee_cents >= 0),     -- standard fee in cents
  discounted_fee_cents      INTEGER     CHECK (discounted_fee_cents >= 0),  -- fee after benefit
  savings_amount_cents      INTEGER     GENERATED ALWAYS AS (
                              CASE WHEN license_fee_cents IS NOT NULL AND discounted_fee_cents IS NOT NULL
                                   THEN license_fee_cents - discounted_fee_cents
                              END
                            ) STORED,
  currency                  TEXT        NOT NULL DEFAULT 'USD',
  fee_varies_by_county      BOOLEAN     NOT NULL DEFAULT false,  -- true for GA; signals county rows exist
  fee_notes                 TEXT,       -- "Varies $56-$84 by county; discount also varies"

  -- ---- Waiting period ----
  standard_waiting_period_hours   INTEGER,   -- null = no statutory waiting period
  waiting_period_reduction_hours  INTEGER,   -- how many hours are waived (may equal standard)
  waiting_period_waived           BOOLEAN    NOT NULL DEFAULT false,  -- true if fully waived

  -- ---- Eligibility ----
  -- JSONB schema: { residency_required, age_minimum, both_parties_required, exceptions[], notes }
  eligibility_rules         JSONB       NOT NULL DEFAULT '{}'::jsonb,
  exclusions                TEXT[],     -- explicit exclusions: ["Non-residents ineligible"]

  -- ---- Premarital program requirements ----
  premarital_program_required     BOOLEAN     NOT NULL DEFAULT true,
  hours_required                  INTEGER     CHECK (hours_required > 0),   -- null if no minimum
  accepted_formats                TEXT[]      NOT NULL DEFAULT '{}',
    -- values: 'online', 'in_person', 'self_directed', 'video', 'workbook'
  accepted_formats_notes          TEXT,       -- "Online accepted if provider is FL-registered"

  -- ---- Provider rules ----
  -- JSONB schema: {
  --   accepted_types: ["lmft","lpc","lcsw","psychologist","clergy","certified_educator"],
  --   approved_list_only: bool,
  --   approved_list_url: str|null,
  --   state_registration_required: bool,
  --   notes: str
  -- }
  approved_provider_rules   JSONB       NOT NULL DEFAULT '{}'::jsonb,

  -- ---- Certificate / proof ----
  proof_required            BOOLEAN     NOT NULL DEFAULT true,
  -- JSONB schema: {
  --   required_fields: ["couple_names","completion_date","provider_name","provider_credentials","hours_completed"],
  --   provider_signature_required: bool,
  --   notarization_required: bool,
  --   state_issued_form: bool,
  --   official_form_url: str|null,
  --   validity_days: int|null    -- null = no stated expiration
  -- }
  certificate_fields        JSONB       NOT NULL DEFAULT '{}'::jsonb,

  -- ---- Submission process ----
  -- JSONB schema: {
  --   where: "County Clerk of Court",
  --   how: "In person at time of license application",
  --   deadline_window: "Certificate must be presented at application; cannot be submitted after",
  --   forms_required: ["State-issued Certificate of Completion"],
  --   online_submission_allowed: bool,
  --   notes: str
  -- }
  submission_process        JSONB       NOT NULL DEFAULT '{}'::jsonb,

  -- ---- Official sources (citation chain) ----
  -- JSONB array of source objects:
  -- [{
  --   url: str,
  --   source_type: "state_statute"|"county_clerk_site"|"official_form"|"state_agency"|"court_site"|"faq_page",
  --   title: str,
  --   retrieved_at: ISO8601,
  --   excerpt: str,          -- verbatim excerpt supporting the field value(s)
  --   content_hash: str,     -- sha256 of full page/doc at retrieval time
  --   fields_supported: ["hours_required","accepted_formats",...]
  -- }]
  official_sources          JSONB       NOT NULL DEFAULT '[]'::jsonb,
  statute_citation          TEXT,       -- "Fla. Stat. § 741.0305(2)"

  -- ---- QA / readiness ----
  last_verified_at          TIMESTAMPTZ,
  verification_status       TEXT        NOT NULL DEFAULT 'draft'
    CHECK (verification_status IN ('draft', 'needs_review', 'verified', 'stale', 'no_benefit')),
  verified_by               TEXT,       -- "human:jane@example.com" or "automated:v1"
  -- Completeness score 0-100; pages with score < 70 stay noindex
  page_readiness_score      INTEGER     NOT NULL DEFAULT 0
    CHECK (page_readiness_score BETWEEN 0 AND 100),
  -- Per-field confidence (extractor output):
  -- { "hours_required": 0.95, "accepted_formats": 0.72, ... }
  field_confidence          JSONB       NOT NULL DEFAULT '{}'::jsonb,
  -- Append-only audit trail:
  -- [{ changed_at, changed_by, field, old_value, new_value, source_url }]
  change_log                JSONB       NOT NULL DEFAULT '[]'::jsonb,

  -- ---- Content for page generation ----
  -- Pre-computed narrative fields (generated from structured data, human-editable)
  summary_text              TEXT,       -- 1-2 sentence human-readable summary for meta description
  fast_path_text            TEXT,       -- "Fastest route: complete 4-hr online course → present cert at clerk same day"
  faqs                      JSONB       NOT NULL DEFAULT '[]'::jsonb,
    -- [{ question: str, answer: str, jtbd: "qualify"|"savings"|"online"|"submission"|"fastest" }]

  -- ---- Indexing control ----
  is_indexed                BOOLEAN     NOT NULL DEFAULT false,  -- set true when score >= threshold + verified
  noindex_reason            TEXT        -- populated when is_indexed=false: "low_confidence", "unverified", etc.
);

-- --------------------------------------------------------
-- Indexes
-- --------------------------------------------------------

-- Primary lookup: all benefits for a state, filtered by readiness
CREATE INDEX IF NOT EXISTS idx_jb_state_type_status
  ON public.jurisdiction_benefits(state_abbr, jurisdiction_type, verification_status);

-- Hub page: find all state-level rows that are indexed
CREATE INDEX IF NOT EXISTS idx_jb_indexed_state
  ON public.jurisdiction_benefits(is_indexed, jurisdiction_type)
  WHERE jurisdiction_type = 'state';

-- County lookup by parent
CREATE INDEX IF NOT EXISTS idx_jb_parent
  ON public.jurisdiction_benefits(parent_jurisdiction_id)
  WHERE parent_jurisdiction_id IS NOT NULL;

-- Readiness gate (find rows needing review)
CREATE INDEX IF NOT EXISTS idx_jb_readiness
  ON public.jurisdiction_benefits(page_readiness_score, verification_status)
  WHERE verification_status != 'verified';

-- Staleness detection (for recrawl scheduler)
CREATE INDEX IF NOT EXISTS idx_jb_last_verified
  ON public.jurisdiction_benefits(last_verified_at)
  WHERE verification_status = 'verified';

-- --------------------------------------------------------
-- updated_at trigger
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_jurisdiction_benefits_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS jb_touch_updated_at ON public.jurisdiction_benefits;
CREATE TRIGGER jb_touch_updated_at
  BEFORE UPDATE ON public.jurisdiction_benefits
  FOR EACH ROW EXECUTE FUNCTION public.touch_jurisdiction_benefits_updated_at();

-- --------------------------------------------------------
-- Computed readiness score function
-- (Call this after extracting/normalizing; stores result back)
-- Score breakdown (100 pts total):
--   20 pts — at least 1 verified official_source with url + excerpt
--   15 pts — statute_citation present
--   15 pts — hours_required OR premarital_program_required=false
--   15 pts — accepted_formats non-empty
--   10 pts — approved_provider_rules.accepted_types non-empty
--   10 pts — certificate_fields.required_fields non-empty
--   10 pts — submission_process.where present
--    5 pts — last_verified_at within 90 days
-- --------------------------------------------------------
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
  IF jsonb_array_length(rec.approved_provider_rules->'accepted_types') > 0 THEN
    score := score + 10;
  END IF;

  -- 10 pts: certificate_fields has required_fields
  IF jsonb_array_length(rec.certificate_fields->'required_fields') > 0 THEN
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

REVOKE ALL ON FUNCTION public.compute_jb_readiness_score(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.compute_jb_readiness_score(UUID) TO authenticated;

-- --------------------------------------------------------
-- Trigger: auto-update page_readiness_score + is_indexed on upsert
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.auto_score_jurisdiction_benefit()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  new_score INTEGER;
BEGIN
  new_score := public.compute_jb_readiness_score(NEW.id);
  NEW.page_readiness_score := new_score;
  NEW.is_indexed := (
    new_score >= 70
    AND NEW.verification_status = 'verified'
    AND NEW.last_verified_at IS NOT NULL
  );
  IF NOT NEW.is_indexed AND NEW.page_readiness_score < 70 THEN
    NEW.noindex_reason := 'low_readiness_score:' || new_score::text;
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

DROP TRIGGER IF EXISTS jb_auto_score ON public.jurisdiction_benefits;
CREATE TRIGGER jb_auto_score
  BEFORE INSERT OR UPDATE ON public.jurisdiction_benefits
  FOR EACH ROW EXECUTE FUNCTION public.auto_score_jurisdiction_benefit();

-- --------------------------------------------------------
-- RLS
-- --------------------------------------------------------
ALTER TABLE public.jurisdiction_benefits ENABLE ROW LEVEL SECURITY;

-- Public read: only indexed rows (hides drafts/unverified from API)
DROP POLICY IF EXISTS "Public read indexed jurisdiction benefits" ON public.jurisdiction_benefits;
CREATE POLICY "Public read indexed jurisdiction benefits"
  ON public.jurisdiction_benefits
  FOR SELECT
  USING (is_indexed = true);

-- Admins have full access
DROP POLICY IF EXISTS "Admins manage jurisdiction benefits" ON public.jurisdiction_benefits;
CREATE POLICY "Admins manage jurisdiction benefits"
  ON public.jurisdiction_benefits
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.id = auth.uid() AND au.is_active = true
    )
  );

-- Service role (edge functions, crawlers) bypasses RLS automatically.

-- --------------------------------------------------------
-- Public view (for frontend queries — safe fields only)
-- --------------------------------------------------------
CREATE OR REPLACE VIEW public.jurisdiction_benefits_public AS
SELECT
  id,
  jurisdiction_id,
  jurisdiction_type,
  jurisdiction_name,
  state_abbr,
  parent_jurisdiction_id,
  benefit_types,
  license_fee_cents,
  discounted_fee_cents,
  savings_amount_cents,
  currency,
  fee_varies_by_county,
  fee_notes,
  standard_waiting_period_hours,
  waiting_period_reduction_hours,
  waiting_period_waived,
  eligibility_rules,
  exclusions,
  premarital_program_required,
  hours_required,
  accepted_formats,
  accepted_formats_notes,
  approved_provider_rules,
  proof_required,
  certificate_fields,
  submission_process,
  -- Sources: expose url + source_type + title only (no content_hash)
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'url',         s->>'url',
        'source_type', s->>'source_type',
        'title',       s->>'title',
        'retrieved_at',s->>'retrieved_at'
      )
    )
    FROM jsonb_array_elements(official_sources) AS s
  ) AS official_sources_public,
  statute_citation,
  last_verified_at,
  verification_status,
  page_readiness_score,
  summary_text,
  fast_path_text,
  faqs,
  is_indexed,
  updated_at
FROM public.jurisdiction_benefits
WHERE is_indexed = true;

GRANT SELECT ON public.jurisdiction_benefits_public TO anon, authenticated;

-- --------------------------------------------------------
-- Seed: migrate existing STATE_DISCOUNT_CONFIG hardcoded data
-- (All seeded as 'needs_review' / unindexed until sources verified)
-- --------------------------------------------------------
INSERT INTO public.jurisdiction_benefits (
  jurisdiction_id, jurisdiction_type, jurisdiction_name, state_abbr,
  benefit_types,
  license_fee_cents, discounted_fee_cents,
  waiting_period_waived, standard_waiting_period_hours,
  premarital_program_required, hours_required,
  accepted_formats,
  verification_status, summary_text
) VALUES

('florida', 'state', 'Florida', 'FL',
  ARRAY['discount','waiting_period_waiver'],
  9350, 6100,
  true, 72,
  true, 4,
  ARRAY['online','in_person'],
  'needs_review',
  'Florida couples who complete a 4-hour premarital course save $32.50 on their marriage license and have the 3-day waiting period waived.'),

('georgia', 'state', 'Georgia', 'GA',
  ARRAY['discount'],
  NULL, NULL,   -- varies by county; individual county rows will have exact amounts
  false, NULL,
  true, 6,
  ARRAY['online','in_person'],
  'needs_review',
  'Georgia couples who complete a 6-hour premarital education program save $16-$50 on their marriage license fee, which varies by county.'),

('maryland', 'state', 'Maryland', 'MD',
  ARRAY['discount','waiting_period_waiver'],
  5500, 3000,
  true, 48,
  true, 4,
  ARRAY['online','in_person'],
  'needs_review',
  'Maryland couples who complete a 4-hour premarital counseling program save $25 on their marriage license and have the 48-hour waiting period waived.'),

('minnesota', 'state', 'Minnesota', 'MN',
  ARRAY['discount','waiting_period_waiver'],
  11500, 4000,
  true, 120,   -- 5-day = 120 hours
  true, 12,
  ARRAY['online','in_person'],
  'needs_review',
  'Minnesota couples who complete 12 hours of premarital education save up to $75 on their marriage license and have the 5-day waiting period waived.'),

('oklahoma', 'state', 'Oklahoma', 'OK',
  ARRAY['discount'],
  5000, 500,
  false, NULL,
  true, NULL,
  ARRAY['online','in_person'],
  'needs_review',
  'Oklahoma couples who complete premarital counseling with a licensed professional or clergy pay only the $5 court fee, saving $45 on the standard $50 license.'),

('tennessee', 'state', 'Tennessee', 'TN',
  ARRAY['discount'],
  9750, 3750,
  false, NULL,
  true, 4,
  ARRAY['online','in_person'],
  'needs_review',
  'Tennessee couples who complete 4 hours of premarital preparation save $60 on their marriage license fee.'),

('texas', 'state', 'Texas', 'TX',
  ARRAY['discount','waiting_period_waiver'],
  8200, 2200,
  true, 72,
  true, 8,
  ARRAY['online','in_person'],
  'needs_review',
  'Texas couples who complete the Twogether in Texas 8-hour program save $60 on their marriage license and have the 72-hour waiting period waived. Certificate valid for 1 year.'),

('indiana', 'state', 'Indiana', 'IN',
  ARRAY['discount'],
  7800, 1800,
  false, NULL,
  true, NULL,
  ARRAY['in_person'],
  'needs_review',
  'Indiana couples who complete premarital counseling with a licensed professional or clergy and have their provider sign the official Certificate of Completion save $60 on their marriage license.')

ON CONFLICT (jurisdiction_id) DO NOTHING;
