-- Allow authenticated users to claim unclaimed profiles that match their email.
-- This fixes the signup flow where a user signs up with an email that already
-- has an imported/unclaimed profile in the directory.
--
-- USING: Only unclaimed profiles (user_id IS NULL) with matching email can be targeted
-- WITH CHECK: After update, user_id must equal the authenticated user's ID

CREATE POLICY "Users can claim unclaimed profiles matching their email."
  ON profiles
  FOR UPDATE
  USING (
    user_id IS NULL
    AND lower(email) = lower(auth.jwt() ->> 'email')
  )
  WITH CHECK (
    user_id = auth.uid()
  );
