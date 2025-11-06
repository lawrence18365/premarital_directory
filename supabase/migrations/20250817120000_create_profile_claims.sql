
CREATE TABLE IF NOT EXISTS public.profile_claims (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    profile_id BIGINT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    submitted_by_email TEXT NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    claim_data JSONB,
    notes TEXT,
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,

    CONSTRAINT check_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

COMMENT ON TABLE public.profile_claims IS 'Tracks requests from users to claim existing professional profiles.';
COMMENT ON COLUMN public.profile_claims.profile_id IS 'The ID of the profile being claimed.';
COMMENT ON COLUMN public.profile_claims.submitted_by_email IS 'The email of the user submitting the claim.';
COMMENT ON COLUMN public.profile_claims.status IS 'The current status of the claim request.';
COMMENT ON COLUMN public.profile_claims.claim_data IS 'A JSONB object containing the data submitted in the claim form.';

-- Enable RLS
ALTER TABLE public.profile_claims ENABLE ROW LEVEL SECURITY;

-- Policies
-- For now, we will not create policies, as claims will be managed by an admin role.
-- We can add policies later if we allow users to see their own pending claims.

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profile_claims_profile_id ON public.profile_claims(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_claims_status ON public.profile_claims(status);
