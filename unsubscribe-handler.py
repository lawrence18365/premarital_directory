#!/usr/bin/env python3
"""
Unsubscribe Handler for Wedding Counselors Email Outreach
Processes unsubscribe requests and maintains compliance
"""

import csv
import re
from datetime import datetime
import os

class UnsubscribeManager:
    def __init__(self, csv_file="prospect-tracking.csv", unsubscribe_file="unsubscribes.csv"):
        self.csv_file = csv_file
        self.unsubscribe_file = unsubscribe_file
        self.today = datetime.now()
        
        # Create unsubscribe file if it doesn't exist
        if not os.path.exists(self.unsubscribe_file):
            self.create_unsubscribe_file()
    
    def create_unsubscribe_file(self):
        """Create unsubscribe tracking file"""
        headers = ['Date', 'Email', 'Name', 'Reason', 'Source', 'Notes']
        
        with open(self.unsubscribe_file, 'w', newline='') as file:
            writer = csv.DictWriter(file, fieldnames=headers)
            writer.writeheader()
        
        print(f"Created unsubscribe tracking file: {self.unsubscribe_file}")
    
    def add_unsubscribe(self, email, name="", reason="Unsubscribe Request", source="Email Reply", notes=""):
        """Add email to unsubscribe list"""
        unsubscribe_record = {
            'Date': self.today.strftime('%Y-%m-%d %H:%M:%S'),
            'Email': email.lower().strip(),
            'Name': name,
            'Reason': reason,
            'Source': source,
            'Notes': notes
        }
        
        # Check if already unsubscribed
        if self.is_unsubscribed(email):
            print(f"⚠️  {email} is already unsubscribed")
            return False
        
        # Add to unsubscribe file
        with open(self.unsubscribe_file, 'a', newline='') as file:
            writer = csv.DictWriter(file, fieldnames=unsubscribe_record.keys())
            writer.writerow(unsubscribe_record)
        
        # Update prospect tracking file
        self.update_prospect_status(email, "Unsubscribed")
        
        print(f"✅ Successfully unsubscribed: {email}")
        return True
    
    def is_unsubscribed(self, email):
        """Check if email is in unsubscribe list"""
        email = email.lower().strip()
        
        try:
            with open(self.unsubscribe_file, 'r') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    if row['Email'].lower().strip() == email:
                        return True
        except FileNotFoundError:
            pass
        
        return False
    
    def update_prospect_status(self, email, status):
        """Update prospect status in main tracking file"""
        email = email.lower().strip()
        prospects = []
        
        try:
            # Read existing data
            with open(self.csv_file, 'r') as file:
                reader = csv.DictReader(file)
                prospects = list(reader)
            
            # Update status for matching email
            updated = False
            for prospect in prospects:
                if prospect['Email'].lower().strip() == email:
                    prospect['Status'] = status
                    prospect['Response_Date'] = self.today.strftime('%Y-%m-%d')
                    updated = True
            
            # Write back to file
            if prospects and updated:
                with open(self.csv_file, 'w', newline='') as file:
                    writer = csv.DictWriter(file, fieldnames=prospects[0].keys())
                    writer.writeheader()
                    writer.writerows(prospects)
                
                print(f"Updated prospect status for {email}")
        
        except FileNotFoundError:
            print(f"Warning: Could not find {self.csv_file}")
    
    def process_email_replies(self, email_content):
        """Process email content for unsubscribe requests"""
        unsubscribe_keywords = [
            'unsubscribe', 'remove me', 'take me off', 'stop emailing',
            'no thanks', 'not interested', 'remove from list', 'opt out'
        ]
        
        content_lower = email_content.lower()
        
        for keyword in unsubscribe_keywords:
            if keyword in content_lower:
                return True
        
        return False
    
    def bulk_unsubscribe(self, email_list, reason="Bulk Unsubscribe"):
        """Process multiple unsubscribes at once"""
        successful = 0
        failed = 0
        
        for email in email_list:
            email = email.strip()
            if email:
                if self.add_unsubscribe(email, reason=reason):
                    successful += 1
                else:
                    failed += 1
        
        print(f"\nBulk Unsubscribe Results:")
        print(f"Successful: {successful}")
        print(f"Failed/Duplicates: {failed}")
        print(f"Total Processed: {len(email_list)}")
    
    def get_unsubscribe_stats(self):
        """Get unsubscribe statistics"""
        try:
            with open(self.unsubscribe_file, 'r') as file:
                reader = csv.DictReader(file)
                unsubscribes = list(reader)
            
            total_unsubscribes = len(unsubscribes)
            today_count = len([u for u in unsubscribes if u['Date'].startswith(self.today.strftime('%Y-%m-%d'))])
            
            # Count by reason
            reasons = {}
            for unsub in unsubscribes:
                reason = unsub['Reason']
                reasons[reason] = reasons.get(reason, 0) + 1
            
            return {
                'total': total_unsubscribes,
                'today': today_count,
                'reasons': reasons
            }
        
        except FileNotFoundError:
            return {'total': 0, 'today': 0, 'reasons': {}}
    
    def export_unsubscribe_list(self, output_file="unsubscribed_emails.txt"):
        """Export clean list of unsubscribed emails"""
        emails = []
        
        try:
            with open(self.unsubscribe_file, 'r') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    emails.append(row['Email'])
            
            with open(output_file, 'w') as file:
                for email in sorted(set(emails)):
                    file.write(f"{email}\n")
            
            print(f"Exported {len(set(emails))} unsubscribed emails to {output_file}")
        
        except FileNotFoundError:
            print("No unsubscribe file found")
    
    def compliance_report(self):
        """Generate compliance report"""
        stats = self.get_unsubscribe_stats()
        
        print("\n" + "="*50)
        print("UNSUBSCRIBE COMPLIANCE REPORT")
        print("="*50)
        print(f"Date: {self.today.strftime('%Y-%m-%d')}")
        print(f"Total unsubscribes: {stats['total']}")
        print(f"Unsubscribes today: {stats['today']}")
        
        if stats['reasons']:
            print(f"\nUnsubscribe reasons:")
            for reason, count in stats['reasons'].items():
                print(f"- {reason}: {count}")
        
        # Calculate unsubscribe rate if we have prospect data
        try:
            with open(self.csv_file, 'r') as file:
                reader = csv.DictReader(file)
                total_prospects = len(list(reader))
                
            if total_prospects > 0:
                unsub_rate = round((stats['total'] / total_prospects) * 100, 2)
                print(f"\nOverall unsubscribe rate: {unsub_rate}%")
                
                if unsub_rate > 2:
                    print("⚠️  WARNING: Unsubscribe rate is high (>2%). Review email content and targeting.")
                else:
                    print("✅ Unsubscribe rate is acceptable (<2%)")
        
        except FileNotFoundError:
            pass
        
        print("="*50)

