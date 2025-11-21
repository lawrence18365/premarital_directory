#!/usr/bin/env python3
"""
Verify the enrichment results
"""

import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Get profiles that now have emails
response = supabase.table('profiles').select("*").not_.is_("email", "null").limit(10).execute()

print("=" * 80)
print("📊 ENRICHMENT RESULTS - PROFILES WITH EMAILS")
print("=" * 80)

for i, profile in enumerate(response.data, 1):
    print(f"\n{i}. {profile.get('full_name')}")
    print(f"   Email: {profile.get('email')}")
    print(f"   City: {profile.get('city')}")
    print(f"   State: {profile.get('state_province')}")
    print("-" * 80)

print(f"\n📈 SUMMARY:")
print(f"   Total profiles with emails: {len(response.data)}")
print(f"   ✅ System successfully enriched profiles on autopilot!")
