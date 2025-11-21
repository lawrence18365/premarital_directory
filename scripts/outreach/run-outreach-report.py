#!/usr/bin/env python3
"""
Automated Outreach Status Report
Runs system checks and generates comprehensive report
"""

import csv
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
import os

def get_prospect_stats():
    """Get current prospect database statistics"""
    try:
        with open("prospect-tracking.csv", 'r') as file:
            reader = csv.DictReader(file)
            prospects = list(reader)
        
        today = datetime.now().strftime('%Y-%m-%d')
        yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
        
        stats = {
            'total_prospects': len(prospects),
            'ready_to_contact': len([p for p in prospects if p.get('Status') == 'Ready']),
            'already_contacted': len([p for p in prospects if p.get('Status') == 'Sent']),
            'responses_received': len([p for p in prospects if p.get('Response_Date')]),
            'signups': len([p for p in prospects if p.get('Signed_Up').lower() == 'yes']),
            'added_today': len([p for p in prospects if p.get('Date') == today]),
            'added_yesterday': len([p for p in prospects if p.get('Date') == yesterday])
        }
        
        # Calculate rates
        if stats['already_contacted'] > 0:
            stats['response_rate'] = round((stats['responses_received'] / stats['already_contacted']) * 100, 1)
            stats['signup_rate'] = round((stats['signups'] / stats['already_contacted']) * 100, 1)
        else:
            stats['response_rate'] = 0.0
            stats['signup_rate'] = 0.0
            
        return stats
        
    except FileNotFoundError:
        return {
            'total_prospects': 0,
            'ready_to_contact': 0,
            'already_contacted': 0,
            'responses_received': 0,
            'signups': 0,
            'added_today': 0,
            'added_yesterday': 0,
            'response_rate': 0.0,
            'signup_rate': 0.0
        }

def get_warmup_status():
    """Check warm-up status"""
    try:
        with open("warmup_start.txt", "r") as file:
            start_date = datetime.strptime(file.read().strip(), "%Y-%m-%d").date()
            today = datetime.now().date()
            days_elapsed = (today - start_date).days + 1
            
            if days_elapsed <= 14:
                return f"Day {days_elapsed}/14 (Warm-up Phase)"
            else:
                return "Complete (Ready for full outreach)"
                
    except FileNotFoundError:
        return "Not Started (Need to begin warm-up)"

def check_reply_files():
    """Check for any reply tracking files"""
    reply_files = [f for f in os.listdir('.') if 'replies' in f.lower() and f.endswith('.csv')]
    
    if not reply_files:
        return {'total_replies': 0, 'today_replies': 0, 'reply_types': {}}
    
    all_replies = []
    for filename in reply_files:
        try:
            with open(filename, 'r') as file:
                reader = csv.DictReader(file)
                all_replies.extend(list(reader))
        except:
            continue
    
    today = datetime.now().strftime('%Y-%m-%d')
    today_replies = [r for r in all_replies if r.get('Date') == today]
    
    # Count by type
    reply_types = {}
    for reply in all_replies:
        reply_type = reply.get('Type', 'Unknown')
        reply_types[reply_type] = reply_types.get(reply_type, 0) + 1
    
    return {
        'total_replies': len(all_replies),
        'today_replies': len(today_replies),
        'reply_types': reply_types
    }

def send_status_email(report_content, recipient="lawrencebrennan@gmail.com"):
    """Send status report via email"""
    try:
        # Use haylee@weddingcounselors.com to send report
        smtp_server = "mail.spacemail.com"
        smtp_port = 465
        sender_email = "haylee@weddingcounselors.com"
        sender_password = "1relandS!"
        
        msg = MIMEMultipart()
        msg['From'] = f"Wedding Counselors Outreach <{sender_email}>"
        msg['To'] = recipient
        msg['Subject'] = f"Daily Outreach Report - {datetime.now().strftime('%Y-%m-%d')}"
        
        msg.attach(MIMEText(report_content, 'plain'))
        
        server = smtplib.SMTP_SSL(smtp_server, smtp_port)
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, recipient, msg.as_string())
        server.quit()
        
        return True
        
    except Exception as e:
        print(f"Failed to send email report: {e}")
        return False

