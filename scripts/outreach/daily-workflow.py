#!/usr/bin/env python3
"""
Complete Daily Workflow Automation
Handles research, outreach, reply monitoring, and scaling
"""

import csv
import json
import os
from datetime import datetime, timedelta
import requests
import time
import random

# Import our other modules
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from outreach_accounts import load_outreach_accounts

try:
    from daily_outreach_script import OutreachManager, ACCOUNTS
    from reply_monitoring_system import ReplyMonitor  
    from unsubscribe_handler import UnsubscribeManager
except ImportError as e:
    print(f"Import error: {e}")
    print("Running in standalone mode...")
    ACCOUNTS = load_outreach_accounts()

class DailyWorkflow:
    def __init__(self):
        self.today = datetime.now().date()
        self.outreach = OutreachManager()
        self.replies = ReplyMonitor()
        self.unsubscribes = UnsubscribeManager()
        
        # Create workflow tracking file
        self.workflow_file = "daily_workflow_log.csv"
        self.create_workflow_log()
        
        # Account rotation for scaling
        self.account_rotation = ["haylee", "lauren", "info", "jessie", "samantha"]
        self.current_account_index = 0
    
    def create_workflow_log(self):
        """Create daily workflow log file"""
        try:
            with open(self.workflow_file, 'x', newline='') as file:
                writer = csv.writer(file)
                writer.writerow([
                    'Date', 'Emails_Sent', 'Accounts_Used', 'Replies_Received', 
                    'Positive_Responses', 'Unsubscribes', 'Signups', 'Notes'
                ])
        except FileExistsError:
            pass
    
    def get_next_account(self):
        """Get next account for rotation (supports scaling)"""
        account = self.account_rotation[self.current_account_index]
        self.current_account_index = (self.current_account_index + 1) % len(self.account_rotation)
        return account
    
    def research_prospects(self, target_cities, prospects_needed=25):
        """Research new prospects using automated methods"""
        print(f"🔍 Researching {prospects_needed} prospects in: {', '.join(target_cities)}")
        
        prospects = []
        search_terms = [
            "premarital counseling",
            "couples therapy before marriage", 
            "marriage preparation counseling",
            "premarital therapy",
            "relationship counseling before marriage"
        ]
        
        for city in target_cities:
            for term in search_terms[:2]:  # Limit searches per city
                print(f"   Searching: {term} in {city}")
                
                # This would integrate with Google Places API or similar
                # For now, we'll create a template for manual research
                city_prospects = self.manual_research_template(city, term)
                prospects.extend(city_prospects)
                
                if len(prospects) >= prospects_needed:
                    break
            
            if len(prospects) >= prospects_needed:
                break
        
        print(f"✅ Found {len(prospects)} prospects")
        return prospects[:prospects_needed]
    
    def manual_research_template(self, city, term):
        """Template for manual research (replace with automated methods)"""
        # This is where you'd integrate with:
        # - Google Places API
        # - Psychology Today scraper
        # - Professional directory APIs
        
        # For now, return example template
        return [
            {
                "name": f"Sample Counselor in {city}",
                "practice": f"Sample Practice - {city}",
                "email": f"sample@example{city.lower()}.com",
                "city": city,
                "state": "TX",  # Update based on your target area
                "website": f"www.sample{city.lower()}.com",
                "specialties": term,
                "notes": f"Found via {term} search"
            }
        ]
    
    def warm_up_accounts(self):
        """Handle account warm-up process"""
        # Check what day of warm-up we're on
        warmup_day = self.get_warmup_day()
        
        if warmup_day == 0:
            print("✅ Warm-up complete! Ready for full outreach.")
            return True
        elif warmup_day <= 14:
            emails_per_account = self.get_warmup_emails(warmup_day)
            print(f"🌡️ Warm-up Day {warmup_day}: Sending {emails_per_account} emails per account")
            
            # Send warm-up emails
            self.send_warmup_emails(emails_per_account)
            return False
        else:
            print("✅ Warm-up complete! Ready for full outreach.")
            return True
    
    def get_warmup_day(self):
        """Calculate what day of warm-up we're on"""
        # Check if we have a warmup start date stored
        try:
            with open("warmup_start.txt", "r") as file:
                start_date = datetime.strptime(file.read().strip(), "%Y-%m-%d").date()
                days_elapsed = (self.today - start_date).days + 1
                return days_elapsed if days_elapsed <= 14 else 0
        except FileNotFoundError:
            # First time running - start warm-up
            with open("warmup_start.txt", "w") as file:
                file.write(self.today.strftime("%Y-%m-%d"))
            return 1
    
    def get_warmup_emails(self, day):
        """Get number of emails per account for warm-up day"""
        if day <= 3:
            return 3
        elif day <= 7:
            return 5
        elif day <= 11:
            return 8
        else:
            return 12
    
    def send_warmup_emails(self, emails_per_account):
        """Send warm-up emails to known contacts"""
        warmup_contacts = [
            "haylee@weddingcounselors.com",  # Self-emails
            "lauren@weddingcounselors.com",
            "info@weddingcounselors.com"
        ]
        
        for account in self.account_rotation[:3]:  # Only use 3 accounts during warmup
            print(f"   Warming up {account}@weddingcounselors.com")
            
            for i in range(emails_per_account):
                to_email = random.choice(warmup_contacts)
                subject = f"Warm-up test {i+1} - {self.today}"
                body = f"This is a warm-up email #{i+1} for {account}@weddingcounselors.com on {self.today}"
                
                # Use our outreach system to send
                if self.outreach.send_email(to_email, subject, body, account):
                    print(f"      ✓ Sent warm-up email {i+1} to {to_email}")
                else:
                    print(f"      ✗ Failed to send warm-up email {i+1}")
                
                time.sleep(random.randint(30, 120))  # Random delay 30-120 seconds
    
    def daily_outreach_campaign(self):
        """Run daily outreach campaign"""
        if not self.warm_up_accounts():
            return  # Still in warm-up mode
        
        # Get today's outreach targets
        daily_targets = self.get_daily_targets()
        
        print(f"🎯 Today's targets: {daily_targets['total_emails']} emails across {daily_targets['accounts_to_use']} accounts")
        
        # Research new prospects
        target_cities = daily_targets['cities']
        prospects = self.research_prospects(target_cities, daily_targets['total_emails'])
        
        # Add prospects to tracking system
        for prospect in prospects:
            self.outreach.add_prospect(
                prospect['name'],
                prospect['practice'], 
                prospect['email'],
                prospect['city'],
                prospect['state'],
                prospect['website'],
                prospect['specialties'],
                prospect['notes']
            )
        
        # Send outreach emails
        emails_sent = 0
        accounts_used = []
        
        for prospect in prospects:
            account = self.get_next_account()
            if account not in daily_targets['accounts_to_use']:
                continue
                
            # Personalize email
            template = 1  # Start with template 1
            subject = f"Free directory listing for {prospect['city']} premarital counselors"
            
            # Get first name
            first_name = prospect['name'].split()[0]
            
            # Personalized email body
            body = f"""Hi {first_name},

I found your practice while researching premarital counseling services in {prospect['city']}. Your approach to helping couples really stood out.

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

            # Send email with random delay
            if self.outreach.send_email(prospect['email'], subject, body, account):
                emails_sent += 1
                if account not in accounts_used:
                    accounts_used.append(account)
                print(f"✓ Sent to {prospect['name']} via {account}@")
                
                # Random delay between emails (1-3 minutes)
                delay = random.randint(60, 180)
                time.sleep(delay)
            else:
                print(f"✗ Failed to send to {prospect['name']}")
        
        # Log today's activity
        self.log_daily_activity(emails_sent, accounts_used)
        
        print(f"📧 Campaign complete: {emails_sent} emails sent using {len(accounts_used)} accounts")
    
    def get_daily_targets(self):
        """Get daily outreach targets based on account status and growth"""
        # Check current stats
        stats = self.outreach.get_daily_stats()
        
        # Base targets
        base_targets = {
            "haylee": 20,
            "lauren": 20, 
            "info": 15,
            "jessie": 15,
            "samantha": 10
        }
        
        # Scale based on success rate
        if stats['total_prospects'] > 100:
            signup_rate = stats['signup_rate']
            
            if signup_rate > 5:  # High success rate - increase volume
                multiplier = 1.2
            elif signup_rate < 2:  # Low success rate - reduce volume
                multiplier = 0.8
            else:
                multiplier = 1.0
            
            # Apply multiplier
            for account in base_targets:
                base_targets[account] = int(base_targets[account] * multiplier)
        
        # Select accounts to use (start with 3, scale up)
        total_prospects = stats['total_prospects']
        if total_prospects < 50:
            accounts_to_use = ["haylee", "lauren", "info"]
        elif total_prospects < 200:
            accounts_to_use = ["haylee", "lauren", "info", "jessie"] 
        else:
            accounts_to_use = ["haylee", "lauren", "info", "jessie", "samantha"]
        
        total_emails = sum(base_targets[acc] for acc in accounts_to_use)
        
        # Target cities (rotate or expand)
        cities = self.get_target_cities()
        
        return {
            "total_emails": total_emails,
            "accounts_to_use": accounts_to_use,
            "account_targets": {acc: base_targets[acc] for acc in accounts_to_use},
            "cities": cities
        }
    
    def get_target_cities(self):
        """Get target cities for today's outreach"""
        # This would ideally rotate or be based on analysis
        # For now, return major Texas cities (update for your target area)
        all_cities = [
            "Austin", "Houston", "Dallas", "San Antonio", "Fort Worth",
            "El Paso", "Arlington", "Corpus Christi", "Plano", "Lubbock",
            "Laredo", "Irving", "Garland", "Frisco", "McKinney"
        ]
        
        # Rotate through 3-4 cities per day
        today_index = self.today.toordinal() % len(all_cities)
        return all_cities[today_index:today_index+4] + all_cities[:max(0, today_index+4-len(all_cities))]
    
    def process_daily_replies(self):
        """Process and categorize daily replies"""
        print("📬 Checking for new replies...")
        
        # Check all accounts
        self.replies.check_all_accounts()
        
        # Get reply stats
        stats = self.replies.get_reply_stats()
        
        if stats['today'] > 0:
            print(f"📨 {stats['today']} new replies today")
            
            # Show recent replies for immediate action
            self.replies.show_recent_replies(stats['today'])
            
            # Process any unsubscribes
            self.process_unsubscribes()
        
        return stats
    
    def process_unsubscribes(self):
        """Process any unsubscribe requests from today's replies"""
        print("🚫 Processing unsubscribe requests...")
        
        # This would read from the replies file and auto-process unsubscribes
        # For now, show compliance report
        self.unsubscribes.compliance_report()
    
    def log_daily_activity(self, emails_sent, accounts_used, replies_received=0, 
                          positive_responses=0, unsubscribes=0, signups=0, notes=""):
        """Log today's workflow activity"""
        
        with open(self.workflow_file, 'a', newline='') as file:
            writer = csv.writer(file)
            writer.writerow([
                self.today.strftime('%Y-%m-%d'),
                emails_sent,
                ','.join(accounts_used),
                replies_received,
                positive_responses, 
                unsubscribes,
                signups,
                notes
            ])
    
    def generate_daily_report(self):
        """Generate comprehensive daily report"""
        print("\n" + "="*70)
        print(f"📊 DAILY OUTREACH REPORT - {self.today}")
        print("="*70)
        
        # Outreach stats
        outreach_stats = self.outreach.get_daily_stats()
        print(f"📧 OUTREACH:")
        print(f"   Emails sent today: {outreach_stats['sent_today']}")
        print(f"   Total prospects contacted: {outreach_stats['total_prospects']}")
        print(f"   Overall response rate: {outreach_stats['response_rate']}%")
        print(f"   Directory signups: {outreach_stats['signups']} ({outreach_stats['signup_rate']}%)")
        
        # Reply stats
        reply_stats = self.replies.get_reply_stats()
        print(f"\n📬 REPLIES:")
        print(f"   New replies today: {reply_stats['today']}")
        print(f"   Total replies: {reply_stats['total']}")
        if reply_stats['by_type']:
            print("   Reply breakdown:")
            for reply_type, count in reply_stats['by_type'].items():
                print(f"      {reply_type}: {count}")
        
        # Compliance stats
        unsub_stats = self.unsubscribes.get_unsubscribe_stats()
        print(f"\n🚫 COMPLIANCE:")
        print(f"   Unsubscribes today: {unsub_stats['today']}")
        print(f"   Total unsubscribes: {unsub_stats['total']}")
        
        if outreach_stats['total_prospects'] > 0:
            unsub_rate = (unsub_stats['total'] / outreach_stats['total_prospects']) * 100
            print(f"   Unsubscribe rate: {unsub_rate:.1f}%")
            
            if unsub_rate > 2:
                print("   ⚠️ WARNING: High unsubscribe rate - review content")
            else:
                print("   ✅ Unsubscribe rate is healthy")
        
        # Growth recommendations
        print(f"\n📈 SCALING RECOMMENDATIONS:")
        if outreach_stats['response_rate'] > 8:
            print("   ✅ High response rate - consider increasing daily volume")
        elif outreach_stats['response_rate'] < 4:
            print("   ⚠️ Low response rate - focus on email quality over quantity")
        
        if outreach_stats['total_prospects'] > 200:
            print("   🚀 Ready to scale - consider using all 5 email accounts")
        
        print("="*70)
    
    def run_full_daily_workflow(self):
        """Run the complete daily workflow"""
        print(f"🚀 Starting daily workflow for {self.today}")
        print("="*50)
        
        try:
            # Step 1: Process replies from yesterday
            reply_stats = self.process_daily_replies()
            
            # Step 2: Run outreach campaign
            self.daily_outreach_campaign()
            
            # Step 3: Generate daily report
            self.generate_daily_report()
            
            # Step 4: Plan tomorrow
            print(f"\n📅 TOMORROW'S PLAN:")
            tomorrow_targets = self.get_daily_targets()
            print(f"   Target: {tomorrow_targets['total_emails']} emails")
            print(f"   Accounts: {', '.join(tomorrow_targets['accounts_to_use'])}")
            print(f"   Cities: {', '.join(tomorrow_targets['cities'][:3])}...")
            
            print(f"\n✅ Daily workflow complete! Next run: {datetime.now() + timedelta(days=1)}")
            
        except Exception as e:
            print(f"❌ Workflow error: {e}")
            self.log_daily_activity(0, [], notes=f"Error: {e}")

