-- Drop the exact legacy policy that attempts to query auth.users, as it causes "permission denied for table users" errors for authenticated professionals trying to claim their profiles.

DO $$
BEGIN
    -- Only drop the policy if it exists to avoid errors on fresh setups
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profile_claims' 
        AND policyname = 'Users can view their own claims'
    ) THEN
        DROP POLICY "Users can view their own claims" ON public.profile_claims;
    END IF;
END
$$;

-- Create the refined policy using auth.jwt() which avoids querying auth.users entirely
CREATE POLICY "Users can view their own claims" ON public.profile_claims
    FOR SELECT USING (
        submitted_by_email = lower(auth.jwt() ->> 'email')
    );