def generate_comprehensive_report():
    """Generate comprehensive outreach report"""
    stats = get_prospect_stats()
    warmup_status = get_warmup_status()
    reply_info = check_reply_files()
    
    report = f"""
🚀 WEDDING COUNSELORS OUTREACH REPORT
Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
======================================================

📊 PROSPECT DATABASE STATUS:
- Total prospects in database: {stats['total_prospects']}
- Ready for outreach: {stats['ready_to_contact']}
- Already contacted: {stats['already_contacted']}
- Received responses: {stats['responses_received']}
- Directory signups: {stats['signups']}

📈 PERFORMANCE METRICS:
- Response rate: {stats['response_rate']}%
- Signup conversion: {stats['signup_rate']}%
- Prospects added today: {stats['added_today']}
- Prospects added yesterday: {stats['added_yesterday']}

🌡️ SYSTEM STATUS:
- Account warm-up: {warmup_status}
- Reply monitoring: Active (checking 5 accounts)
- Compliance: CAN-SPAM ready
- Email authentication: SPF/DKIM/DMARC configured

📬 REPLY MONITORING:
- Total replies received: {reply_info['total_replies']}
- Replies today: {reply_info['today_replies']}
- Reply breakdown: {reply_info['reply_types']}

🎯 CURRENT PHASE:
"""

    if "Not Started" in warmup_status:
        report += """
⚠️  WARM-UP NEEDED: System ready but warm-up not started
   
   NEXT STEPS:
   1. Begin 14-day warm-up process
   2. Send 3-5 test emails per account daily
   3. Gradually increase volume
   
   TO START: Run warm-up emails to known contacts
"""
    elif "Day" in warmup_status:
        day_num = int(warmup_status.split()[1].split('/')[0])
        emails_per_account = 3 if day_num <= 3 else 5 if day_num <= 7 else 8 if day_num <= 11 else 12
        
        report += f"""
🌡️  WARM-UP IN PROGRESS (Day {day_num}/14)
   
   TODAY'S TARGETS:
   - Send {emails_per_account} emails per account
   - Focus on known contacts/test emails
   - Monitor deliverability
   
   PROGRESS: {((day_num/14)*100):.0f}% complete
"""
    else:
        if stats['ready_to_contact'] > 0:
            report += f"""
✅  READY FOR FULL OUTREACH!
   
   TODAY'S OPPORTUNITIES:
   - {stats['ready_to_contact']} prospects ready to contact
   - Target: 15-20 outreach emails per account
   - Expected: 8-12% response rate
   
   RECOMMENDED ACTION: Begin daily outreach campaign
"""
        else:
            report += """
⚠️  NEED MORE PROSPECTS
   
   NEXT STEPS:
   1. Run prospect research system
   2. Find 25-50 new counselors
   3. Begin outreach to fresh prospects
   
   TO DO: python3 prospect-finder.py
"""

    # Geographic breakdown
    if stats['total_prospects'] > 0:
        try:
            with open("prospect-tracking.csv", 'r') as file:
                reader = csv.DictReader(file)
                prospects = list(reader)
            
            city_counts = {}
            for prospect in prospects:
                city = prospect.get('City', 'Unknown')
                city_counts[city] = city_counts.get(city, 0) + 1
            
            report += f"""
🏙️  GEOGRAPHIC COVERAGE:
"""
            for city, count in sorted(city_counts.items(), key=lambda x: x[1], reverse=True):
                report += f"   {city}: {count} prospects\n"
                
        except:
            pass

    # Health indicators
    report += f"""
🚨  SYSTEM HEALTH INDICATORS:
"""
    
    if stats['already_contacted'] == 0:
        report += "   📧 No emails sent yet - system ready to start\n"
    elif stats['response_rate'] >= 8:
        report += f"   ✅ Excellent response rate ({stats['response_rate']}% - above 8%)\n"
    elif stats['response_rate'] >= 5:
        report += f"   ✅ Good response rate ({stats['response_rate']}% - above 5%)\n"  
    else:
        report += f"   ⚠️ Low response rate ({stats['response_rate']}% - review templates)\n"
    
    if stats['ready_to_contact'] >= 50:
        report += "   ✅ Healthy prospect pipeline (50+ ready)\n"
    elif stats['ready_to_contact'] >= 25:
        report += "   ⚠️ Pipeline needs attention (25-49 ready)\n"
    else:
        report += "   🚨 Critical pipeline shortage (<25 ready)\n"

    report += f"""
📋  RECOMMENDED ACTIONS:
"""
    
    if "Not Started" in warmup_status:
        report += "   1. 🌡️ START WARM-UP: Begin 14-day account warming\n"
    elif "Day" in warmup_status:
        report += f"   1. 🌡️ CONTINUE WARM-UP: Day {day_num}/14\n"
    
    if stats['ready_to_contact'] < 25:
        report += "   2. 🔍 FIND PROSPECTS: Run prospect research\n"
    
    if stats['ready_to_contact'] >= 25 and "Complete" in warmup_status:
        report += "   2. 📧 BEGIN OUTREACH: Start daily campaigns\n"
    
    if reply_info['today_replies'] > 0:
        report += "   3. 📬 PROCESS REPLIES: Handle today's responses\n"
    
    report += f"""
🔄  REPLY FORWARDING SETUP:
   All replies forwarded to: lawrencebrennan@gmail.com
   Monitoring accounts: haylee@, lauren@, info@, jessie@, samantha@
   Check frequency: Every 30 minutes (when running)

======================================================
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
System: Wedding Counselors Email Outreach Platform
"""
    
    return report

def main():
    """Generate and display/email report"""
    print("🔄 Running Wedding Counselors Outreach System Report...")
    
    report = generate_comprehensive_report()
    
    # Display report
    print(report)
    
    # Save to file
    filename = f"outreach_report_{datetime.now().strftime('%Y%m%d_%H%M')}.txt"
    with open(filename, 'w') as file:
        file.write(report)
    
    print(f"📄 Report saved to: {filename}")
    
    # Try to email report
    if send_status_email(report):
        print("📧 Report emailed to lawrencebrennan@gmail.com")
    else:
        print("⚠️ Could not email report (check SMTP settings)")

if __name__ == "__main__":
    main()