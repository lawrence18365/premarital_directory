#!/usr/bin/env python3
"""
SAFETY VALVE: Manual Email Quality Review
Export enriched emails to CSV for the "Eyeball Test" before sending

Usage:
  1. Let enrichment run for 2-3 days
  2. Run this script: python3 review_emails.py
  3. Open emails_for_review.csv
  4. Delete any spam/bad emails (admin@wix.com, etc.)
  5. Save the cleaned CSV
  6. Run: python3 import_reviewed_emails.py (to update DB with clean list)
"""

import os
import csv
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def export_emails_for_review():
    """Export all profiles with emails to CSV for manual review"""
    print("=" * 70)
    print("📋 EXPORTING EMAILS FOR MANUAL REVIEW")
    print("=" * 70)

    # Get all profiles with emails
    response = supabase.table('profiles').select("*").not_.is_("email", "null").execute()

    profiles = response.data
    print(f"\n✅ Found {len(profiles)} profiles with emails")

    if not profiles:
        print("❌ No profiles with emails found. Run enrichment_engine.py first.")
        return

    # Create CSV
    filename = f"emails_for_review_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

    with open(filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)

        # Header
        writer.writerow([
            'ID',
            'Name',
            'Email',
            'City',
            'State',
            'Website',
            'Quality_Flag',
            'Notes',
            'Keep_or_Delete'
        ])

        # Data rows
        for profile in profiles:
            email = profile.get('email', '')

            # Auto-flag suspicious emails
            suspicious_keywords = [
                'wix', 'wordpress', 'squarespace', 'weebly',
                'support@', 'noreply@', 'admin@wix', 'hello@theme',
                'sentry', 'template', 'envato'
            ]

            quality_flag = "⚠️  SUSPICIOUS" if any(word in email.lower() for word in suspicious_keywords) else "✅ OK"

            writer.writerow([
                profile.get('id', ''),
                profile.get('full_name', ''),
                email,
                profile.get('city', ''),
                profile.get('state_province', ''),
                profile.get('website', ''),
                quality_flag,
                '',  # Empty notes column for user to fill
                'KEEP'  # Default to KEEP, user changes to DELETE if bad
            ])

    print(f"\n✅ Exported to: {filename}")
    print("\n" + "=" * 70)
    print("📝 NEXT STEPS - THE 'EYEBALL TEST':")
    print("=" * 70)
    print(f"1. Open {filename} in Excel/Numbers/Google Sheets")
    print("2. Review the 'Quality_Flag' column")
    print("3. Manually check any ⚠️  SUSPICIOUS emails")
    print("4. Change 'Keep_or_Delete' to 'DELETE' for bad emails")
    print("5. Add notes if needed")
    print("6. Save the file")
    print("\n💡 Look for:")
    print("   ❌ admin@wix.com, support@wordpress.com, etc.")
    print("   ❌ Theme template emails (hello@themenectar.com)")
    print("   ❌ Generic hosting emails")
    print("   ✅ Personal emails (firstname@domain.com)")
    print("   ✅ Practice emails (contact@practicename.com)")
    print("\n" + "=" * 70)

    # Show statistics
    suspicious_count = sum(1 for p in profiles if any(
        word in p.get('email', '').lower()
        for word in ['wix', 'wordpress', 'squarespace', 'support@', 'noreply@', 'sentry', 'template']
    ))

    print(f"\n📊 EMAIL QUALITY STATS:")
    print(f"   Total emails: {len(profiles)}")
    print(f"   Auto-flagged suspicious: {suspicious_count}")
    print(f"   Likely clean: {len(profiles) - suspicious_count}")
    print(f"   Estimated good rate: {((len(profiles) - suspicious_count) / len(profiles) * 100):.0f}%")

    print("\n✅ Review complete. Clean the CSV before sending emails!")
    print("=" * 70)

    return filename

if __name__ == "__main__":
    export_emails_for_review()
