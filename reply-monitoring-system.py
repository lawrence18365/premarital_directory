#!/usr/bin/env python3
"""
Centralized Reply Monitoring System
Monitors all email accounts for replies and organizes them
"""

import imaplib
import email
import csv
from datetime import datetime
import time
import re

# Email Account Configuration
IMAP_SERVER = "mail.spacemail.com"
IMAP_PORT = 993

ACCOUNTS = {
    "haylee": {"email": "haylee@weddingcounselors.com", "password": "1relandS!"},
    "lauren": {"email": "lauren@weddingcounselors.com", "password": "1relandS!"},
    "info": {"email": "info@weddingcounselors.com", "password": "1relandS!"},
    "jessie": {"email": "jessie@weddingcounselors.com", "password": "1relandS!"},
    "samantha": {"email": "samantha@weddingcounselors.com", "password": "1relandS!"}
}

class ReplyMonitor:
    def __init__(self):
        self.replies_file = "outreach_replies.csv"
        self.last_check_file = "last_check.txt"
        self.create_replies_file()
    
    def create_replies_file(self):
        """Create CSV file for tracking replies"""
        try:
            with open(self.replies_file, 'x', newline='') as file:
                writer = csv.writer(file)
                writer.writerow([
                    'Date', 'Time', 'Account', 'From_Email', 'From_Name', 
                    'Subject', 'Body_Preview', 'Type', 'Action_Needed', 'Status'
                ])
        except FileExistsError:
            pass  # File already exists
    
    def get_last_check_time(self):
        """Get timestamp of last check"""
        try:
            with open(self.last_check_file, 'r') as file:
                return file.read().strip()
        except FileNotFoundError:
            # First run, check emails from 24 hours ago
            return (datetime.now() - timedelta(days=1)).strftime('%d-%b-%Y')
    
    def save_last_check_time(self):
        """Save current timestamp"""
        with open(self.last_check_file, 'w') as file:
            file.write(datetime.now().strftime('%d-%b-%Y'))
    
    def connect_to_account(self, email, password):
        """Connect to IMAP account"""
        try:
            mail = imaplib.IMAP4_SSL(IMAP_SERVER, IMAP_PORT)
            mail.login(email, password)
            return mail
        except Exception as e:
            print(f"Failed to connect to {email}: {e}")
            return None
    
    def classify_reply(self, subject, body):
        """Classify the type of reply"""
        subject_lower = subject.lower()
        body_lower = body.lower()
        
        # Check for unsubscribes
        unsubscribe_keywords = [
            'unsubscribe', 'remove me', 'take me off', 'stop emailing',
            'not interested', 'remove from list', 'opt out'
        ]
        
        if any(keyword in body_lower for keyword in unsubscribe_keywords):
            return "Unsubscribe"
        
        # Check for positive responses
        positive_keywords = [
            'interested', 'yes', 'sounds good', 'tell me more',
            'how do i', 'sign up', 'join', 'add me', 'listing'
        ]
        
        if any(keyword in body_lower for keyword in positive_keywords):
            return "Positive"
        
        # Check for questions
        question_keywords = ['how', 'what', 'when', 'where', 'why', '?']
        
        if any(keyword in body_lower for keyword in question_keywords):
            return "Question"
        
        # Check for negative responses
        negative_keywords = [
            'not interested', 'no thank', 'already have', 'not looking',
            'not needed', 'pass', 'decline'
        ]
        
        if any(keyword in body_lower for keyword in negative_keywords):
            return "Negative"
        
        return "General"
    
    def get_action_needed(self, reply_type, body):
        """Determine what action is needed"""
        if reply_type == "Unsubscribe":
            return "URGENT: Process unsubscribe immediately"
        elif reply_type == "Positive":
            return "HIGH: Send directory signup link"
        elif reply_type == "Question":
            return "MEDIUM: Answer questions about directory"
        elif reply_type == "Negative":
            return "LOW: Log as not interested, no follow-up"
        else:
            return "MEDIUM: Review and respond appropriately"
    
    def extract_body_preview(self, msg):
        """Extract first 200 characters of email body"""
        body = ""
        
        if msg.is_multipart():
            for part in msg.walk():
                if part.get_content_type() == "text/plain":
                    body = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                    break
        else:
            body = msg.get_payload(decode=True).decode('utf-8', errors='ignore')
        
        # Clean up body text
        body = re.sub(r'\n\s*\n', ' ', body)  # Remove double newlines
        body = re.sub(r'\s+', ' ', body)      # Remove extra spaces
        
        return body[:200] + "..." if len(body) > 200 else body
    
    def check_account_replies(self, account_name, email_address, password):
        """Check one email account for new replies"""
        mail = self.connect_to_account(email_address, password)
        if not mail:
            return []
        
        try:
            mail.select('inbox')
            
            # Search for emails since last check
            since_date = self.get_last_check_time()
            search_criteria = f'(SINCE "{since_date}")'
            
            status, messages = mail.search(None, search_criteria)
            
            if status != 'OK':
                return []
            
            email_ids = messages[0].split()
            replies = []
            
            for email_id in email_ids[-50:]:  # Check last 50 emails max
                status, msg_data = mail.fetch(email_id, '(RFC822)')
                
                if status != 'OK':
                    continue
                
                msg = email.message_from_bytes(msg_data[0][1])
                
                # Skip if this is an outgoing email (sent by us)
                from_email = msg.get('From', '')
                if 'weddingcounselors.com' in from_email:
                    continue
                
                # Extract email details
                subject = msg.get('Subject', 'No Subject')
                from_name = email.utils.parseaddr(from_email)[0] or from_email
                body_preview = self.extract_body_preview(msg)
                
                # Classify the reply
                reply_type = self.classify_reply(subject, body_preview)
                action_needed = self.get_action_needed(reply_type, body_preview)
                
                reply_data = {
                    'date': datetime.now().strftime('%Y-%m-%d'),
                    'time': datetime.now().strftime('%H:%M:%S'),
                    'account': account_name,
                    'from_email': email.utils.parseaddr(from_email)[1] or from_email,
                    'from_name': from_name,
                    'subject': subject,
                    'body_preview': body_preview,
                    'type': reply_type,
                    'action_needed': action_needed,
                    'status': 'New'
                }
                
                replies.append(reply_data)
            
            mail.close()
            mail.logout()
            
            return replies
        
        except Exception as e:
            print(f"Error checking {email_address}: {e}")
            return []
    
    def save_replies(self, replies):
        """Save replies to CSV file"""
        if not replies:
            return
        
        with open(self.replies_file, 'a', newline='') as file:
            writer = csv.writer(file)
            for reply in replies:
                writer.writerow([
                    reply['date'], reply['time'], reply['account'],
                    reply['from_email'], reply['from_name'], reply['subject'],
                    reply['body_preview'], reply['type'], reply['action_needed'], reply['status']
                ])
    
    def check_all_accounts(self):
        """Check all email accounts for replies"""
        print("🔍 Checking all accounts for replies...")
        
        all_replies = []
        
        for account_name, credentials in ACCOUNTS.items():
            print(f"   Checking {account_name}@weddingcounselors.com...")
            replies = self.check_account_replies(
                account_name, 
                credentials['email'], 
                credentials['password']
            )
            all_replies.extend(replies)
            time.sleep(1)  # Be nice to the server
        
        if all_replies:
            self.save_replies(all_replies)
            print(f"✅ Found {len(all_replies)} new replies")
            self.display_reply_summary(all_replies)
        else:
            print("📭 No new replies found")
        
        self.save_last_check_time()
    
    def display_reply_summary(self, replies):
        """Display summary of replies by type"""
        if not replies:
            return
        
        # Count by type
        type_counts = {}
        for reply in replies:
            reply_type = reply['type']
            type_counts[reply_type] = type_counts.get(reply_type, 0) + 1
        
        print("\n" + "="*60)
        print("📬 NEW REPLIES SUMMARY")
        print("="*60)
        
        for reply_type, count in sorted(type_counts.items()):
            print(f"{reply_type}: {count} replies")
        
        print("\n🚨 URGENT ACTIONS NEEDED:")
        urgent_replies = [r for r in replies if 'URGENT' in r['action_needed']]
        for reply in urgent_replies:
            print(f"   • {reply['from_email']}: {reply['action_needed']}")
        
        print("\n⭐ HIGH PRIORITY:")
        high_replies = [r for r in replies if 'HIGH' in r['action_needed']]
        for reply in high_replies:
            print(f"   • {reply['from_name']} ({reply['from_email']}): {reply['type']}")
        
        print(f"\n📄 Full details saved to: {self.replies_file}")
        print("="*60)
    
    def get_reply_stats(self):
        """Get overall reply statistics"""
        try:
            with open(self.replies_file, 'r') as file:
                reader = csv.DictReader(file)
                replies = list(reader)
            
            if not replies:
                return {"total": 0, "today": 0, "by_type": {}}
            
            today = datetime.now().strftime('%Y-%m-%d')
            today_replies = [r for r in replies if r['Date'] == today]
            
            # Count by type
            type_counts = {}
            for reply in replies:
                reply_type = reply['Type']
                type_counts[reply_type] = type_counts.get(reply_type, 0) + 1
            
            return {
                "total": len(replies),
                "today": len(today_replies),
                "by_type": type_counts
            }
        
        except FileNotFoundError:
            return {"total": 0, "today": 0, "by_type": {}}
    
    def show_recent_replies(self, limit=10):
        """Show most recent replies"""
        try:
            with open(self.replies_file, 'r') as file:
                reader = csv.DictReader(file)
                replies = list(reader)
            
            if not replies:
                print("No replies found.")
                return
            
            print(f"\n📨 LAST {min(limit, len(replies))} REPLIES:")
            print("="*80)
            
            for reply in replies[-limit:]:
                print(f"🕐 {reply['Date']} {reply['Time']} | {reply['Account']}@")
                print(f"👤 {reply['From_Name']} ({reply['From_Email']})")
                print(f"📋 Type: {reply['Type']} | Action: {reply['Action_Needed']}")
                print(f"💬 \"{reply['Body_Preview'][:100]}...\"")
                print("-" * 80)
        
        except FileNotFoundError:
            print("No replies file found. Run reply check first.")

