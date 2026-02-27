-- Fix "permission denied for table users" error on profile_additional_locations
-- The admin policy queries auth.users directly, which the authenticated role
-- cannot access. Even though regular users aren't admins, PostgreSQL evaluates
-- ALL policies and the auth.users subquery throws a permission error.
-- Fix: use auth.jwt() instead.

DROP POLICY IF EXISTS "Admin full access to additional locations" ON profile_additional_locations;

CREATE POLICY "Admin full access to additional locations"
  ON profile_additional_locations FOR ALL
  USING (
    (auth.jwt() ->> 'role') = 'admin'
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );
