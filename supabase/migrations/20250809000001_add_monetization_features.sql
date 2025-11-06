-- Add monetization and subscription features
-- This extends the existing profiles table with payment and subscription support

-- Create subscription plans table
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    name TEXT NOT NULL, -- 'Free', 'Featured', 'Premium'
    price_monthly INTEGER NOT NULL, -- Price in cents (0, 4900, 9900)
    stripe_price_id TEXT, -- Stripe price ID for billing
    
    -- Features included
    featured_placement BOOLEAN DEFAULT false,
    premium_placement BOOLEAN DEFAULT false,
    multiple_photos BOOLEAN DEFAULT false,
    lead_analytics BOOLEAN DEFAULT false,
    calendar_integration BOOLEAN DEFAULT false,
    custom_branding BOOLEAN DEFAULT false,
    
    is_active BOOLEAN DEFAULT true
);

-- Create professional subscriptions table  
CREATE TABLE professional_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES subscription_plans(id) ON DELETE RESTRICT,
    
    -- Stripe integration
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    
    -- Subscription status
    status TEXT DEFAULT 'active', -- 'active', 'past_due', 'canceled', 'incomplete'
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    
    -- Billing
    last_payment_at TIMESTAMP WITH TIME ZONE,
    next_billing_date TIMESTAMP WITH TIME ZONE
);

-- Create leads/contacts table to track inquiries
CREATE TABLE profile_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Contact information
    couple_name TEXT NOT NULL,
    couple_email TEXT NOT NULL,
    couple_phone TEXT,
    wedding_date DATE,
    location TEXT,
    message TEXT,
    
    -- Lead tracking
    source TEXT DEFAULT 'directory', -- 'directory', 'google', 'referral'
    status TEXT DEFAULT 'new', -- 'new', 'contacted', 'scheduled', 'converted'
    
    -- Email notifications
    professional_notified BOOLEAN DEFAULT false,
    admin_notified BOOLEAN DEFAULT false
);

-- Create admin users table
CREATE TABLE admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'admin', -- 'super_admin', 'admin', 'support'
    is_active BOOLEAN DEFAULT true
);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, price_monthly, featured_placement, premium_placement, multiple_photos, lead_analytics, calendar_integration, custom_branding) VALUES
('Free', 0, false, false, false, false, false, false),
('Featured', 4900, true, false, true, true, false, false),
('Premium', 9900, false, true, true, true, true, true);

-- Update existing profiles table to include subscription info
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_plan_id UUID REFERENCES subscription_plans(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_subscription ON profiles(subscription_plan_id);
CREATE INDEX IF NOT EXISTS idx_profiles_claimed ON profiles(is_claimed, subscription_plan_id);
CREATE INDEX IF NOT EXISTS idx_leads_profile ON profile_leads(profile_id, created_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_profile ON professional_subscriptions(profile_id, status);

-- Update RLS policies

-- Allow professionals to view their own leads
CREATE POLICY "Professionals can view their own leads." ON profile_leads
    FOR SELECT USING (
        profile_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Allow professionals to view their own subscription
CREATE POLICY "Professionals can view their own subscription." ON professional_subscriptions
    FOR SELECT USING (
        profile_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Allow public to create leads (contact professionals)
CREATE POLICY "Anyone can create leads." ON profile_leads
    FOR INSERT WITH CHECK (true);

-- Admin policies (restrict to admin users)
CREATE POLICY "Admins can view all data." ON profiles
    FOR ALL USING (
        EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true)
    );

CREATE POLICY "Admins can manage leads." ON profile_leads
    FOR ALL USING (
        EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true)
    );

CREATE POLICY "Admins can manage subscriptions." ON professional_subscriptions
    FOR ALL USING (
        EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true)
    );

-- Enable RLS on new tables
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create function to automatically assign free plan to new profiles
CREATE OR REPLACE FUNCTION assign_free_plan_to_profile()
RETURNS TRIGGER AS $$
DECLARE
    free_plan_id UUID;
BEGIN
    -- Get the free plan ID
    SELECT id INTO free_plan_id 
    FROM subscription_plans 
    WHERE name = 'Free' 
    LIMIT 1;
    
    -- Assign free plan to new profile
    NEW.subscription_plan_id := free_plan_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to assign free plan to new profiles
CREATE TRIGGER assign_free_plan_trigger
    BEFORE INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION assign_free_plan_to_profile();

-- Create function to generate slugs
CREATE OR REPLACE FUNCTION generate_slug_for_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate slug from full_name if not provided
    IF NEW.slug IS NULL AND NEW.full_name IS NOT NULL THEN
        NEW.slug := LOWER(REGEXP_REPLACE(
            REGEXP_REPLACE(NEW.full_name, '[^a-zA-Z0-9\s]', '', 'g'),
            '\s+', '-', 'g'
        ));
        
        -- Ensure uniqueness by appending number if needed
        WHILE EXISTS (SELECT 1 FROM profiles WHERE slug = NEW.slug AND id != NEW.id) LOOP
            NEW.slug := NEW.slug || '-' || FLOOR(RANDOM() * 1000)::TEXT;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to generate slugs
CREATE TRIGGER generate_slug_trigger
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION generate_slug_for_profile();