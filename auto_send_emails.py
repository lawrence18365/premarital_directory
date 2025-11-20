#!/usr/bin/env python3
"""
FULLY AUTOMATED EMAIL SENDER VIA RESEND (WITH DAILY LIMITS)
Sends emails marked as 'ready_to_email' with safe daily limits to avoid spam filters.
Implements gradual warm-up strategy for optimal deliverability.
"""

import os
from datetime import datetime, timedelta
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

# Safe daily limits to avoid spam filters (email warm-up schedule)
# Based on 2025 best practices for cold email outreach
DAILY_LIMITS_BY_DAY = {
    1: 20,   # Day 1-2: Start slow
    2: 20,
    3: 30,   # Day 3-4: Small increase
    4: 30,
    5: 40,   # Day 5-7: Building trust
    6: 40,
    7: 40,
    8: 50,   # Week 2
    9: 50,
    10: 50,
    11: 60,  # Day 11-14
    12: 60,
    13: 60,
    14: 60,
    15: 70,  # Week 3
    16: 70,
    17: 70,
    18: 80,
    19: 80,
    20: 80,
    21: 80,
}
DEFAULT_DAILY_LIMIT = 100  # After day 21, use this limit

def get_daily_limit():
    """Get today's sending limit based on warm-up schedule"""
    # Check if we have a campaign start date stored
    try:
        # Try to get the first contacted profile to determine campaign start
        first_contact = supabase.table('profiles') \
            .select('contacted_at') \
            .eq('status', 'contacted') \
            .not_.is_('contacted_at', 'null') \
            .order('contacted_at') \
            .limit(1) \
            .execute()

        if first_contact.data:
            start_date = datetime.fromisoformat(first_contact.data[0]['contacted_at'].replace('Z', '+00:00'))
            days_since_start = (datetime.now(start_date.tzinfo) - start_date).days + 1
            limit = DAILY_LIMITS_BY_DAY.get(days_since_start, DEFAULT_DAILY_LIMIT)
            return limit, days_since_start
    except:
        pass

    # First day of campaign - start with day 1 limit
    return DAILY_LIMITS_BY_DAY[1], 1

def count_emails_sent_today():
    """Count how many emails we've already sent today"""
    try:
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0).isoformat()

        result = supabase.table('profiles') \
            .select('id', count='exact') \
            .eq('status', 'contacted') \
            .gte('contacted_at', today_start) \
            .execute()

        return result.count
    except Exception as e:
        print(f"⚠️  Error counting today's emails: {e}")
        return 0

