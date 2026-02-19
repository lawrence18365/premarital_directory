-- ============================================================
-- Step 2: Source Documents Store
-- Keeps raw fetched HTML/PDF text + metadata per URL.
-- This is the evidence layer that backs every field in
-- jurisdiction_benefits.official_sources[].
-- ============================================================

CREATE TABLE IF NOT EXISTS public.source_documents (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- ---- Fetch identity ----
  url                   TEXT        NOT NULL UNIQUE,  -- normalized canonical URL
  source_type           TEXT        NOT NULL
    CHECK (source_type IN (
      'state_statute', 'county_clerk_site', 'official_form',
      'state_agency', 'court_site', 'faq_page'
    )),
  title                 TEXT,   -- <title> tag or PDF metadata title

  -- ---- Fetch metadata ----
  fetched_at            TIMESTAMPTZ,
  http_status           INTEGER,
  content_type          TEXT,   -- 'text/html', 'application/pdf', etc.
  etag                  TEXT,   -- HTTP ETag for conditional GETs
  last_modified         TEXT,   -- HTTP Last-Modified header value

  -- ---- Content ----
  content_hash          TEXT,   -- sha256 hex of raw_text; drives change detection
  raw_text              TEXT,   -- full extracted text (tags stripped from HTML; pdf→text)
  raw_blob_path         TEXT,   -- Supabase Storage path for original HTML/PDF
  word_count            INTEGER GENERATED ALWAYS AS (
                          CASE WHEN raw_text IS NOT NULL
                               THEN array_length(regexp_split_to_array(trim(raw_text), '\s+'), 1)
                          END
                        ) STORED,

  -- ---- Fetch health ----
  robots_allowed        BOOLEAN,  -- result of robots.txt check (null = unchecked)
  consecutive_failures  INTEGER   NOT NULL DEFAULT 0,
  last_success_at       TIMESTAMPTZ,
  -- Array of {attempt_at, error, http_status}
  fetch_errors          JSONB     NOT NULL DEFAULT '[]'::jsonb,

  -- ---- Recrawl scheduling ----
  priority              INTEGER   NOT NULL DEFAULT 5
    CHECK (priority BETWEEN 1 AND 10),  -- 1=highest (statute), 10=lowest
  recrawl_frequency_days INTEGER  NOT NULL DEFAULT 30,
  next_crawl_at         TIMESTAMPTZ,

  -- ---- Jurisdiction linkage ----
  -- Which jurisdiction_benefits rows reference this document
  jurisdiction_ids      TEXT[]    NOT NULL DEFAULT '{}',

  -- ---- Extraction state ----
  extraction_status     TEXT      NOT NULL DEFAULT 'pending'
    CHECK (extraction_status IN (
      'pending',        -- not yet run through extractor
      'extracted',      -- extractor produced field patches (now in jurisdiction_benefits)
      'needs_reextract',-- content_hash changed since last extraction
      'failed',         -- extractor error; see fetch_errors
      'skipped'         -- robots disallowed / non-parseable content
    ))
);

-- --------------------------------------------------------
-- Indexes
-- --------------------------------------------------------

-- Primary recrawl queue: order by priority then next_crawl_at
CREATE INDEX IF NOT EXISTS idx_sd_recrawl_queue
  ON public.source_documents(priority, next_crawl_at)
  WHERE extraction_status != 'skipped';

-- Lookup by jurisdiction
CREATE INDEX IF NOT EXISTS idx_sd_jurisdiction_ids
  ON public.source_documents USING GIN(jurisdiction_ids);

-- Change detection: stale sources
CREATE INDEX IF NOT EXISTS idx_sd_stale
  ON public.source_documents(last_success_at)
  WHERE extraction_status = 'extracted';

-- Pending extraction work
CREATE INDEX IF NOT EXISTS idx_sd_pending_extraction
  ON public.source_documents(extraction_status, priority)
  WHERE extraction_status IN ('pending', 'needs_reextract');

