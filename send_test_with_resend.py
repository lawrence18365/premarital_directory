#!/usr/bin/env python3
"""
Send ONE test email using Resend API to verify the system works end-to-end
"""

import os
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client
import resend

load_dotenv()

# Setup
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
RESEND_API_KEY = os.environ.get("RESEND_API_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
resend.api_key = RESEND_API_KEY

def create_personalized_email(profile):
    """Create personalized email for counselor"""
    full_name = profile.get('full_name', 'there')
    name_parts = full_name.replace('Dr.', '').replace(',', '').strip().split()
    first_name = name_parts[0] if name_parts else 'there'

    city = profile.get('city', 'your area')

    subject = f"Your profile is live on Wedding Counselors (5K+ monthly impressions)"

    body = f"""Hi {first_name},

Great news! Your practice is now featured on Wedding Counselors (weddingcounselors.com) - a fast-growing directory that's already reaching 5,000+ couples per month searching for premarital counseling in {city} and beyond.

We've created a professional profile for your practice that's now live and visible to engaged couples searching for quality premarital services. In just 3 months, we've grown to nearly 5,000 impressions, and counselors on our platform are already seeing increased referrals.

Here's what we've set up for you (completely free):

✓ A professional profile showcasing your services
✓ Direct link to your website for better SEO and local search rankings
✓ Contact information and location details
✓ Visibility to thousands of engaged couples actively searching for help
✓ Zero fees, no contracts, no ongoing commitments

CLAIM YOUR PROFILE: Simply reply to this email or visit weddingcounselors.com to claim and customize your listing. You can add more details about your approach, specialties, and what makes your practice unique.

We've seen counselors get their first referrals within days of claiming their profiles. With our current growth trajectory and the couples actively searching our directory, this is a great opportunity to expand your reach at no cost.

Ready to claim your profile? Just hit reply and let me know, or visit the site directly.

Warm regards,

Haylee Mandarino
Founder, Wedding Counselors
weddingcounselors.com
haylee@weddingcounselors.com

P.S. Your profile is already live and searchable. Claiming it takes just 2 minutes and lets you control exactly how you're presented to potential clients. If you'd prefer to be removed from our directory instead, just reply with "remove" and I'll take care of it immediately."""

    return subject, body

def send_test_email():
    """Send one test email via Resend"""
    print("=" * 70)
    print("🧪 SENDING TEST EMAIL VIA RESEND")
    print("=" * 70)
    print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # Get ONE profile to test with
    print(f"\n🔍 Loading one test profile...")
    response = supabase.table('profiles') \
        .select("*") \
        .eq("status", "ready_to_email") \
        .not_.is_("email", "null") \
        .limit(1) \
        .execute()

    if not response.data:
        print("❌ No profiles found with status='ready_to_email'")
        return False

    profile = response.data[0]

    print(f"\n📧 Test Email Details:")
    print(f"   To: {profile.get('full_name')}")
    print(f"   Email: {profile['email']}")
    print(f"   City: {profile.get('city')}, {profile.get('state_province')}")
    print(f"   From: haylee@weddingcounselors.com")

    # Confirm before sending
    print(f"\n⚠️  This will send a REAL email to: {profile['email']}")
    confirm = input("Type 'YES' to send test email: ")

    if confirm != "YES":
        print("❌ Test cancelled")
        return False

    # Create and send email via Resend
    try:
        subject, body = create_personalized_email(profile)

        print(f"\n🚀 Sending via Resend API...")

        params = {
            "from": "Haylee - Wedding Counselors <haylee@weddingcounselors.com>",
            "to": [profile['email']],
            "subject": subject,
            "text": body,
            "reply_to": "haylee@weddingcounselors.com"
        }

        result = resend.Emails.send(params)

        print(f"   ✅ Email sent!")
        print(f"   📧 Resend ID: {result.get('id')}")

        # Update status in Supabase
        print(f"\n   💾 Updating database status...")
        supabase.table('profiles').update({
            "status": "contacted",
            "contacted_at": datetime.now().isoformat()
        }).eq("id", profile['id']).execute()
        print(f"   ✅ Status updated to 'contacted'")

        print(f"\n" + "=" * 70)
        print("🎉 TEST EMAIL SENT SUCCESSFULLY!")
        print("=" * 70)
        print(f"📧 Subject: {subject}")
        print(f"📬 Check haylee@weddingcounselors.com for any replies")
        print(f"🆔 Resend Email ID: {result.get('id')}")
        print("=" * 70)

        return True

    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        print(f"\nFull error details:")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    send_test_email()
