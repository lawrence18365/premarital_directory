-- City overrides for manual content editing
-- Allows hand-written intros for anchor cities to replace AI-generated fluff

CREATE TABLE IF NOT EXISTS city_overrides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  state_slug TEXT NOT NULL,
  city_slug TEXT NOT NULL,

  -- Override content (NULL means use default/AI)
  custom_intro TEXT, -- Hand-written 2-3 sentence intro
  custom_how_to_choose TEXT, -- Optional custom decision-help content
  custom_faq JSONB, -- Optional custom FAQ items [{question, answer}]

  -- Metadata
  last_reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one override per city
  UNIQUE(state_slug, city_slug)
);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_city_overrides_lookup ON city_overrides(state_slug, city_slug);

-- Enable RLS
ALTER TABLE city_overrides ENABLE ROW LEVEL SECURITY;

-- Anyone can read overrides (public content)
CREATE POLICY "Anyone can view city overrides"
  ON city_overrides
  FOR SELECT
  USING (true);

-- Only admins can modify
CREATE POLICY "Admins can manage city overrides"
  ON city_overrides
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.tier = 'admin'
    )
  );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_city_overrides_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER city_overrides_timestamp
  BEFORE UPDATE ON city_overrides
  FOR EACH ROW
  EXECUTE FUNCTION update_city_overrides_timestamp();

-- Seed initial overrides for anchor cities with placeholder intros
-- These should be replaced with hand-written content
INSERT INTO city_overrides (state_slug, city_slug, custom_intro, notes) VALUES
  ('texas', 'austin',
   'Austin has a diverse mix of licensed therapists, faith-based programs, and independent coaches offering premarital counseling. Many couples here combine secular therapy with their church''s marriage prep. Below are professionals serving the Austin area.',
   'Anchor city - needs manual review'),
  ('texas', 'dallas',
   'Dallas offers a wide range of premarital counseling options, from clinical therapists to Christian counselors and relationship coaches. Whether you prefer evidence-based therapy or faith-centered preparation, you''ll find qualified professionals here.',
   'Anchor city - needs manual review'),
  ('texas', 'houston',
   'Houston''s premarital counseling landscape includes licensed therapists (LMFT, LPC), church-based programs, and certified coaches. The city''s diversity means you can find counselors who understand various cultural and religious backgrounds.',
   'Anchor city - needs manual review'),
  ('california', 'los-angeles',
   'Los Angeles offers extensive premarital counseling options across its diverse neighborhoods. From Westside therapists to faith-based programs throughout the metro area, you can find professionals who match your approach and schedule.',
   'Anchor city - needs manual review'),
  ('california', 'san-francisco',
   'San Francisco and the Bay Area have a strong network of premarital counselors, many specializing in modern relationship dynamics. Options range from licensed therapists to progressive faith-based counselors and tech-savvy online coaches.',
   'Anchor city - needs manual review'),
  ('new-york', 'new-york',
   'New York City offers premarital counseling across all five boroughs. Licensed therapists, religious counselors, and relationship coaches serve Manhattan, Brooklyn, Queens, and beyond. Many offer both in-person and virtual sessions.',
   'Anchor city - needs manual review'),
  ('florida', 'miami',
   'Miami''s premarital counseling scene reflects the city''s cultural diversity. You''ll find bilingual counselors, faith-based programs across denominations, and therapists who understand multicultural relationships.',
   'Anchor city - needs manual review'),
  ('illinois', 'chicago',
   'Chicago offers premarital counseling throughout its neighborhoods and suburbs. Licensed therapists, clergy from various faiths, and certified coaches provide options for couples at every stage of their engagement.',
   'Anchor city - needs manual review'),
  ('georgia', 'atlanta',
   'Atlanta''s premarital counseling community includes licensed therapists, strong church-based programs, and relationship coaches. Many professionals here specialize in both faith-centered and secular approaches.',
   'Anchor city - needs manual review'),
  ('colorado', 'denver',
   'Denver and the Front Range offer diverse premarital counseling options. From downtown therapists to mountain community counselors, you''ll find professionals who match Colorado''s blend of outdoor lifestyle and relationship focus.',
   'Anchor city - needs manual review')
ON CONFLICT (state_slug, city_slug) DO NOTHING;
