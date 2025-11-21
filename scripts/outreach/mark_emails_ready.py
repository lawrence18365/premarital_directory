#!/usr/bin/env python3
"""
Mark enriched emails as 'ready_to_email' after manual review
Run this after you've reviewed the CSV from review_emails.py
"""

import os
import sys
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("=" * 70)
print("✅ MARK EMAILS AS READY TO SEND")
print("=" * 70)

# Get all profiles with status='enrichment_success'
response = supabase.table('profiles').select("*").eq("status", "enrichment_success").execute()

if not response.data:
    print("\n❌ No profiles found with status='enrichment_success'")
    print("   Run enrichment_engine.py first!")
    sys.exit(0)

print(f"\n📧 Found {len(response.data)} profiles ready for review:\n")

for i, profile in enumerate(response.data, 1):
    print(f"{i}. {profile.get('full_name')}")
    print(f"   Email: {profile.get('email')}")
    print(f"   Location: {profile.get('city')}, {profile.get('state_province')}")
    print()

print("=" * 70)
choice = input("Mark ALL these emails as ready to send? (yes/no): ").strip().lower()

if choice == 'yes':
    marked = 0
    for profile in response.data:
        try:
            supabase.table('profiles').update({
                "status": "ready_to_email"
            }).eq("id", profile['id']).execute()
            marked += 1
        except Exception as e:
            print(f"❌ Error: {e}")

    print(f"\n✅ SUCCESS! Marked {marked} emails as ready to send")
    print("\n📝 Next: python3 supabase_outreach_campaign.py")
else:
    print("\n❌ Cancelled. Mark emails manually in Supabase or via SQL:")
    print("\n   UPDATE profiles")
    print("   SET status = 'ready_to_email'")
    print("   WHERE email IN ('email1@example.com', 'email2@example.com');")

print("=" * 70)
