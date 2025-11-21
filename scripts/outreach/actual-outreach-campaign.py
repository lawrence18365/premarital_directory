#!/usr/bin/env python3
"""
ACTUAL Outreach Campaign - Send Real Emails to Premarital Counselors
This will actually send emails and update the prospect database
"""

import csv
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
import time
import random

# Working email accounts
ACCOUNTS = {
    "lauren": {"email": "lauren@weddingcounselors.com", "password": "1relandS!"},
    "info": {"email": "info@weddingcounselors.com", "password": "1relandS!"},
    "jessie": {"email": "jessie@weddingcounselors.com", "password": "1relandS!"}
}

def load_ready_prospects():
    """Load prospects that are ready for outreach"""
    prospects = []
    with open("prospect-tracking.csv", 'r') as file:
        reader = csv.DictReader(file)
        for prospect in reader:
            if prospect.get('Status') == 'Ready':
                prospects.append(prospect)
    return prospects

def create_personalized_email(prospect):
    """Create personalized email for counselor"""
    # Get first name
    name_parts = prospect['Name'].replace('Dr.', '').replace(',', '').strip().split()
    first_name = name_parts[0]
    
    city = prospect['City']
    practice = prospect['Practice_Name']
    
    subject = f"Free directory listing for {city} premarital counselors"
    
    body = f"""Hi {first_name},

I hope this message finds you well. I came across {practice} while researching premarital counseling services in {city}, and I was impressed by your dedication to helping couples prepare for marriage.

I'm Haylee, and I run Wedding Counselors (weddingcounselors.com) - a directory dedicated to helping couples find quality premarital counseling, therapy, and clergy services. We're building a comprehensive resource to connect couples with the right professionals during one of the most important times in their lives.

I'd love to offer you a completely free listing on our directory, which includes:

✓ A professional profile showcasing your expertise and approach
✓ Direct link to your website (excellent for SEO and local search rankings)
✓ Contact information and specialty areas highlighted  
✓ No fees, no contracts, and no ongoing commitments required

Many counselors have told us they've seen an uptick in referrals after joining our directory, and it costs absolutely nothing. We believe quality premarital counseling should be easily accessible to couples who need it most.

You can see our directory at: https://weddingcounselors.com

If you're interested, I'd be happy to set up your free listing - it only takes a few minutes. Would you like me to create a profile for {practice}?

Warm regards,

Haylee Mandarino
Founder, Wedding Counselors
weddingcounselors.com
haylee@weddingcounselors.com

P.S. If you'd prefer not to receive these opportunities in the future, just reply with "no thank you" and I'll make sure to respect that immediately."""
    
    return subject, body

def send_real_email(prospect, from_account):
    """Actually send email to prospect"""
    try:
        account_info = ACCOUNTS[from_account]
        subject, body = create_personalized_email(prospect)
        
        msg = MIMEMultipart()
        msg['From'] = f"Haylee - Wedding Counselors <{account_info['email']}>"
        msg['To'] = prospect['Email']
        msg['Subject'] = subject
        msg['Reply-To'] = "haylee@weddingcounselors.com"
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Actually send the email
        server = smtplib.SMTP_SSL("mail.spacemail.com", 465)
        server.login(account_info['email'], account_info['password'])
        text = msg.as_string()
        server.sendmail(account_info['email'], prospect['Email'], text)
        server.quit()
        
        return True, subject
        
    except Exception as e:
        return False, str(e)

