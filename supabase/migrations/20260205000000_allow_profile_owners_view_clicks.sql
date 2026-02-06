-- Allow profile owners to view their own click data
-- Previously only admins could see profile_clicks, which meant the
-- professional dashboard and analytics page returned empty results
-- for community-tier users viewing their own profile stats.

CREATE POLICY "Profile owners can view their own clicks"
  ON profile_clicks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = profile_clicks.profile_id
      AND profiles.user_id = auth.uid()
    )
  );
