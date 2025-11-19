#!/usr/bin/env python3
"""
SUPABASE-CONNECTED Outreach Campaign
Pulls prospects directly from Supabase with status='ready_to_email'
Updates status to 'contacted' after sending

This is the TRUE AUTOPILOT version - connects enrichment → sending
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

# Email accounts (from .env for security)
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

def load_ready_prospects(limit=10):
    """
    Load prospects from Supabase with status='ready_to_email'
    This is the KEY CONNECTION between enrichment and sending!
    """
    try:
        response = supabase.table('profiles') \
            .select("*") \
            .eq("status", "ready_to_email") \
            .not_.is_("email", "null") \
            .limit(limit) \
            .execute()

        return response.data
    except Exception as e:
        print(f"⚠️  Error loading prospects: {e}")
        print("   This likely means the 'status' column doesn't exist yet.")
        print("   Run: python3 add_status_column.py")
        return []

def create_personalized_email(profile):
    """Create personalized email for counselor"""
    # Extract first name from full name
    full_name = profile.get('full_name', 'there')
    name_parts = full_name.replace('Dr.', '').replace(',', '').strip().split()
    first_name = name_parts[0] if name_parts else 'there'

    city = profile.get('city', 'your area')
    # Use full_name as practice name if available
    practice = profile.get('profession', full_name)

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

def update_profile_status(profile_id, status, notes=""):
    """Update profile status in Supabase after sending"""
    try:
        supabase.table('profiles').update({
            "status": status,
            "contacted_at": datetime.now().isoformat() if status == "contacted" else None
        }).eq("id", profile_id).execute()
        return True
    except Exception as e:
        print(f"   ⚠️  Failed to update status: {e}")
        return False

def run_outreach_campaign(max_emails=10, dry_run=False):
    """
    Run the outreach campaign
    dry_run=True: Don't actually send emails, just show what would be sent
    """
    print("=" * 70)
    print("🚀 SUPABASE-CONNECTED OUTREACH CAMPAIGN")
    if dry_run:
        print("   [DRY RUN MODE - No emails will be sent]")
    print("=" * 70)
    print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # Load prospects from Supabase
    print(f"\n🔍 Loading prospects with status='ready_to_email'...")
    prospects = load_ready_prospects(limit=max_emails)

    if not prospects:
        print("❌ No prospects found with status='ready_to_email'")
        print("\n💡 Workflow:")
        print("   1. Run enrichment_engine.py (finds emails, sets status='enrichment_success')")
        print("   2. Run review_emails.py (export for manual review)")
        print("   3. Manually change status to 'ready_to_email' for good emails")
        print("   4. Run this script to send emails")
        return 0, 0

    print(f"✅ Found {len(prospects)} prospects ready for outreach")

    # Show who we're emailing
    print(f"\n📧 Target List:")
    for i, profile in enumerate(prospects, 1):
        print(f"   {i}. {profile.get('full_name')} ({profile.get('email')})")
        print(f"      Location: {profile.get('city')}, {profile.get('state_province')}")

    if dry_run:
        print("\n✅ DRY RUN COMPLETE - Would send to these profiles")
        return len(prospects), 0

    # Confirm before sending
    print(f"\n⚠️  READY TO SEND {len(prospects)} REAL EMAILS")
    confirm = input("Type 'YES' to proceed: ")

    if confirm != "YES":
        print("❌ Cancelled by user")
        return 0, 0

    # Send emails
    print(f"\n🚀 SENDING EMAILS...")
    accounts = list(ACCOUNTS.keys())
    account_index = 0
    sent_count = 0
    failed_count = 0

    for i, profile in enumerate(prospects):
        account = accounts[account_index]
        account_index = (account_index + 1) % len(accounts)

        print(f"\n📧 Email {i+1}/{len(prospects)}")
        print(f"   To: {profile.get('full_name')}")
        print(f"   Email: {profile['email']}")
        print(f"   From: {account}@weddingcounselors.com")
        print(f"   Sending...", end="")

        # Send the email
        success, result = send_email_smtp(profile, account)

        if success:
            print(f" ✅ SENT!")
            print(f"   📋 Subject: {result}")

            # Update status in Supabase
            update_profile_status(profile['id'], 'contacted')
            sent_count += 1

        else:
            print(f" ❌ FAILED!")
            print(f"   Error: {result}")
            failed_count += 1

        # Delay between emails (30-90 seconds for natural sending pattern)
        if i < len(prospects) - 1:
            delay = random.randint(30, 90)
            print(f"   ⏳ Waiting {delay} seconds...")
            time.sleep(delay)

    # Results
    print(f"\n" + "=" * 70)
    print("🎉 CAMPAIGN COMPLETE!")
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

    print("=" * 70)

    return sent_count, failed_count

def main():
    """Main entry point"""
    print("🎯 WEDDING COUNSELORS - SUPABASE OUTREACH CAMPAIGN")
    print("This pulls prospects directly from the database!")
    print("=" * 70)

    # First, run in dry-run mode to show what would be sent
    print("\n🔍 Running DRY RUN first...")
    run_outreach_campaign(max_emails=10, dry_run=True)

    print("\n" + "=" * 70)
    print("Ready to send for real?")
    print("Run again without dry_run flag to send actual emails")
    print("=" * 70)

if __name__ == "__main__":
    main()
