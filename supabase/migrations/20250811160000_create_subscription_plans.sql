-- Create subscription plans table
CREATE TABLE subscription_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    price_monthly INTEGER NOT NULL DEFAULT 0, -- Price in cents
    stripe_price_id TEXT UNIQUE,
    features JSONB DEFAULT '{}',
    featured_placement BOOLEAN DEFAULT FALSE,
    premium_placement BOOLEAN DEFAULT FALSE,
    contact_unlock BOOLEAN DEFAULT FALSE,
    analytics_access BOOLEAN DEFAULT FALSE,
    priority_support BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed subscription plans
INSERT INTO subscription_plans (name, price_monthly, features, featured_placement, premium_placement, contact_unlock, analytics_access, priority_support, sort_order) VALUES
-- Free Plan
('Free', 0, '{"profiles": 1, "basic_listing": true, "search_visibility": true}', FALSE, FALSE, FALSE, FALSE, FALSE, 1),

-- Featured Plan  
('Featured', 4900, '{"profiles": 1, "featured_badge": true, "priority_placement": true, "contact_unlock": true, "basic_analytics": true}', TRUE, FALSE, TRUE, TRUE, FALSE, 2),

-- Premium Plan
('Premium', 9900, '{"profiles": 3, "premium_badge": true, "top_placement": true, "contact_unlock": true, "advanced_analytics": true, "priority_support": true, "review_management": true}', TRUE, TRUE, TRUE, TRUE, TRUE, 3);

-- Add sponsored_rank column to profiles table for sorting
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sponsored_rank INTEGER DEFAULT 0;

-- Create index for faster sorting
CREATE INDEX IF NOT EXISTS idx_profiles_sponsored_rank ON profiles(sponsored_rank DESC, is_sponsored DESC, created_at DESC);

-- Update existing sponsored profiles to have rank 1
UPDATE profiles SET sponsored_rank = 1 WHERE is_sponsored = TRUE;