#!/usr/bin/env python3
"""
FULLY AUTOMATED EMAIL SENDER VIA RESEND
Sends all emails marked as 'ready_to_email' automatically.
No manual review, no confirmation needed.
"""

import os
from datetime import datetime
import time
import random
from dotenv import load_dotenv
from supabase import create_client
import resend

load_dotenv()

# Supabase connection
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
RESEND_API_KEY = os.environ.get("RESEND_API_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
resend.api_key = RESEND_API_KEY

# From email addresses (Resend rotates automatically)
FROM_EMAILS = [
    "Haylee - Wedding Counselors <haylee@weddingcounselors.com>",
    "Lauren - Wedding Counselors <lauren@weddingcounselors.com>",
    "Jessie - Wedding Counselors <jessie@weddingcounselors.com>"
]

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

def send_email_resend(profile, from_email):
    """Send email via Resend API"""
    try:
        subject, body = create_personalized_email(profile)

        params = {
            "from": from_email,
            "to": [profile['email']],
            "subject": subject,
            "text": body,
            "reply_to": "haylee@weddingcounselors.com"
        }

        result = resend.Emails.send(params)

        return True, result.get('id')

    except Exception as e:
        return False, str(e)

def auto_send_all():
    """Automatically send to all ready_to_email profiles"""
    print("=" * 70)
    print("🤖 FULLY AUTOMATED EMAIL SENDER")
    print("=" * 70)
    print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # Load all profiles ready to email
    print(f"\n🔍 Loading profiles with status='ready_to_email'...")
    response = supabase.table('profiles') \
        .select("*") \
        .eq("status", "ready_to_email") \
        .not_.is_("email", "null") \
        .execute()

    profiles = response.data

    if not profiles:
        print("✅ No emails to send (all caught up!)")
        return 0, 0

    print(f"📧 Found {len(profiles)} emails ready to send")

    # Send emails
    print(f"\n🚀 SENDING EMAILS AUTOMATICALLY...")
    email_index = 0
    sent_count = 0
    failed_count = 0

    for i, profile in enumerate(profiles):
        from_email = FROM_EMAILS[email_index]
        email_index = (email_index + 1) % len(FROM_EMAILS)

        print(f"\n📧 Email {i+1}/{len(profiles)}")
        print(f"   To: {profile.get('full_name')}")
        print(f"   Email: {profile['email']}")
        print(f"   From: {from_email}")
        print(f"   Sending...", end="")

        # Send the email
        success, result = send_email_resend(profile, from_email)

        if success:
            print(f" ✅ SENT!")
            print(f"   📧 Resend ID: {result}")

            # Update status in Supabase
            try:
                supabase.table('profiles').update({
                    "status": "contacted",
                    "contacted_at": datetime.now().isoformat()
                }).eq("id", profile['id']).execute()
                sent_count += 1
            except Exception as e:
                print(f"   ⚠️  DB update failed: {e}")
                failed_count += 1

        else:
            print(f" ❌ FAILED!")
            print(f"   Error: {result}")
            failed_count += 1

        # Delay between emails (30-90 seconds for natural pattern)
        if i < len(profiles) - 1:
            delay = random.randint(30, 90)
            print(f"   ⏳ Waiting {delay} seconds...")
            time.sleep(delay)

    # Results
    print(f"\n" + "=" * 70)
    print("🎉 AUTOMATED SENDING COMPLETE!")
    print("=" * 70)
    print(f"✅ Successfully sent: {sent_count}")
    print(f"❌ Failed: {failed_count}")
    if sent_count + failed_count > 0:
        print(f"📈 Success rate: {(sent_count/(sent_count+failed_count)*100):.1f}%")

    # Expected results
    if sent_count > 0:
        expected_responses = max(1, int(sent_count * 0.10))
        print(f"\n🎯 EXPECTED RESULTS:")
        print(f"   Responses expected: {expected_responses}-{expected_responses*2} within 24-48 hours")
        print(f"   Peak response time: 6-24 hours")
        print(f"   Directory signups: {max(1, int(expected_responses * 0.3))}-{max(1, int(expected_responses * 0.5))}")

    print("=" * 70)

    return sent_count, failed_count

if __name__ == "__main__":
    auto_send_all()