def main():
    """Main function for unsubscribe management"""
    manager = UnsubscribeManager()
    
    print("Unsubscribe Management Options:")
    print("1. Add single unsubscribe")
    print("2. Bulk unsubscribe from file")
    print("3. Check if email is unsubscribed")
    print("4. Generate compliance report")
    print("5. Export unsubscribed emails")
    print("6. Exit")
    
    choice = input("\nSelect option (1-6): ").strip()
    
    if choice == "1":
        email = input("Enter email to unsubscribe: ").strip()
        name = input("Enter name (optional): ").strip()
        reason = input("Enter reason (optional): ").strip() or "Manual Unsubscribe"
        notes = input("Enter notes (optional): ").strip()
        
        manager.add_unsubscribe(email, name, reason, "Manual Entry", notes)
    
    elif choice == "2":
        file_path = input("Enter path to file with emails (one per line): ").strip()
        try:
            with open(file_path, 'r') as file:
                emails = [line.strip() for line in file if line.strip()]
            
            reason = input("Enter reason for bulk unsubscribe: ").strip() or "Bulk Unsubscribe"
            manager.bulk_unsubscribe(emails, reason)
        
        except FileNotFoundError:
            print(f"File not found: {file_path}")
    
    elif choice == "3":
        email = input("Enter email to check: ").strip()
        if manager.is_unsubscribed(email):
            print(f"✅ {email} is unsubscribed")
        else:
            print(f"❌ {email} is NOT unsubscribed")
    
    elif choice == "4":
        manager.compliance_report()
    
    elif choice == "5":
        output_file = input("Enter output filename (default: unsubscribed_emails.txt): ").strip()
        if not output_file:
            output_file = "unsubscribed_emails.txt"
        manager.export_unsubscribe_list(output_file)
    
    elif choice == "6":
        print("Goodbye!")
        return
    
    else:
        print("Invalid option!")

if __name__ == "__main__":
    main()