def update_prospect_database(email, status, notes):
    """Update prospect status in database"""
    # Read all prospects
    prospects = []
    with open("prospect-tracking.csv", 'r') as file:
        reader = csv.DictReader(file)
        prospects = list(reader)
    
    # Update the specific prospect
    for prospect in prospects:
        if prospect['Email'].lower() == email.lower():
            prospect['Status'] = status
            prospect['Date'] = datetime.now().strftime('%Y-%m-%d')
            prospect['Template_Used'] = 'Actual Outreach Campaign'
            prospect['Follow_Up_Date'] = (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d')
            prospect['Notes'] = notes
            break
    
    # Write back to file
    with open("prospect-tracking.csv", 'w', newline='') as file:
        fieldnames = prospects[0].keys()
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(prospects)

def run_actual_campaign():
    """Run the actual outreach campaign"""
    print("🚀 LAUNCHING ACTUAL OUTREACH CAMPAIGN")
    print("="*60)
    print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("🎯 Sending real emails to premarital counselors")
    
    # Load prospects
    prospects = load_ready_prospects()
    print(f"📊 Found {len(prospects)} prospects ready for outreach")
    
    if len(prospects) == 0:
        print("❌ No prospects found with 'Ready' status")
        return 0, 0
    
    # Send to first 10 prospects today
    target_count = min(10, len(prospects))
    selected_prospects = prospects[:target_count]
    
    print(f"📧 Targeting {len(selected_prospects)} counselors today:")
    
    # Show who we're emailing
    for i, prospect in enumerate(selected_prospects, 1):
        print(f"   {i}. {prospect['Name']} - {prospect['Practice_Name']} ({prospect['City']}, {prospect['State']})")
    
    print(f"\n🚀 STARTING CAMPAIGN...")
    
    # Send emails
    accounts = list(ACCOUNTS.keys())
    account_index = 0
    sent_count = 0
    failed_count = 0
    
    for i, prospect in enumerate(selected_prospects):
        account = accounts[account_index]
        account_index = (account_index + 1) % len(accounts)
        
        print(f"\n📧 Email {i+1}/{len(selected_prospects)}")
        print(f"   To: {prospect['Name']}")
        print(f"   Email: {prospect['Email']}")
        print(f"   Practice: {prospect['Practice_Name']}")
        print(f"   Location: {prospect['City']}, {prospect['State']}")
        print(f"   From: {account}@weddingcounselors.com")
        print(f"   Sending...", end="")
        
        # Actually send the email
        success, result = send_real_email(prospect, account)
        
        if success:
            print(f" ✅ SENT!")
            print(f"   📋 Subject: {result}")
            
            # Update database
            update_prospect_database(
                prospect['Email'], 
                'Sent',
                f"Campaign email sent via {account}@ on {datetime.now().strftime('%Y-%m-%d %H:%M')}"
            )
            
            sent_count += 1
            
        else:
            print(f" ❌ FAILED!")
            print(f"   Error: {result}")
            failed_count += 1
        
        # Delay between emails (30-90 seconds)
        if i < len(selected_prospects) - 1:
            delay = random.randint(30, 90)
            print(f"   ⏳ Waiting {delay} seconds...")
            time.sleep(delay)
    
    # Results
    print(f"\n🎉 CAMPAIGN COMPLETE!")
    print("="*40)
    print(f"✅ Successfully sent: {sent_count}")
    print(f"❌ Failed: {failed_count}")
    print(f"📈 Success rate: {(sent_count/(sent_count+failed_count)*100):.1f}%")
    
    # Expected results
    if sent_count > 0:
        expected_responses = max(1, int(sent_count * 0.10))
        print(f"\n🎯 EXPECTED RESULTS:")
        print(f"   Responses expected: {expected_responses}-{expected_responses*2} within 24-48 hours")
        print(f"   Peak response time: 6-24 hours")
        print(f"   All replies forwarded to: lawrencebrennan@gmail.com")
    
    # Log campaign
    log_campaign(sent_count, failed_count)
    
    return sent_count, failed_count

def log_campaign(sent, failed):
    """Log campaign results"""
    log_entry = {
        'date': datetime.now().strftime('%Y-%m-%d'),
        'time': datetime.now().strftime('%H:%M:%S'),
        'emails_sent': sent,
        'emails_failed': failed,
        'success_rate': f"{(sent/(sent+failed)*100):.1f}%" if (sent+failed) > 0 else "0%",
        'campaign_type': 'Real Outreach Campaign'
    }
    
    # Write to log
    file_exists = False
    try:
        with open("actual_campaign_log.csv", 'r'):
            file_exists = True
    except FileNotFoundError:
        pass
    
    with open("actual_campaign_log.csv", 'a', newline='') as file:
        fieldnames = ['date', 'time', 'emails_sent', 'emails_failed', 'success_rate', 'campaign_type']
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        
        if not file_exists:
            writer.writeheader()
        
        writer.writerow(log_entry)

def main():
    """Execute the actual campaign"""
    print("🎯 WEDDING COUNSELORS - ACTUAL OUTREACH CAMPAIGN")
    print("This will send REAL emails to premarital counselors")
    print("="*60)
    
    # Run the campaign
    sent, failed = run_actual_campaign()
    
    if sent > 0:
        print(f"\n✅ SUCCESS! {sent} emails actually sent to counselors")
        print(f"📬 Monitor lawrencebrennan@gmail.com for replies")
        print(f"📊 Database updated with send status")
    else:
        print(f"\n⚠️ No emails were sent. Check system configuration.")
    
    return sent > 0

if __name__ == "__main__":
    main()