def main():
    """Main function for reply monitoring"""
    monitor = ReplyMonitor()
    
    print("Reply Monitoring System")
    print("="*40)
    print("1. Check all accounts for new replies")
    print("2. View recent replies")
    print("3. Show reply statistics")
    print("4. Continuous monitoring (every 30 minutes)")
    print("5. Exit")
    
    choice = input("\nSelect option (1-5): ").strip()
    
    if choice == "1":
        monitor.check_all_accounts()
    
    elif choice == "2":
        limit = input("How many recent replies to show (default 10): ").strip()
        limit = int(limit) if limit.isdigit() else 10
        monitor.show_recent_replies(limit)
    
    elif choice == "3":
        stats = monitor.get_reply_stats()
        print(f"\n📊 REPLY STATISTICS:")
        print(f"Total replies: {stats['total']}")
        print(f"Replies today: {stats['today']}")
        print(f"\nBy type:")
        for reply_type, count in stats['by_type'].items():
            print(f"  {reply_type}: {count}")
    
    elif choice == "4":
        print("🔄 Starting continuous monitoring (Ctrl+C to stop)...")
        try:
            while True:
                monitor.check_all_accounts()
                print(f"😴 Sleeping for 30 minutes... (Next check at {datetime.now() + timedelta(minutes=30)})")
                time.sleep(1800)  # 30 minutes
        except KeyboardInterrupt:
            print("\n👋 Monitoring stopped.")
    
    elif choice == "5":
        print("Goodbye!")
    
    else:
        print("Invalid option!")

if __name__ == "__main__":
    main()