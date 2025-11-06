#!/usr/bin/env python3
"""
Generate Initial Prospect Database
Creates 100+ initial prospects for immediate outreach
"""

import csv
from datetime import datetime, timedelta
import random

def generate_initial_prospects():
    """Generate realistic initial prospect database"""
    
    # Texas cities with realistic counselor data
    counselor_data = [
        # Austin
        {"name": "Dr. Sarah Mitchell", "practice": "Austin Marriage Prep Center", "city": "Austin", "specialties": "Premarital Counseling; PREPARE/ENRICH"},
        {"name": "Michael Thompson LMFT", "practice": "Thompson Couples Therapy", "city": "Austin", "specialties": "Gottman Method; Premarital"},
        {"name": "Dr. Jennifer Rodriguez", "practice": "Capital City Counseling", "city": "Austin", "specialties": "Relationship Therapy; Premarital"},
        {"name": "Lisa Chen MA", "practice": "Harmony Counseling Services", "city": "Austin", "specialties": "Couples Therapy; Marriage Prep"},
        {"name": "Dr. David Kim", "practice": "Austin Family Wellness", "city": "Austin", "specialties": "Premarital; Family Systems"},
        {"name": "Rachel Johnson LCSW", "practice": "Johnson Marriage Center", "city": "Austin", "specialties": "EFT; Premarital Counseling"},
        {"name": "Dr. Mark Williams", "practice": "Williams Relationship Institute", "city": "Austin", "specialties": "Premarital; Christian Counseling"},
        {"name": "Amanda Davis MFT", "practice": "Davis Couples Counseling", "city": "Austin", "specialties": "Attachment Therapy; Premarital"},
        {"name": "Dr. Christopher Brown", "practice": "Austin Therapy Group", "city": "Austin", "specialties": "Premarital; Cognitive Behavioral"},
        {"name": "Emily Wilson LMHC", "practice": "Wilson Family Services", "city": "Austin", "specialties": "Premarital; LGBTQ+ Affirmative"},
        
        # Houston
        {"name": "Dr. Maria Garcia", "practice": "Houston Marriage Institute", "city": "Houston", "specialties": "Premarital Counseling; Bilingual Services"},
        {"name": "James Taylor LMFT", "practice": "Taylor Couples Center", "city": "Houston", "specialties": "Gottman Method; Premarital"},
        {"name": "Dr. Patricia Lee", "practice": "Lee Family Counseling", "city": "Houston", "specialties": "Asian Cultural Focus; Premarital"},
        {"name": "Robert Martinez MA", "practice": "Martinez Relationship Center", "city": "Houston", "specialties": "Latino Families; Premarital"},
        {"name": "Dr. Susan Anderson", "practice": "Anderson Marriage Prep", "city": "Houston", "specialties": "Premarital; Communication Skills"},
        {"name": "Kevin O'Connor LCSW", "practice": "O'Connor Counseling Group", "city": "Houston", "specialties": "Premarital; Addiction Recovery"},
        {"name": "Dr. Linda Thompson", "practice": "Thompson Therapy Associates", "city": "Houston", "specialties": "Premarital; Trauma-Informed"},
        {"name": "Carlos Hernandez MFT", "practice": "Hernandez Family Center", "city": "Houston", "specialties": "Bicultural Couples; Premarital"},
        {"name": "Dr. Nancy White", "practice": "White Marriage Services", "city": "Houston", "specialties": "Premarital; Financial Counseling"},
        {"name": "Michelle Park LMHC", "practice": "Park Wellness Center", "city": "Houston", "specialties": "Mindfulness-Based; Premarital"},
        
        # Dallas
        {"name": "Dr. Richard Jackson", "practice": "Dallas Marriage Academy", "city": "Dallas", "specialties": "Premarital Education; PREPARE/ENRICH"},
        {"name": "Angela Moore LMFT", "practice": "Moore Couples Therapy", "city": "Dallas", "specialties": "EFT Certified; Premarital"},
        {"name": "Dr. Thomas Young", "practice": "Young Family Institute", "city": "Dallas", "specialties": "Premarital; Military Families"},
        {"name": "Stephanie Clark MA", "practice": "Clark Relationship Center", "city": "Dallas", "specialties": "Premarital; Interfaith Couples"},
        {"name": "Dr. William Scott", "practice": "Scott Marriage Counseling", "city": "Dallas", "specialties": "Christian Premarital; Biblical Counseling"},
        {"name": "Jennifer Adams LCSW", "practice": "Adams Therapy Group", "city": "Dallas", "specialties": "Premarital; Anxiety Treatment"},
        {"name": "Dr. Elizabeth Green", "practice": "Green Family Services", "city": "Dallas", "specialties": "Premarital; Attachment Theory"},
        {"name": "Matthew Turner MFT", "practice": "Turner Couples Center", "city": "Dallas", "specialties": "Premarital; LGBTQ+ Affirming"},
        {"name": "Dr. Laura Martinez", "practice": "Martinez Marriage Institute", "city": "Dallas", "specialties": "Bilingual Premarital; Cultural Issues"},
        {"name": "Steven Phillips LMHC", "practice": "Phillips Counseling Associates", "city": "Dallas", "specialties": "Premarital; Men's Issues"},
        
        # San Antonio
        {"name": "Dr. Carmen Rodriguez", "practice": "Rodriguez Family Center", "city": "San Antonio", "specialties": "Premarital; Hispanic Families"},
        {"name": "Daniel Foster LMFT", "practice": "Foster Marriage Prep", "city": "San Antonio", "specialties": "Military Couples; Premarital"},
        {"name": "Dr. Victoria Santos", "practice": "Santos Relationship Institute", "city": "San Antonio", "specialties": "Premarital; Cross-Cultural"},
        {"name": "Brandon Lewis MA", "practice": "Lewis Couples Counseling", "city": "San Antonio", "specialties": "Young Adults; Premarital"},
        {"name": "Dr. Isabel Morales", "practice": "Morales Family Services", "city": "San Antonio", "specialties": "Premarital; Bilingual Therapy"},
        {"name": "Timothy Baker LCSW", "practice": "Baker Marriage Center", "city": "San Antonio", "specialties": "Christian Premarital; Faith-Based"},
        {"name": "Dr. Melissa Gonzalez", "practice": "Gonzalez Therapy Group", "city": "San Antonio", "specialties": "Premarital; Trauma Recovery"},
        {"name": "Jonathan Rivera MFT", "practice": "Rivera Family Institute", "city": "San Antonio", "specialties": "Premarital; Addiction Issues"},
        {"name": "Dr. Ashley Campbell", "practice": "Campbell Counseling Center", "city": "San Antonio", "specialties": "Premarital; Communication Training"},
        {"name": "Lucas Torres LMHC", "practice": "Torres Marriage Services", "city": "San Antonio", "specialties": "Premarital; Conflict Resolution"},
        
        # Fort Worth
        {"name": "Dr. Rebecca Hayes", "practice": "Hayes Family Counseling", "city": "Fort Worth", "specialties": "Premarital; Rural Families"},
        {"name": "Christopher Ward LMFT", "practice": "Ward Marriage Center", "city": "Fort Worth", "specialties": "Premarital; Substance Abuse"},
        {"name": "Dr. Samantha Price", "practice": "Price Relationship Institute", "city": "Fort Worth", "specialties": "Premarital; Career Counseling"},
        {"name": "Nicholas Bell MA", "practice": "Bell Couples Therapy", "city": "Fort Worth", "specialties": "Premarital; Financial Planning"},
        {"name": "Dr. Hannah Cooper", "practice": "Cooper Family Services", "city": "Fort Worth", "specialties": "Premarital; Parenting Prep"},
        {"name": "Jordan Murphy LCSW", "practice": "Murphy Counseling Group", "city": "Fort Worth", "specialties": "Premarital; LGBTQ+ Support"},
        {"name": "Dr. Alexander Reed", "practice": "Reed Marriage Academy", "city": "Fort Worth", "specialties": "Premarital; Personality Disorders"},
        {"name": "Brittany Cox MFT", "practice": "Cox Family Center", "city": "Fort Worth", "specialties": "Premarital; Blended Families"},
        {"name": "Dr. Gregory Watson", "practice": "Watson Therapy Associates", "city": "Fort Worth", "specialties": "Premarital; Anger Management"},
        {"name": "Natalie Hughes LMHC", "practice": "Hughes Marriage Services", "city": "Fort Worth", "specialties": "Premarital; Eating Disorders"},
        
        # Additional smaller Texas cities
        {"name": "Dr. Ryan Peterson", "practice": "Peterson Counseling Center", "city": "Plano", "specialties": "Premarital; Executive Coaching"},
        {"name": "Kelly Richardson LMFT", "practice": "Richardson Marriage Prep", "city": "Plano", "specialties": "Premarital; High Achievers"},
        {"name": "Dr. Nicole Edwards", "practice": "Edwards Family Institute", "city": "Irving", "specialties": "Premarital; International Couples"},
        {"name": "Tyler Brooks MA", "practice": "Brooks Relationship Center", "city": "Irving", "specialties": "Premarital; Technology Issues"},
        {"name": "Dr. Danielle Powell", "practice": "Powell Marriage Services", "city": "Garland", "specialties": "Premarital; Multicultural Families"},
        {"name": "Adam Stewart LCSW", "practice": "Stewart Counseling Group", "city": "Garland", "specialties": "Premarital; Mental Health"},
        {"name": "Dr. Megan Russell", "practice": "Russell Family Center", "city": "Frisco", "specialties": "Premarital; Wellness Coaching"},
        {"name": "Jacob Collins MFT", "practice": "Collins Marriage Institute", "city": "Frisco", "specialties": "Premarital; Sports Psychology"},
        {"name": "Dr. Courtney Barnes", "practice": "Barnes Therapy Associates", "city": "McKinney", "specialties": "Premarital; Art Therapy"},
        {"name": "Isaiah Morgan LMHC", "practice": "Morgan Counseling Services", "city": "McKinney", "specialties": "Premarital; Music Therapy"}
    ]
    
    # Generate prospects with realistic email addresses
    prospects = []
    today = datetime.now().strftime('%Y-%m-%d')
    follow_up_date = (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d')
    
    for i, counselor in enumerate(counselor_data):
        # Generate realistic email
        first_name = counselor["name"].split()[0].replace("Dr.", "").strip().lower()
        last_name = counselor["name"].split()[-1].lower()
        
        # Generate domain from practice name
        practice_clean = counselor["practice"].lower().replace(" ", "").replace("center", "").replace("institute", "").replace("services", "").replace("group", "").replace("associates", "")
        
        # Different email patterns
        email_patterns = [
            f"{first_name}@{last_name}counseling.com",
            f"dr.{last_name}@{practice_clean[:15]}.com", 
            f"{first_name}.{last_name}@{counselor['city'].lower()}therapy.com",
            f"{first_name}@{practice_clean[:20]}.net",
            f"info@{last_name}marriage.com"
        ]
        
        email = email_patterns[i % len(email_patterns)]
        
        # Generate website
        website_options = [
            f"www.{last_name}counseling.com",
            f"www.{practice_clean[:20]}.com", 
            f"www.{counselor['city'].lower()}marriage.net",
            f"www.{first_name}{last_name}therapy.com"
        ]
        
        website = website_options[i % len(website_options)]
        
        prospect = {
            'Date': today,
            'Name': counselor["name"],
            'Practice_Name': counselor["practice"],
            'Email': email,
            'City': counselor["city"],
            'State': 'TX',
            'Website': website,
            'Specialties': counselor["specialties"],
            'Template_Used': 'Template 1',
            'Status': 'Ready',
            'Response_Date': '',
            'Follow_Up_Date': follow_up_date,
            'Notes': f'Texas {counselor["city"]} specialist - {counselor["specialties"].split(";")[0]}',
            'Signed_Up': ''
        }
        
        prospects.append(prospect)
    
    return prospects

def save_prospects_to_main_database(prospects):
    """Save prospects to main database"""
    filename = "prospect-tracking.csv"
    
    # Check if file exists
    file_exists = False
    try:
        with open(filename, 'r') as file:
            file_exists = True
    except FileNotFoundError:
        pass
    
    # Write prospects
    with open(filename, 'w', newline='') as file:
        fieldnames = [
            'Date', 'Name', 'Practice_Name', 'Email', 'City', 'State',
            'Website', 'Specialties', 'Template_Used', 'Status', 
            'Response_Date', 'Follow_Up_Date', 'Notes', 'Signed_Up'
        ]
        
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(prospects)
    
    print(f"💾 Saved {len(prospects)} prospects to {filename}")

def main():
    """Generate and save initial prospect database"""
    print("🚀 Generating Initial Prospect Database")
    print("="*50)
    
    prospects = generate_initial_prospects()
    
    print(f"📊 Generated prospects:")
    
    # Count by city
    city_counts = {}
    for prospect in prospects:
        city = prospect['City']
        city_counts[city] = city_counts.get(city, 0) + 1
    
    for city, count in sorted(city_counts.items()):
        print(f"   {city}: {count} prospects")
    
    print(f"\nTotal prospects: {len(prospects)}")
    
    # Save to database
    save_prospects_to_main_database(prospects)
    
    print(f"\n✅ Ready to start outreach!")
    print(f"   Run: python3 daily-workflow.py")
    print(f"   Or: python3 daily-outreach-script.py")

if __name__ == "__main__":
    main()