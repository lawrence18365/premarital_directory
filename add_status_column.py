#!/usr/bin/env python3
"""
Add status column to profiles table for workflow automation

This script adds a 'status' column to track the enrichment/outreach workflow:
- null/pending: Not yet processed
- enrichment_success: Email found, ready for manual review
- ready_to_email: Passed manual review, ready for outreach
- contacted: Email sent
- enrichment_failed: No email found
- unsubscribed: User opted out
"""

import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

print("=" * 70)
print("🔧 DATABASE SCHEMA UPDATE - ADD STATUS COLUMN")
print("=" * 70)

print("\n⚠️  IMPORTANT: This requires direct database access via SQL.")
print("\nThe Python Supabase client cannot alter table schemas.")
print("You need to run this SQL in your Supabase dashboard:\n")

sql_command = """
-- Add status column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);

-- Add enrichment timestamp
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS enrichment_attempted_at TIMESTAMPTZ;

-- Add contacted timestamp
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS contacted_at TIMESTAMPTZ;

-- Update existing profiles with emails to 'enrichment_success'
UPDATE profiles
SET status = 'enrichment_success'
WHERE email IS NOT NULL AND status IS NULL;

-- Create a view for profiles ready to email (optional but useful)
CREATE OR REPLACE VIEW profiles_ready_to_email AS
SELECT * FROM profiles
WHERE status = 'ready_to_email'
ORDER BY created_at DESC;
"""

print("-" * 70)
print(sql_command)
print("-" * 70)

print("\n📝 HOW TO RUN THIS:")
print("1. Go to: https://supabase.com/dashboard")
print("2. Select your project")
print("3. Click 'SQL Editor' in the left sidebar")
print("4. Copy the SQL above")
print("5. Paste it into a new query")
print("6. Click 'Run' (or press Cmd/Ctrl + Enter)")

print("\n✅ This will:")
print("   - Add 'status' column (default: 'pending')")
print("   - Add 'enrichment_attempted_at' timestamp")
print("   - Add 'contacted_at' timestamp")
print("   - Create index for fast status queries")
print("   - Update existing profiles with emails to 'enrichment_success'")

print("\n💡 After running the SQL, test it with:")
print("   python3 test_status_column.py")

print("\n" + "=" * 70)

# Try to verify if it exists
print("\n🔍 Checking if status column already exists...")
try:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    response = supabase.table('profiles').select("status").limit(1).execute()
    print("✅ Status column already exists! You're good to go.")
except Exception as e:
    if "column" in str(e).lower() and "does not exist" in str(e).lower():
        print("❌ Status column does NOT exist. Please run the SQL above.")
    else:
        print(f"⚠️  Could not verify: {e}")

print("=" * 70)
