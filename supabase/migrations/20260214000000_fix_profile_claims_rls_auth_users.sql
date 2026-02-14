-- Fix "permission denied for table users" error on profile_claims
-- The old policy tried to SELECT from auth.users which the authenticated role cannot access.
-- Simplified to use JWT email claim only, which is already available and sufficient.

DROP POLICY IF EXISTS "Users can view their own claims" ON public.profile_claims;

CREATE POLICY "Users can view their own claims" ON public.profile_claims
    FOR SELECT USING (
        submitted_by_email = lower(auth.jwt() ->> 'email')
    );
