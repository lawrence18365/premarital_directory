#!/usr/bin/env python3
"""
Quick status check - see where all profiles are in the workflow
"""

import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("=" * 70)
print("📊 SYSTEM STATUS DASHBOARD")
print("=" * 70)

# Get counts for each status
statuses = {
    'NULL (never touched)': ('null', 'is_'),
    'enrichment_success (found email)': ('enrichment_success', 'eq'),
    'enrichment_failed (no email)': ('enrichment_failed', 'eq'),
    'ready_to_email (approved)': ('ready_to_email', 'eq'),
    'contacted (sent)': ('contacted', 'eq'),
    'unsubscribed': ('unsubscribed', 'eq'),
}

print("\n📋 Profile Status Breakdown:")
print("-" * 70)

total = 0
for label, (status, method) in statuses.items():
    if method == 'is_':
        response = supabase.table('profiles').select("id", count='exact').is_("status", status).execute()
    else:
        response = supabase.table('profiles').select("id", count='exact').eq("status", status).execute()

    count = response.count
    total += count

    # Visual bar
    bar_length = min(50, count // 10) if count > 0 else 0
    bar = "█" * bar_length

    print(f"{label:40} {count:4d}  {bar}")

print("-" * 70)
print(f"{'Total profiles:':40} {total:4d}")

# Show next actions
print("\n" + "=" * 70)
print("📝 NEXT ACTIONS:")
print("=" * 70)

# Check if enrichment can run
null_count = supabase.table('profiles').select("id", count='exact').is_("status", "null").is_("email", "null").execute().count
if null_count > 0:
    print(f"✅ Enrichment ready: {null_count} profiles waiting")
    print("   → Run: python3 enrichment_engine.py")
else:
    print("⚠️  No profiles ready for enrichment")
    print("   → Import more profiles to database")

# Check if review needed
success_count = supabase.table('profiles').select("id", count='exact').eq("status", "enrichment_success").execute().count
if success_count > 0:
    print(f"\n📋 Review needed: {success_count} emails found")
    print("   → Run: python3 review_emails.py")
    print("   → Then: python3 mark_emails_ready.py")
else:
    print("\n✅ No emails awaiting review")

# Check if ready to send
ready_count = supabase.table('profiles').select("id", count='exact').eq("status", "ready_to_email").execute().count
if ready_count > 0:
    print(f"\n🚀 Ready to send: {ready_count} emails approved")
    print("   → Run: python3 supabase_outreach_campaign.py")
else:
    print("\n⏳ No emails ready to send yet")

# Show contacted stats
contacted = supabase.table('profiles').select("id", count='exact').eq("status", "contacted").execute().count
if contacted > 0:
    print(f"\n✅ Emails sent: {contacted} total")

print("\n" + "=" * 70)
