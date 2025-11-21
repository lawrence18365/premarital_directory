#!/usr/bin/env python3
"""
Continuous Reply Forwarding System
Monitors all accounts and forwards replies to lawrencebrennan@gmail.com
"""

import imaplib
import smtplib
import email
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import time
import json

FORWARD_TO = "lawrencebrennan@gmail.com"
CHECK_INTERVAL = 1800  # 30 minutes

ACCOUNTS = {
    "haylee": {"email": "haylee@weddingcounselors.com", "password": "1relandS!"},
    "lauren": {"email": "lauren@weddingcounselors.com", "password": "1relandS!"},
    "info": {"email": "info@weddingcounselors.com", "password": "1relandS!"},
    "jessie": {"email": "jessie@weddingcounselors.com", "password": "1relandS!"},
    "samantha": {"email": "samantha@weddingcounselors.com", "password": "1relandS!"}
}

def forward_reply(original_email, from_account, to_address=FORWARD_TO):
    """Forward reply to specified address"""
    try:
        msg = MIMEMultipart()
        msg['From'] = f"Wedding Counselors Forwarding <{from_account}>"
        msg['To'] = to_address
        msg['Subject'] = f"[FORWARDED] {original_email.get('Subject', 'No Subject')}"
        
        forward_body = f"""
🔄 FORWARDED REPLY - Wedding Counselors Outreach

Original From: {original_email.get('From', 'Unknown')}
Original To: {from_account}
Date: {original_email.get('Date', 'Unknown')}
Subject: {original_email.get('Subject', 'No Subject')}

--- ORIGINAL MESSAGE ---
{get_email_body(original_email)}

--- END ORIGINAL MESSAGE ---

This reply was automatically forwarded from {from_account}.
Original email is preserved in the {from_account} inbox.

Wedding Counselors Outreach System
{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
"""
        
        msg.attach(MIMEText(forward_body, 'plain'))
        
        server = smtplib.SMTP_SSL("mail.spacemail.com", 465)
        server.login(from_account, ACCOUNTS[from_account.split('@')[0]]["password"])
        server.sendmail(from_account, to_address, msg.as_string())
        server.quit()
        
        return True
    except Exception as e:
        print(f"Failed to forward email: {e}")
        return False

def get_email_body(msg):
    """Extract email body text"""
    body = ""
    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_type() == "text/plain":
                body = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                break
    else:
        body = msg.get_payload(decode=True).decode('utf-8', errors='ignore')
    return body[:1000] + "..." if len(body) > 1000 else body

def check_account_for_replies(account_name, email_address, password):
    """Check one account for new replies"""
    try:
        mail = imaplib.IMAP4_SSL("mail.spacemail.com", 993)
        mail.login(email_address, password)
        mail.select('inbox')
        
        # Search for emails from today
        today = datetime.now().strftime('%d-%b-%Y')
        search_criteria = f'(SINCE "{today}")'
        
        status, messages = mail.search(None, search_criteria)
        
        if status != 'OK':
            return 0
        
        email_ids = messages[0].split()
        forwarded_count = 0
        
        for email_id in email_ids[-10:]:  # Check last 10 emails
            status, msg_data = mail.fetch(email_id, '(RFC822)')
            
            if status != 'OK':
                continue
            
            msg = email.message_from_bytes(msg_data[0][1])
            
            # Skip if this is an outgoing email (sent by us)
            from_email = msg.get('From', '')
            if 'weddingcounselors.com' in from_email:
                continue
            
            # This is an incoming email - forward it
            if forward_reply(msg, email_address):
                forwarded_count += 1
                print(f"✅ Forwarded reply from {from_email} ({account_name}@)")
        
        mail.close()
        mail.logout()
        
        return forwarded_count
        
    except Exception as e:
        print(f"Error checking {account_name}: {e}")
        return 0

def main():
    """Main forwarding loop"""
    print("🔄 Starting Continuous Reply Forwarding")
    print(f"Forwarding all replies to: {FORWARD_TO}")
    print(f"Check interval: {CHECK_INTERVAL//60} minutes")
    print("="*50)
    
    try:
        while True:
            total_forwarded = 0
            
            for account_name, credentials in ACCOUNTS.items():
                forwarded = check_account_for_replies(
                    account_name, 
                    credentials['email'], 
                    credentials['password']
                )
                total_forwarded += forwarded
            
            if total_forwarded > 0:
                print(f"📧 Forwarded {total_forwarded} replies at {datetime.now().strftime('%H:%M:%S')}")
            else:
                print(f"📭 No new replies at {datetime.now().strftime('%H:%M:%S')}")
            
            print(f"😴 Sleeping for {CHECK_INTERVAL//60} minutes...")
            time.sleep(CHECK_INTERVAL)
            
    except KeyboardInterrupt:
        print("\n👋 Forwarding stopped by user")
    except Exception as e:
        print(f"❌ Forwarding error: {e}")

if __name__ == "__main__":
    main()
