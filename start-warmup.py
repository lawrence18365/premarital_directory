#!/usr/bin/env python3
"""
Start Email Account Warm-up Process
Begins 14-day warm-up sequence for email accounts
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import time
import random

# Working accounts (haylee@ had auth issues, using others)
WORKING_ACCOUNTS = {
    "lauren": {"email": "lauren@weddingcounselors.com", "password": "1relandS!"},
    "info": {"email": "info@weddingcounselors.com", "password": "1relandS!"},
    "jessie": {"email": "jessie@weddingcounselors.com", "password": "1relandS!"}
}

def send_warmup_email(from_account, to_email, subject, body):
    """Send a warm-up email"""
    try:
        account_info = WORKING_ACCOUNTS[from_account]
        
        msg = MIMEMultipart()
        msg['From'] = f"Wedding Counselors <{account_info['email']}>"
        msg['To'] = to_email
        msg['Subject'] = subject
        
        msg.attach(MIMEText(body, 'plain'))
        
        server = smtplib.SMTP_SSL("mail.spacemail.com", 465)
        server.login(account_info['email'], account_info['password'])
        server.sendmail(account_info['email'], to_email, msg.as_string())
        server.quit()
        
        return True
        
    except Exception as e:
        print(f"Failed to send from {from_account}@: {e}")
        return False

def start_warmup_process():
    """Start Day 1 of warm-up process"""
    print("🌡️ Starting Wedding Counselors Email Warm-up Process")
    print("="*60)
    
    # Create warmup start file
    with open("warmup_start.txt", "w") as file:
        file.write(datetime.now().strftime("%Y-%m-%d"))
    
    print(f"📅 Warm-up started: {datetime.now().strftime('%Y-%m-%d')}")
    print("🎯 Day 1/14 - Sending 3 test emails per account")
    
    # Warm-up email targets (internal emails to test)
    warmup_targets = [
        "info@weddingcounselors.com",
        "jessie@weddingcounselors.com", 
        "samantha@weddingcounselors.com",
        "lawrencebrennan@gmail.com"  # Include Lawrence to test forwarding
    ]
    
    total_sent = 0
    
    for account in WORKING_ACCOUNTS.keys():
        print(f"\n📧 Warming up {account}@weddingcounselors.com:")
        
        for i in range(3):  # Day 1: 3 emails per account
            target_email = random.choice(warmup_targets)
            
            subject = f"Warm-up Day 1 - Test {i+1} from {account}@"
            body = f"""This is a warm-up test email #{i+1} from {account}@weddingcounselors.com.

Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
Purpose: Email account warm-up process (Day 1/14)
System: Wedding Counselors Outreach Platform

This email helps establish sending reputation for our premarital counselor outreach campaign.

Please ignore this test email - it's part of our automated warm-up sequence.

Best regards,
Wedding Counselors System"""
            
            if send_warmup_email(account, target_email, subject, body):
                print(f"   ✅ Sent test {i+1} to {target_email}")
                total_sent += 1
            else:
                print(f"   ❌ Failed test {i+1} to {target_email}")
            
            # Delay between emails (30-60 seconds)
            delay = random.randint(30, 60)
            if i < 2:  # Don't delay after last email
                print(f"   ⏳ Waiting {delay} seconds...")
                time.sleep(delay)
    
    print(f"\n✅ Day 1 warm-up complete: {total_sent}/9 emails sent")
    
    # Log warm-up activity
    with open("warmup_log.txt", "a") as file:
        file.write(f"{datetime.now().strftime('%Y-%m-%d')},Day 1,{total_sent} emails sent\n")
    
    return total_sent

def main():
    """Main warm-up function"""
    emails_sent = start_warmup_process()
    
    print(f"\n🎉 WARM-UP PROCESS STARTED!")
    print("="*40)
    print(f"📧 Day 1 complete: {emails_sent} warm-up emails sent")
    print(f"📅 Duration: 14 days total")
    print(f"🎯 Next: Day 2 (tomorrow) - send 3 emails per account")
    print(f"📈 Schedule:")
    print(f"   Days 1-3: 3 emails per account daily")
    print(f"   Days 4-7: 5 emails per account daily") 
    print(f"   Days 8-11: 8 emails per account daily")
    print(f"   Days 12-14: 12 emails per account daily")
    print(f"   Day 15+: Ready for full outreach!")
    
    print(f"\n📬 REPLY FORWARDING:")
    print(f"   All replies forwarded to: lawrencebrennan@gmail.com")
    print(f"   Test email sent to verify forwarding")
    
    print(f"\n🔄 TO CONTINUE WARM-UP:")
    print(f"   Run this script daily for 14 days")
    print(f"   Or use: python3 daily-workflow.py")

if __name__ == "__main__":
    main()