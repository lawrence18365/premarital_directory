-- Multi-location listings for dual-licensed counselors
-- Allows counselors to appear on up to 3 additional state/city pages

CREATE TABLE profile_additional_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  state_province TEXT NOT NULL,
  postal_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for location-based lookups
CREATE INDEX idx_pal_state ON profile_additional_locations (state_province);
CREATE INDEX idx_pal_state_city ON profile_additional_locations (state_province, city);
CREATE INDEX idx_pal_profile ON profile_additional_locations (profile_id);

-- Prevent duplicate city+state per profile
CREATE UNIQUE INDEX idx_pal_unique_location
  ON profile_additional_locations (profile_id, state_province, lower(city));

-- Trigger: enforce max 3 additional locations per profile
CREATE OR REPLACE FUNCTION check_max_additional_locations()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT count(*) FROM profile_additional_locations WHERE profile_id = NEW.profile_id) >= 3 THEN
    RAISE EXCEPTION 'Maximum of 3 additional locations per profile';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_max_additional_locations
  BEFORE INSERT ON profile_additional_locations
  FOR EACH ROW
  EXECUTE FUNCTION check_max_additional_locations();

-- RLS
ALTER TABLE profile_additional_locations ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Anyone can read additional locations"
  ON profile_additional_locations FOR SELECT
  USING (true);

-- Owner can insert
CREATE POLICY "Profile owner can insert additional locations"
  ON profile_additional_locations FOR INSERT
  WITH CHECK (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Owner can update
CREATE POLICY "Profile owner can update additional locations"
  ON profile_additional_locations FOR UPDATE
  USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Owner can delete
CREATE POLICY "Profile owner can delete additional locations"
  ON profile_additional_locations FOR DELETE
  USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Admin full access (service role bypasses RLS, but explicit policy for completeness)
CREATE POLICY "Admin full access to additional locations"
  ON profile_additional_locations FOR ALL
  USING (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  );