-- --------------------------------------------------------
-- updated_at trigger
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_source_documents_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sd_touch_updated_at ON public.source_documents;
CREATE TRIGGER sd_touch_updated_at
  BEFORE UPDATE ON public.source_documents
  FOR EACH ROW EXECUTE FUNCTION public.touch_source_documents_updated_at();

-- --------------------------------------------------------
-- Change detection function
-- Called by the collector after a successful fetch.
-- Returns whether the content changed (hash mismatch).
-- If changed: marks jurisdiction_benefits rows as needs_review,
--             appends to their change_log, clears last_verified_at.
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.detect_source_change(
  p_source_id   UUID,
  p_new_hash    TEXT,
  p_fetched_at  TIMESTAMPTZ DEFAULT now()
)
RETURNS BOOLEAN   -- true = content changed
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_hash TEXT;
  jur_ids       TEXT[];
  changed       BOOLEAN := false;
BEGIN
  SELECT content_hash, jurisdiction_ids
    INTO existing_hash, jur_ids
    FROM public.source_documents
   WHERE id = p_source_id;

  IF existing_hash IS NULL OR existing_hash != p_new_hash THEN
    changed := true;

    -- Demote all linked jurisdiction_benefits to needs_review
    IF array_length(jur_ids, 1) > 0 THEN
      UPDATE public.jurisdiction_benefits
         SET verification_status = 'needs_review',
             last_verified_at    = NULL,         -- force re-verification
             change_log = change_log || jsonb_build_array(
               jsonb_build_object(
                 'changed_at',  p_fetched_at,
                 'changed_by',  'collector:hash_mismatch',
                 'field',       'official_sources',
                 'old_value',   existing_hash,
                 'new_value',   p_new_hash,
                 'source_id',   p_source_id
               )
             )
       WHERE jurisdiction_id = ANY(jur_ids)
         AND verification_status = 'verified';  -- only demote currently-verified rows
    END IF;
  END IF;

  RETURN changed;
END;
$$;

REVOKE ALL ON FUNCTION public.detect_source_change(UUID, TEXT, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.detect_source_change(UUID, TEXT, TIMESTAMPTZ)
  TO authenticated;  -- granted to service-role scripts

-- --------------------------------------------------------
-- Storage bucket for raw blobs (HTML + PDF originals)
-- --------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'source-documents',
  'source-documents',
  false,  -- private; only service role can read
  10485760,  -- 10 MB max per file
  ARRAY['text/html', 'application/pdf', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- Service role gets full access (via bypass). No anon/authenticated access.

-- --------------------------------------------------------
-- RLS
-- --------------------------------------------------------
ALTER TABLE public.source_documents ENABLE ROW LEVEL SECURITY;

-- No public read: source documents are internal/admin only
-- (raw_text may contain copyrighted content; we only expose excerpts via official_sources[])

DROP POLICY IF EXISTS "Admins manage source documents" ON public.source_documents;
CREATE POLICY "Admins manage source documents"
  ON public.source_documents
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.id = auth.uid() AND au.is_active = true
    )
  );

-- --------------------------------------------------------
-- Seed: register known source URLs for existing 8 states
-- (URLs are populated from the existing STATE_DISCOUNT_CONFIG
--  certificateUrl values + known state statute patterns)
-- All start as 'pending' extraction so the collector queues them.
-- --------------------------------------------------------
INSERT INTO public.source_documents (url, source_type, priority, recrawl_frequency_days, jurisdiction_ids)
VALUES

-- Texas: known official program URL (from certificateUrl in static config)
('https://www.twogetherintexas.com/',
  'state_agency', 1, 30, ARRAY['texas']),

-- Indiana: known official form PDF (from certificateUrl in static config)
('https://www.in.gov/courts/files/form-completion-premarital-counseling.pdf',
  'official_form', 1, 90, ARRAY['indiana'])

ON CONFLICT (url) DO NOTHING;

-- Note: Florida, Georgia, Maryland, Minnesota, Oklahoma, Tennessee statute URLs
-- must be researched and added via:
--   node scripts/collector/run-collector.js --add-source \
--     --jurisdiction florida --url <statute-url> --type state_statute
