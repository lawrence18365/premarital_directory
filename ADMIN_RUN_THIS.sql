-- =====================================================
-- ADMIN: Run this SQL in Supabase Dashboard SQL Editor
-- =====================================================

-- Temporarily disable RLS to seed subscription plans data
ALTER TABLE subscription_plans DISABLE ROW LEVEL SECURITY;

-- Clear any existing plans
DELETE FROM subscription_plans;

-- Insert the three subscription tiers
INSERT INTO subscription_plans (name, price_monthly, featured_placement, premium_placement) VALUES 
('Free', 0, FALSE, FALSE),
('Featured', 4900, TRUE, FALSE), 
('Premium', 9900, TRUE, TRUE);

-- Add sponsored_rank column to profiles if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sponsored_rank INTEGER DEFAULT 0;

-- Update existing sponsored profiles to have rank 1 (Featured level)
UPDATE profiles SET sponsored_rank = 1 WHERE is_sponsored = TRUE;

-- Re-enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Verify the data
SELECT name, price_monthly, featured_placement, premium_placement FROM subscription_plans ORDER BY price_monthly;

-- Check profile ranks
SELECT full_name, is_sponsored, sponsored_rank FROM profiles WHERE is_sponsored = TRUE LIMIT 5;