def create_personalized_email(profile):
    """Create CAN-SPAM compliant personalized email with data-backed approach"""
    full_name = profile.get('full_name', 'there')
    name_parts = full_name.replace('Dr.', '').replace(',', '').strip().split()
    first_name = name_parts[0] if name_parts else 'there'

    city = profile.get('city', 'your area')
    email = profile.get('email', '')

    # Primary subject (data-backed approach)
    subject = f"Couples in {city} are searching for you (High Traffic Alert)"
    # Alternate: f"Question about your practice in {city}"

    body = f"""Hi {first_name},

I'm Haylee, founder of Wedding Counselors.

I'm reaching out because we are seeing a significant spike in couples searching for premarital counseling in {city}, and your name often appears in our internal search data.

To help these couples find you, we've organized your public information into a free professional profile on our directory. Our site just hit 5,000 monthly impressions, and we want to make sure the traffic looking for you is landing on accurate information.

Your profile is already live here:
👉 https://weddingcounselors.com

Is your information correct?
You can claim this profile in one click (it's free forever) to update your bio, photo, or website link. This ensures the couples viewing your profile can contact you directly.

Why claim it?

• Zero Cost: It is free (and always will be for early members).
• SEO Boost: A high-quality backlink to your practice.
• Referrals: We are already seeing inquiries for counselors in {city}.

If you'd like to take over this listing, just reply "Yes" or click the link above. If you're not interested, no worries at all—we can remove it upon request.

Best,

Haylee Mandarino
Founder, Wedding Counselors
haylee@weddingcounselors.com

────────────────────────────────────────────────────────────────────
Need to make changes?
This is a one-time notification.
• Unsubscribe: https://weddingcounselors.com/unsubscribe?email={email}
• Remove Profile: Reply "REMOVE" or visit weddingcounselors.com/remove

Wedding Counselors
11 Wanda Road
Toronto, ON
────────────────────────────────────────────────────────────────────"""

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
    """Automatically send to all ready_to_email profiles (WITH DAILY LIMITS)"""
    print("=" * 70)
    print("🤖 AUTOMATED EMAIL SENDER (WITH SAFE DAILY LIMITS)")
    print("=" * 70)
    print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # Check daily limit and emails sent today
    daily_limit, campaign_day = get_daily_limit()
    emails_sent_today = count_emails_sent_today()
    emails_remaining_today = max(0, daily_limit - emails_sent_today)

    print(f"\n📊 Daily Sending Status:")
    print(f"   Campaign Day: {campaign_day}")
    print(f"   Daily Limit: {daily_limit} emails")
    print(f"   Already Sent Today: {emails_sent_today}")
    print(f"   Remaining Today: {emails_remaining_today}")

    if emails_remaining_today == 0:
        print(f"\n✅ Daily limit reached ({daily_limit} emails sent)")
        print(f"   Come back tomorrow for Day {campaign_day + 1} (limit: {DAILY_LIMITS_BY_DAY.get(campaign_day + 1, DEFAULT_DAILY_LIMIT)} emails)")
        return 0, 0

    # Load profiles ready to email (limit to remaining capacity)
    print(f"\n🔍 Loading up to {emails_remaining_today} profiles...")
    response = supabase.table('profiles') \
        .select("*") \
        .eq("status", "ready_to_email") \
        .not_.is_("email", "null") \
        .limit(emails_remaining_today) \
        .execute()

    profiles = response.data

    if not profiles:
        print("✅ No emails to send (all caught up!)")
        return 0, 0

    print(f"📧 Sending {len(profiles)} emails today (safe warm-up strategy)")

    # Send emails
    print(f"\n🚀 SENDING EMAILS...")
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
    print("🎉 DAILY SENDING COMPLETE!")
    print("=" * 70)
    print(f"✅ Successfully sent: {sent_count}")
    print(f"❌ Failed: {failed_count}")
    if sent_count + failed_count > 0:
        print(f"📈 Success rate: {(sent_count/(sent_count+failed_count)*100):.1f}%")

    # Warm-up progress
    total_sent_to_date = emails_sent_today + sent_count
    print(f"\n📊 WARM-UP PROGRESS:")
    print(f"   Campaign Day: {campaign_day}")
    print(f"   Today's Limit: {daily_limit} emails")
    print(f"   Total Sent Today: {total_sent_to_date}/{daily_limit}")
    next_limit = DAILY_LIMITS_BY_DAY.get(campaign_day + 1, DEFAULT_DAILY_LIMIT)
    print(f"   Tomorrow's Limit: {next_limit} emails")

    # Count remaining profiles
    try:
        remaining = supabase.table('profiles').select('id', count='exact').eq('status', 'ready_to_email').execute()
        print(f"   Remaining Profiles: {remaining.count}")
        if remaining.count > 0:
            days_to_complete = (remaining.count // next_limit) + 1
            print(f"   Est. Days to Complete: {days_to_complete} days")
    except:
        pass

    # Expected results
    if sent_count > 0:
        expected_responses = max(1, int(sent_count * 0.10))
        print(f"\n🎯 EXPECTED RESULTS (from today's {sent_count} emails):")
        print(f"   Responses expected: {expected_responses}-{expected_responses*2} within 24-48 hours")
        print(f"   Peak response time: 6-24 hours")
        print(f"   Directory signups: {max(1, int(expected_responses * 0.3))}-{max(1, int(expected_responses * 0.5))}")

    print(f"\n💡 DELIVERABILITY NOTE:")
    print(f"   Using gradual warm-up to avoid spam filters")
    print(f"   This protects your sender reputation long-term")
    print(f"   All 133 profiles will be contacted safely over ~7-10 days")

    print("=" * 70)

    return sent_count, failed_count

if __name__ == "__main__":
    auto_send_all()
