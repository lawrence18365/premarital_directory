#!/usr/bin/env python3
"""
Daily Email Outreach Script for Wedding Counselors Directory
Simple script to manage daily outreach tracking and reminders
"""

import csv
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
import os

# Email Configuration
SMTP_SERVER = "mail.spacemail.com"
SMTP_PORT = 465  # SSL port
EMAIL_ACCOUNTS = {
    "haylee": {
        "email": "haylee@weddingcounselors.com",
        "password": "1relandS!",
        "daily_limit": 20
    },
    "lauren": {
        "email": "lauren@weddingcounselors.com", 
        "password": "1relandS!",
        "daily_limit": 20
    },
    "info": {
        "email": "info@weddingcounselors.com",
        "password": "1relandS!", 
        "daily_limit": 15
    },
    "jessie": {
        "email": "jessie@weddingcounselors.com",
        "password": "1relandS!",
        "daily_limit": 15
    },
    "samantha": {
        "email": "samantha@weddingcounselors.com",
        "password": "1relandS!",
        "daily_limit": 10
    }
}

# Email Templates
TEMPLATES = {
    1: {
        "subject": "Free directory listing for {city} premarital counselors",
        "body": """Hi {first_name},

I found your practice while researching premarital counseling services in {city}. Your approach to helping couples really stood out.

I run Wedding Counselors (weddingcounselors.com) - a directory helping couples find quality premarital counseling. I'd like to offer you a completely free listing that includes:

✓ Professional profile with your bio & services
✓ Direct link to your website (great for SEO)
✓ No fees, contracts, or hidden costs

Many counselors see increased referrals within weeks of joining. Would you be interested in a free listing?

I can set this up in under 10 minutes if you'd like.

Best regards,
Haylee Mandarino
Wedding Counselors Directory
hello@weddingcounselors.com

---
If you'd prefer not to receive these opportunities, reply with "unsubscribe\""""
    },
    2: {
        "subject": "Re: Free directory listing opportunity",
        "body": """Hi {first_name},

I reached out last week about a free listing on our premarital counseling directory.

Since launching, we've helped hundreds of counselors increase their online visibility and client referrals at zero cost.

The setup takes just a few minutes, and there's genuinely no catch - we believe quality counselors should be easy for couples to find.

If you're interested, just reply and I'll get you set up today.

Best,
Haylee Mandarino
Wedding Counselors Directory

---
Not interested? Reply "unsubscribe" and I'll remove you from our list."""
    }
}

