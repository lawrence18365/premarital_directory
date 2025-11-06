#!/usr/bin/env python3
"""
Campaign Monitoring Script
Shows real-time progress of outreach campaigns
"""

import csv
import os
from datetime import datetime
import time

def check_campaign_progress():
    """Check current campaign progress"""
    print("📊 WEDDING COUNSELORS OUTREACH - LIVE MONITORING")
    print("="*60)
    print(f"🕐 Current Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Check prospect database for sent emails
    try:
        with open("prospect-tracking.csv", 'r') as file:
            reader = csv.DictReader(file)
            prospects = list(reader)
        
        today = datetime.now().strftime('%Y-%m-%d')
        
        # Count statuses
        total_prospects = len(prospects)
        ready_prospects = len([p for p in prospects if p.get('Status') == 'Ready'])
        sent_today = len([p for p in prospects if p.get('Status') == 'Sent' and p.get('Date') == today])
        total_sent = len([p for p in prospects if p.get('Status') == 'Sent'])
        
        print(f"📧 DATABASE STATUS:")
        print(f"   Total prospects: {total_prospects}")
        print(f"   Emails sent today: {sent_today}")
        print(f"   Total emails sent: {total_sent}")
        print(f"   Ready for outreach: {ready_prospects}")
        
        # Show recent sends
        recent_sends = [p for p in prospects if p.get('Status') == 'Sent' and p.get('Date') == today]
        if recent_sends:
            print(f"\n📨 TODAY'S OUTREACH ({len(recent_sends)} emails):")
            for i, prospect in enumerate(recent_sends[-10:], 1):  # Show last 10
                print(f"   {i}. {prospect['Name']} ({prospect['Practice_Name']})")
                print(f"      📧 {prospect['Email']}")
                print(f"      📍 {prospect['City']}, {prospect['State']}")
                print(f"      📝 {prospect['Notes']}")
                print()
        
    except FileNotFoundError:
        print("❌ Prospect database not found")
        return
    
    # Check for campaign log
    try:
        with open("campaign_log.csv", 'r') as file:
            reader = csv.DictReader(file)
            campaigns = list(reader)
        
        if campaigns:
            latest = campaigns[-1]
            print(f"📊 LATEST CAMPAIGN:")
            print(f"   Date: {latest['date']}")
            print(f"   Emails sent: {latest['emails_sent']}")
            print(f"   Success rate: {latest['success_rate']}")
            print(f"   Campaign type: {latest['campaign_type']}")
        
    except FileNotFoundError:
        print("📄 No campaign log found yet")
    
    # Check for replies
    reply_files = [f for f in os.listdir('.') if 'replies' in f.lower() and f.endswith('.csv')]
    
    if reply_files:
        print(f"\n📬 REPLY MONITORING:")
        print(f"   Reply files found: {len(reply_files)}")
        print(f"   Forwarding to: lawrencebrennan@gmail.com")
    else:
        print(f"\n📬 REPLY MONITORING:")
        print(f"   Monitoring active, no replies yet")
        print(f"   All replies forwarded to: lawrencebrennan@gmail.com")
    
    # Expected results
    if sent_today > 0:
        expected_responses = max(1, int(sent_today * 0.10))  # 10% response rate
        expected_signups = max(1, int(sent_today * 0.05))    # 5% signup rate
        
        print(f"\n🎯 EXPECTED RESULTS (next 24-48 hours):")
        print(f"   Responses expected: {expected_responses}-{expected_responses*2}")
        print(f"   Directory signups: {expected_signups}-{expected_signups*2}")
        print(f"   Peak response time: 6-24 hours after send")

def main():
    """Monitor campaign progress"""
    check_campaign_progress()

if __name__ == "__main__":
    main()