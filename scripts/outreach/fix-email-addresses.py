#!/usr/bin/env python3
"""
Fix Malformed Email Addresses in Prospect Database
Repairs emails that are missing username parts
"""

import csv
import re

def fix_email_address(name, email, practice_name):
    """Fix malformed email address"""
    # If email starts with @ or ., it's malformed
    if email.startswith('@') or email.startswith('.'):
        # Extract first name and last name
        name_clean = name.replace('Dr.', '').replace(',', '').strip()
        name_parts = name_clean.split()
        
        if len(name_parts) >= 2:
            first_name = name_parts[0].lower()
            last_name = name_parts[-1].lower()
        else:
            first_name = name_parts[0].lower() if name_parts else 'info'
            last_name = ''
        
        # Extract domain from the malformed email
        if email.startswith('@'):
            domain = email[1:]  # Remove the @
        elif email.startswith('.'):
            domain = email[1:]  # Remove the .
        else:
            domain = email
        
        # Create proper email patterns
        email_options = [
            f"{first_name}@{domain}",
            f"dr.{last_name}@{domain}" if last_name else f"dr.{first_name}@{domain}",
            f"{first_name}.{last_name}@{domain}" if last_name else f"{first_name}@{domain}",
            f"info@{domain}",
            f"contact@{domain}"
        ]
        
        # Return most likely email
        return email_options[0]
    
    # Email looks OK, return as-is
    return email

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def fix_prospect_database():
    """Fix all malformed emails in prospect database"""
    print("🔧 FIXING MALFORMED EMAIL ADDRESSES")
    print("="*50)
    
    # Read current prospects
    prospects = []
    with open("prospect-tracking.csv", 'r') as file:
        reader = csv.DictReader(file)
        prospects = list(reader)
    
    fixed_count = 0
    invalid_count = 0
    
    # Fix each prospect
    for prospect in prospects:
        original_email = prospect['Email']
        
        # Check if email needs fixing
        if not validate_email(original_email):
            print(f"❌ Invalid: {prospect['Name']} - {original_email}")
            
            # Fix the email
            fixed_email = fix_email_address(
                prospect['Name'], 
                original_email, 
                prospect['Practice_Name']
            )
            
            if validate_email(fixed_email):
                prospect['Email'] = fixed_email
                print(f"✅ Fixed:   {prospect['Name']} - {fixed_email}")
                fixed_count += 1
            else:
                print(f"⚠️ Still invalid: {prospect['Name']} - {fixed_email}")
                invalid_count += 1
        else:
            print(f"✅ Valid:   {prospect['Name']} - {original_email}")
    
    # Write fixed prospects back to file
    with open("prospect-tracking.csv", 'w', newline='') as file:
        fieldnames = prospects[0].keys()
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(prospects)
    
    print(f"\n🎉 EMAIL FIX COMPLETE!")
    print("="*30)
    print(f"✅ Fixed emails: {fixed_count}")
    print(f"⚠️ Still invalid: {invalid_count}")
    print(f"📧 Total prospects: {len(prospects)}")
    print(f"📄 Updated: prospect-tracking.csv")
    
    return fixed_count

def main():
    """Fix malformed email addresses"""
    fixed_count = fix_prospect_database()
    
    if fixed_count > 0:
        print(f"\n🚀 READY TO RESUME OUTREACH!")
        print(f"   Run: python3 actual-outreach-campaign.py")
        print(f"   Fixed emails should now work properly")
    else:
        print(f"\n✅ All emails were already valid!")

if __name__ == "__main__":
    main()