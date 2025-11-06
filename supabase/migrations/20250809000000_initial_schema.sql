-- Create the main table for professional profiles
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Core Profile Information
    full_name TEXT NOT NULL,
    email TEXT UNIQUE, -- Can be null initially for scraped profiles
    phone TEXT,
    website TEXT,
    bio TEXT,
    photo_url TEXT,

    -- Professional Details
    profession TEXT, -- e.g., 'Therapist', 'Coach', 'Clergy'
    specialties TEXT[], -- Array of specialties like {'Conflict Resolution', 'Financial Planning'}

    -- Location Details
    address_line1 TEXT,
    city TEXT,
    state_province TEXT,
    postal_code TEXT,
    country TEXT,

    -- Monetization and Verification
    is_claimed BOOLEAN DEFAULT false,
    is_sponsored BOOLEAN DEFAULT false,
    sponsored_until TIMESTAMP WITH TIME ZONE,

    -- Foreign key to the auth.users table if the profile is claimed
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create Policies for RLS
-- 1. Allow public, read-only access to all profiles
CREATE POLICY "Public profiles are viewable by everyone." ON profiles
    FOR SELECT USING (true);

-- 2. Allow logged-in users to create a profile (if they don't have one)
CREATE POLICY "Users can create their own profile." ON profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Allow users to update their own profile
CREATE POLICY "Users can update their own profile." ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Create a bucket for profile photos in Supabase Storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile_photos', 'profile_photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Profile photos are publicly accessible." ON storage.objects
    FOR SELECT USING (bucket_id = 'profile_photos');

CREATE POLICY "Anyone can upload a profile photo." ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'profile_photos');

