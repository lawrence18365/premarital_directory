-- Fix profile_claims table to use UUID instead of BIGINT
-- This fixes the foreign key mismatch with profiles table

-- Drop the existing table (safe since it's likely empty in development)
DROP TABLE IF EXISTS public.profile_claims CASCADE;

-- Recreate with correct UUID type
CREATE TABLE public.profile_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    submitted_by_email TEXT NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    claim_data JSONB,
    notes TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,

    CONSTRAINT check_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

COMMENT ON TABLE public.profile_claims IS 'Tracks requests from users to claim existing professional profiles.';
COMMENT ON COLUMN public.profile_claims.profile_id IS 'The ID of the profile being claimed (NULL for new profile submissions).';
COMMENT ON COLUMN public.profile_claims.submitted_by_email IS 'The email of the user submitting the claim.';
COMMENT ON COLUMN public.profile_claims.status IS 'The current status of the claim request.';
COMMENT ON COLUMN public.profile_claims.claim_data IS 'A JSONB object containing the data submitted in the claim form.';

-- Enable RLS
ALTER TABLE public.profile_claims ENABLE ROW LEVEL SECURITY;

-- Policies: Allow anyone to submit claims
CREATE POLICY "Anyone can submit profile claims" ON public.profile_claims
    FOR INSERT WITH CHECK (true);

-- Allow users to view their own claims by email
CREATE POLICY "Users can view their own claims" ON public.profile_claims
    FOR SELECT USING (submitted_by_email = current_setting('request.jwt.claims', true)::json->>'email' OR auth.uid() IN (SELECT id FROM auth.users WHERE email = submitted_by_email));

-- Allow admins to view all claims (assuming admin role exists)
CREATE POLICY "Admins can view all claims" ON public.profile_claims
    FOR SELECT USING (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'service_role');

-- Allow admins to update claims (for approval/rejection)
CREATE POLICY "Admins can update claims" ON public.profile_claims
    FOR UPDATE USING (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'service_role');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profile_claims_profile_id ON public.profile_claims(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_claims_status ON public.profile_claims(status);
CREATE INDEX IF NOT EXISTS idx_profile_claims_email ON public.profile_claims(submitted_by_email);
CREATE INDEX IF NOT EXISTS idx_profile_claims_submitted_at ON public.profile_claims(submitted_at DESC);