class OutreachManager:
    def __init__(self, csv_file="prospect-tracking.csv"):
        self.csv_file = csv_file
        self.today = datetime.now().date()
        
    def load_prospects(self):
        """Load prospects from CSV file"""
        prospects = []
        try:
            with open(self.csv_file, 'r') as file:
                reader = csv.DictReader(file)
                prospects = list(reader)
        except FileNotFoundError:
            print(f"Creating new tracking file: {self.csv_file}")
            self.create_csv_headers()
        return prospects
    
    def create_csv_headers(self):
        """Create CSV with proper headers"""
        headers = ['Date', 'Name', 'Practice_Name', 'Email', 'City', 'State', 
                  'Website', 'Specialties', 'Template_Used', 'Status', 
                  'Response_Date', 'Follow_Up_Date', 'Notes', 'Signed_Up']
        
        with open(self.csv_file, 'w', newline='') as file:
            writer = csv.DictWriter(file, fieldnames=headers)
            writer.writeheader()
    
    def get_daily_stats(self):
        """Get today's outreach statistics"""
        prospects = self.load_prospects()
        today_str = self.today.strftime('%Y-%m-%d')
        
        sent_today = len([p for p in prospects if p['Date'] == today_str])
        total_prospects = len(prospects)
        responses = len([p for p in prospects if p['Response_Date']])
        signups = len([p for p in prospects if p['Signed_Up'].lower() == 'yes'])
        
        return {
            'sent_today': sent_today,
            'total_prospects': total_prospects,
            'responses': responses,
            'signups': signups,
            'response_rate': round((responses/total_prospects)*100, 1) if total_prospects > 0 else 0,
            'signup_rate': round((signups/total_prospects)*100, 1) if total_prospects > 0 else 0
        }
    
    def get_followups_due(self):
        """Get prospects that need follow-up today"""
        prospects = self.load_prospects()
        today_str = self.today.strftime('%Y-%m-%d')
        
        followups = []
        for prospect in prospects:
            if prospect['Follow_Up_Date'] == today_str and prospect['Status'] != 'Responded':
                followups.append(prospect)
        
        return followups
    
    def add_prospect(self, name, practice_name, email, city, state, website="", specialties="", notes=""):
        """Add new prospect to tracking"""
        prospect = {
            'Date': self.today.strftime('%Y-%m-%d'),
            'Name': name,
            'Practice_Name': practice_name,
            'Email': email,
            'City': city,
            'State': state,
            'Website': website,
            'Specialties': specialties,
            'Template_Used': 'Template 1',
            'Status': 'Ready',
            'Response_Date': '',
            'Follow_Up_Date': (self.today + timedelta(days=7)).strftime('%Y-%m-%d'),
            'Notes': notes,
            'Signed_Up': ''
        }
        
        # Append to CSV
        with open(self.csv_file, 'a', newline='') as file:
            writer = csv.DictWriter(file, fieldnames=prospect.keys())
            writer.writerow(prospect)
        
        print(f"Added: {name} ({email}) - Follow-up scheduled for {prospect['Follow_Up_Date']}")
    
    def send_email(self, to_email, subject, body, from_account="haylee"):
        """Send email using specified account"""
        try:
            account = EMAIL_ACCOUNTS[from_account]
            
            msg = MIMEMultipart()
            msg['From'] = account['email']
            msg['To'] = to_email
            msg['Subject'] = subject
            
            msg.attach(MIMEText(body, 'plain'))
            
            server = smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT)
            server.login(account['email'], account['password'])
            text = msg.as_string()
            server.sendmail(account['email'], to_email, text)
            server.quit()
            
            return True
            
        except Exception as e:
            print(f"Failed to send email to {to_email}: {str(e)}")
            return False
    
    def daily_report(self):
        """Generate daily outreach report"""
        stats = self.get_daily_stats()
        followups = self.get_followups_due()
        
        print("\n" + "="*50)
        print("DAILY OUTREACH REPORT")
        print("="*50)
        print(f"Date: {self.today}")
        print(f"Emails sent today: {stats['sent_today']}")
        print(f"Total prospects contacted: {stats['total_prospects']}")
        print(f"Total responses: {stats['responses']} ({stats['response_rate']}%)")
        print(f"Directory signups: {stats['signups']} ({stats['signup_rate']}%)")
        print(f"Follow-ups due today: {len(followups)}")
        
        if followups:
            print("\nFOLLOW-UPS DUE:")
            for prospect in followups:
                print(f"- {prospect['Name']} ({prospect['Email']}) - {prospect['City']}, {prospect['State']}")
        
        print("\n" + "="*50)

def main():
    """Main function to run daily outreach tasks"""
    manager = OutreachManager()
    
    # Show daily report
    manager.daily_report()
    
    print("\nDaily Outreach Options:")
    print("1. View daily report")
    print("2. Add new prospects")
    print("3. Send follow-up emails")
    print("4. Exit")
    
    choice = input("\nSelect option (1-4): ").strip()
    
    if choice == "1":
        manager.daily_report()
    
    elif choice == "2":
        print("\nAdd New Prospect:")
        name = input("Full name: ").strip()
        practice = input("Practice name: ").strip()
        email = input("Email: ").strip()
        city = input("City: ").strip()
        state = input("State: ").strip()
        website = input("Website (optional): ").strip()
        specialties = input("Specialties: ").strip()
        notes = input("Notes: ").strip()
        
        manager.add_prospect(name, practice, email, city, state, website, specialties, notes)
        print("Prospect added successfully!")
    
    elif choice == "3":
        followups = manager.get_followups_due()
        if not followups:
            print("No follow-ups due today!")
            return
            
        print(f"\n{len(followups)} follow-ups due today:")
        for i, prospect in enumerate(followups, 1):
            print(f"{i}. {prospect['Name']} ({prospect['Email']})")
        
        send_all = input("Send follow-ups to all? (y/n): ").strip().lower() == 'y'
        
        if send_all:
            for prospect in followups:
                first_name = prospect['Name'].split()[0]
                subject = TEMPLATES[2]['subject']
                body = TEMPLATES[2]['body'].format(first_name=first_name)
                
                if manager.send_email(prospect['Email'], subject, body):
                    print(f"✓ Sent follow-up to {prospect['Name']}")
                else:
                    print(f"✗ Failed to send to {prospect['Name']}")
    
    elif choice == "4":
        print("Goodbye!")
        return
    
    else:
        print("Invalid option!")

if __name__ == "__main__":
    main()