def main():
    """Main workflow control"""
    workflow = DailyWorkflow()
    
    print("🎯 Daily Workflow Manager")
    print("="*40)
    print("1. Run full daily workflow")
    print("2. Check replies only") 
    print("3. Send outreach only")
    print("4. Generate report only")
    print("5. Research prospects only")
    print("6. Account warm-up status")
    print("7. Exit")
    
    choice = input("\nSelect option (1-7): ").strip()
    
    if choice == "1":
        workflow.run_full_daily_workflow()
    
    elif choice == "2":
        workflow.process_daily_replies()
    
    elif choice == "3":
        workflow.daily_outreach_campaign()
    
    elif choice == "4":
        workflow.generate_daily_report()
    
    elif choice == "5":
        cities = input("Enter target cities (comma separated): ").split(',')
        cities = [city.strip() for city in cities if city.strip()]
        prospects = workflow.research_prospects(cities)
        print(f"Found {len(prospects)} prospects")
    
    elif choice == "6":
        warmup_day = workflow.get_warmup_day()
        if warmup_day == 0:
            print("✅ Warm-up complete - ready for full outreach!")
        else:
            emails_needed = workflow.get_warmup_emails(warmup_day)
            print(f"🌡️ Warm-up Day {warmup_day}/14 - Send {emails_needed} emails per account today")
    
    elif choice == "7":
        print("Goodbye!")
    
    else:
        print("Invalid option!")

if __name__ == "__main__":
    main()
