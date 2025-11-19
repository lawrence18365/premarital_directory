#!/usr/bin/env python3
"""
FULLY AUTOMATED EMAIL SENDER
Sends all emails marked as 'ready_to_email' automatically.
No manual review, no confirmation needed.
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import time
import random
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

# Supabase connection
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Email accounts (rotating for better deliverability)
ACCOUNTS = {
    "lauren": {
        "email": "lauren@weddingcounselors.com",
        "password": "1relandS!"
    },
    "info": {
        "email": "info@weddingcounselors.com",
        "password": "1relandS!"
    },
    "jessie": {
        "email": "jessie@weddingcounselors.com",
        "password": "1relandS!"
    }
}

def create_personalized_email(profile):
    """Create personalized email for counselor"""
    full_name = profile.get('full_name', 'there')
    name_parts = full_name.replace('Dr.', '').replace(',', '').strip().split()
    first_name = name_parts[0] if name_parts else 'there'

    city = profile.get('city', 'your area')

    subject = f"Free directory listing for {city} premarital counselors"

    body = f"""Hi {first_name},

I hope this message finds you well. I came across your practice while researching premarital counseling services in {city}, and I was impressed by your dedication to helping couples prepare for marriage.

I'm Haylee, and I run Wedding Counselors (weddingcounselors.com) - a directory dedicated to helping couples find quality premarital counseling, therapy, and clergy services. We're building a comprehensive resource to connect couples with the right professionals during one of the most important times in their lives.

I'd love to offer you a completely free listing on our directory, which includes:

✓ A professional profile showcasing your expertise and approach
✓ Direct link to your website (excellent for SEO and local search rankings)
✓ Contact information and specialty areas highlighted
✓ No fees, no contracts, and no ongoing commitments required

Many counselors have told us they've seen an uptick in referrals after joining our directory, and it costs absolutely nothing. We believe quality premarital counseling should be easily accessible to couples who need it most.

You can see our directory at: https://weddingcounselors.com

If you're interested, I'd be happy to set up your free listing - it only takes a few minutes. Would you like me to create a profile for your practice?

Warm regards,

Haylee Mandarino
Founder, Wedding Counselors
weddingcounselors.com
haylee@weddingcounselors.com

P.S. If you'd prefer not to receive these opportunities in the future, just reply with "no thank you" and I'll make sure to respect that immediately."""

    return subject, body

def send_email_smtp(profile, from_account):
    """Send email via SMTP"""
    try:
        account_info = ACCOUNTS[from_account]
        subject, body = create_personalized_email(profile)

        msg = MIMEMultipart()
        msg['From'] = f"Haylee - Wedding Counselors <{account_info['email']}>"
        msg['To'] = profile['email']
        msg['Subject'] = subject
        msg['Reply-To'] = "haylee@weddingcounselors.com"

        msg.attach(MIMEText(body, 'plain'))

        # Send via SMTP
        server = smtplib.SMTP_SSL("mail.spacemail.com", 465)
        server.login(account_info['email'], account_info['password'])
        text = msg.as_string()
        server.sendmail(account_info['email'], profile['email'], text)
        server.quit()

        return True, subject

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
    accounts = list(ACCOUNTS.keys())
    account_index = 0
    sent_count = 0
    failed_count = 0

    for i, profile in enumerate(profiles):
        account = accounts[account_index]
        account_index = (account_index + 1) % len(accounts)

        print(f"\n📧 Email {i+1}/{len(profiles)}")
        print(f"   To: {profile.get('full_name')}")
        print(f"   Email: {profile['email']}")
        print(f"   From: {account}@weddingcounselors.com")
        print(f"   Sending...", end="")

        # Send the email
        success, result = send_email_smtp(profile, account)

        if success:
            print(f" ✅ SENT!")

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
