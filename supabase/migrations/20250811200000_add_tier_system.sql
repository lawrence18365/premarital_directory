-- Add tier system for Community / Local Featured / Area Spotlight

-- Add tier column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'community' CHECK (tier IN ('community', 'local_featured', 'area_spotlight'));

-- Add subscription price
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_price INTEGER DEFAULT 0;

-- Add featured cities for Area Spotlight (array of city slugs)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS featured_cities TEXT[] DEFAULT '{}';

-- Add featured until timestamp
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS featured_until TIMESTAMP WITH TIME ZONE;

-- Add contact reveals count for analytics
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contact_reveals_count INTEGER DEFAULT 0;

-- Create contact reveals tracking table
CREATE TABLE IF NOT EXISTS contact_reveals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    reveal_type TEXT CHECK (reveal_type IN ('phone', 'email', 'website', 'contact_form')),
    revealed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    session_id TEXT
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_contact_reveals_profile_id ON contact_reveals(profile_id);
CREATE INDEX IF NOT EXISTS idx_contact_reveals_ip ON contact_reveals(ip_address, revealed_at);
CREATE INDEX IF NOT EXISTS idx_profiles_tier ON profiles(tier);
CREATE INDEX IF NOT EXISTS idx_profiles_featured_until ON profiles(featured_until);

-- Enable RLS on contact_reveals
ALTER TABLE contact_reveals ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert reveals (for tracking)
CREATE POLICY "Anyone can log contact reveals" ON contact_reveals
    FOR INSERT WITH CHECK (true);

-- Allow profile owners to view their reveals
CREATE POLICY "Profile owners can view their reveals" ON contact_reveals
    FOR SELECT USING (
        profile_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Update existing profiles to community tier
UPDATE profiles SET tier = 'community', subscription_price = 0 WHERE tier IS NULL;

-- Add helper function to check if subscription is active
CREATE OR REPLACE FUNCTION is_subscription_active(profile_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT featured_until > NOW()
        FROM profiles
        WHERE id = profile_id
    );
END;
$$ LANGUAGE plpgsql;

-- Add helper function to increment reveal count
CREATE OR REPLACE FUNCTION increment_reveal_count(profile_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE profiles
    SET contact_reveals_count = contact_reveals_count + 1
    WHERE id = profile_id;
END;
$$ LANGUAGE plpgsql;
