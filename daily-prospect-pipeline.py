#!/usr/bin/env python3
"""
Daily Prospect Pipeline Automation
Continuously finds new prospects and feeds them into the outreach system
"""

import csv
import json
import os
from datetime import datetime, timedelta
import random
import time
from prospect_finder import ProspectFinder

class DailyProspectPipeline:
    def __init__(self):
        self.finder = ProspectFinder()
        self.config_file = "pipeline_config.json"
        self.load_config()
        
    def load_config(self):
        """Load pipeline configuration"""
        default_config = {
            "target_cities": [
                "Austin, TX", "Houston, TX", "Dallas, TX", "San Antonio, TX",
                "Fort Worth, TX", "El Paso, TX", "Arlington, TX", "Corpus Christi, TX",
                "Plano, TX", "Lubbock, TX", "Irving, TX", "Garland, TX",
                "Frisco, TX", "McKinney, TX", "Grand Prairie, TX"
            ],
            "daily_prospect_target": 25,
            "prospects_per_city": 8,
            "city_rotation_days": 7,
            "research_sources": ["psychology_today", "google_search", "licensing_boards"],
            "last_research_date": "",
            "current_city_index": 0,
            "total_prospects_found": 0
        }
        
        try:
            with open(self.config_file, 'r') as file:
                self.config = json.load(file)
                
            # Add any missing keys from default
            for key, value in default_config.items():
                if key not in self.config:
                    self.config[key] = value
                    
        except FileNotFoundError:
            self.config = default_config
            self.save_config()
    
    def save_config(self):
        """Save pipeline configuration"""
        with open(self.config_file, 'w') as file:
            json.dump(self.config, file, indent=4)
    
    def get_todays_target_cities(self):
        """Get cities to research today based on rotation"""
        total_cities = len(self.config["target_cities"])
        cities_per_day = 3  # Research 3 cities per day
        
        # Calculate starting index based on rotation
        today_index = self.config["current_city_index"]
        
        # Get cities for today
        target_cities = []
        for i in range(cities_per_day):
            city_index = (today_index + i) % total_cities
            target_cities.append(self.config["target_cities"][city_index])
        
        # Update index for tomorrow
        self.config["current_city_index"] = (today_index + cities_per_day) % total_cities
        self.save_config()
        
        return target_cities
    
    def check_prospect_database_status(self):
        """Check current status of prospect database"""
        try:
            with open("prospect-tracking.csv", 'r') as file:
                reader = csv.DictReader(file)
                prospects = list(reader)
            
            # Count by status
            ready_count = len([p for p in prospects if p.get('Status') == 'Ready'])
            sent_count = len([p for p in prospects if p.get('Status') == 'Sent'])
            responded_count = len([p for p in prospects if p.get('Response_Date')])
            
            # Count recent additions
            today = datetime.now().strftime('%Y-%m-%d')
            yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
            
            today_added = len([p for p in prospects if p.get('Date') == today])
            yesterday_added = len([p for p in prospects if p.get('Date') == yesterday])
            
            return {
                'total_prospects': len(prospects),
                'ready_to_contact': ready_count,
                'already_contacted': sent_count,
                'responses_received': responded_count,
                'added_today': today_added,
                'added_yesterday': yesterday_added
            }
            
        except FileNotFoundError:
            return {
                'total_prospects': 0,
                'ready_to_contact': 0,
                'already_contacted': 0,
                'responses_received': 0,
                'added_today': 0,
                'added_yesterday': 0
            }
    
    def calculate_prospects_needed(self):
        """Calculate how many new prospects we need today"""
        status = self.check_prospect_database_status()
        
        # We want to maintain at least 50 prospects ready to contact
        min_ready_prospects = 50
        current_ready = status['ready_to_contact']
        
        # Base need
        prospects_needed = max(0, min_ready_prospects - current_ready)
        
        # Add daily target (for growth)
        prospects_needed += self.config["daily_prospect_target"]
        
        # If we're just starting (fewer than 100 total), be more aggressive
        if status['total_prospects'] < 100:
            prospects_needed = max(prospects_needed, 30)
        
        return min(prospects_needed, 50)  # Cap at 50 per day to avoid overwhelming
    
    def run_daily_prospect_research(self):
        """Run today's prospect research"""
        print(f"🔍 Starting daily prospect research - {datetime.now().strftime('%Y-%m-%d')}")
        print("="*70)
        
        # Check current status
        status = self.check_prospect_database_status()
        print(f"📊 Current Database Status:")
        print(f"   Total prospects: {status['total_prospects']}")
        print(f"   Ready to contact: {status['ready_to_contact']}")
        print(f"   Already contacted: {status['already_contacted']}")
        print(f"   Responses received: {status['responses_received']}")
        
        # Calculate how many we need
        prospects_needed = self.calculate_prospects_needed()
        print(f"\n🎯 Target: Find {prospects_needed} new prospects today")
        
        if prospects_needed <= 0:
            print("✅ Prospect database is well-stocked. No research needed today.")
            return
        
        # Get today's target cities
        target_cities = self.get_todays_target_cities()
        print(f"🏙️ Today's target cities: {', '.join(target_cities)}")
        
        # Research each city
        all_new_prospects = []
        prospects_per_city = max(1, prospects_needed // len(target_cities))
        
        for city_state in target_cities:
            city, state = [x.strip() for x in city_state.split(',')]
            print(f"\n🔍 Researching {city}, {state}")
            
            try:
                prospects = self.finder.research_city_comprehensive(
                    city, state, prospects_per_city
                )
                all_new_prospects.extend(prospects)
                
                print(f"   ✅ Found {len(prospects)} prospects in {city}")
                
                # Be respectful - delay between cities
                if city_state != target_cities[-1]:  # Don't delay after last city
                    delay = random.uniform(10, 20)
                    print(f"   ⏳ Waiting {delay:.1f} seconds before next city...")
                    time.sleep(delay)
                
            except Exception as e:
                print(f"   ❌ Error researching {city}: {e}")
                continue
        
        # Save and export results
        if all_new_prospects:
            # Save raw research data
            research_filename = f"research_{datetime.now().strftime('%Y%m%d')}.csv"
            self.finder.save_prospects_to_csv(all_new_prospects, research_filename)
            
            # Add to main outreach database
            added_count = self.finder.export_to_outreach_system(all_new_prospects)
            
            # Update config
            self.config["total_prospects_found"] += len(all_new_prospects)
            self.config["last_research_date"] = datetime.now().strftime('%Y-%m-%d')
            self.save_config()
            
            print(f"\n✅ Research Complete!")
            print(f"   Found: {len(all_new_prospects)} total prospects")
            print(f"   Added to outreach: {added_count} new prospects")
            print(f"   Saved details to: {research_filename}")
            
        else:
            print(f"\n⚠️ No new prospects found today")
    
    def analyze_research_performance(self):
        """Analyze research performance over time"""
        try:
            # Get all research files
            research_files = [f for f in os.listdir('.') if f.startswith('research_') and f.endswith('.csv')]
            research_files.sort()
            
            if not research_files:
                print("No research history found")
                return
            
            total_researched = 0
            daily_averages = []
            source_breakdown = {}
            
            for filename in research_files[-7:]:  # Last 7 days
                try:
                    with open(filename, 'r') as file:
                        reader = csv.DictReader(file)
                        prospects = list(reader)
                    
                    total_researched += len(prospects)
                    daily_averages.append(len(prospects))
                    
                    # Count by source
                    for prospect in prospects:
                        source = prospect.get('source', 'Unknown')
                        source_breakdown[source] = source_breakdown.get(source, 0) + 1
                
                except Exception as e:
                    print(f"Error reading {filename}: {e}")
            
            print(f"\n📊 RESEARCH PERFORMANCE (Last 7 Days)")
            print("="*50)
            print(f"Total prospects researched: {total_researched}")
            print(f"Daily average: {sum(daily_averages) / len(daily_averages):.1f}" if daily_averages else "0")
            print(f"Best day: {max(daily_averages)}" if daily_averages else "0")
            print(f"Research sources:")
            for source, count in source_breakdown.items():
                percentage = (count / total_researched) * 100 if total_researched > 0 else 0
                print(f"   {source}: {count} ({percentage:.1f}%)")
        
        except Exception as e:
            print(f"Error analyzing performance: {e}")
    
    def expand_target_cities(self):
        """Expand to new cities when current ones are exhausted"""
        # Additional cities by state
        expansion_cities = {
            'TX': [
                "Amarillo, TX", "Beaumont, TX", "Brownsville, TX", "College Station, TX",
                "Denton, TX", "Killeen, TX", "Midland, TX", "Odessa, TX", 
                "Round Rock, TX", "Sugar Land, TX", "Tyler, TX", "Waco, TX"
            ],
            'CA': [
                "Los Angeles, CA", "San Francisco, CA", "San Diego, CA", "Sacramento, CA",
                "Oakland, CA", "Fresno, CA", "Long Beach, CA", "Santa Ana, CA"
            ],
            'FL': [
                "Miami, FL", "Tampa, FL", "Orlando, FL", "Jacksonville, FL",
                "St. Petersburg, FL", "Tallahassee, FL", "Fort Lauderdale, FL"
            ],
            'NY': [
                "New York, NY", "Buffalo, NY", "Rochester, NY", "Syracuse, NY",
                "Albany, NY", "Yonkers, NY"
            ]
        }
        
        # Add expansion cities to config
        for state, cities in expansion_cities.items():
            for city in cities:
                if city not in self.config["target_cities"]:
                    self.config["target_cities"].append(city)
        
        print(f"🌟 Expanded target cities to {len(self.config['target_cities'])} cities")
        self.save_config()
    
    def generate_pipeline_report(self):
        """Generate comprehensive pipeline report"""
        status = self.check_prospect_database_status()
        
        print(f"\n📊 PROSPECT PIPELINE REPORT - {datetime.now().strftime('%Y-%m-%d')}")
        print("="*70)
        
        # Database status
        print(f"📂 DATABASE STATUS:")
        print(f"   Total prospects in database: {status['total_prospects']}")
        print(f"   Ready for outreach: {status['ready_to_contact']}")
        print(f"   Already contacted: {status['already_contacted']}")
        print(f"   Received responses: {status['responses_received']}")
        
        # Daily activity
        print(f"\n📅 DAILY ACTIVITY:")
        print(f"   Prospects added today: {status['added_today']}")
        print(f"   Prospects added yesterday: {status['added_yesterday']}")
        
        # Pipeline health
        if status['ready_to_contact'] >= 50:
            print(f"✅ Pipeline is healthy (50+ ready prospects)")
        elif status['ready_to_contact'] >= 25:
            print(f"⚠️ Pipeline needs attention (25-49 ready prospects)")
        else:
            print(f"🚨 Pipeline critical (< 25 ready prospects)")
        
        # Conversion metrics
        if status['already_contacted'] > 0:
            response_rate = (status['responses_received'] / status['already_contacted']) * 100
            print(f"\n📈 PERFORMANCE METRICS:")
            print(f"   Overall response rate: {response_rate:.1f}%")
            
            if response_rate >= 8:
                print(f"   ✅ Response rate is excellent (8%+)")
            elif response_rate >= 5:
                print(f"   ✅ Response rate is good (5-7%)")
            else:
                print(f"   ⚠️ Response rate needs improvement (<5%)")
        
        # Research performance
        self.analyze_research_performance()
        
        # Recommendations
        print(f"\n💡 RECOMMENDATIONS:")
        if status['ready_to_contact'] < 25:
            print(f"   🔍 Run prospect research immediately")
        if status['already_contacted'] > 100 and status['responses_received'] / status['already_contacted'] < 0.05:
            print(f"   📝 Review email templates and personalization")
        if status['total_prospects'] > 500:
            print(f"   🚀 Consider expanding to new geographic markets")
        
        print("="*70)

def main():
    """Main function for daily prospect pipeline"""
    pipeline = DailyProspectPipeline()
    
    print("🔄 Daily Prospect Pipeline Manager")
    print("="*40)
    print("1. Run daily prospect research")
    print("2. Check pipeline status")
    print("3. Generate pipeline report") 
    print("4. Analyze research performance")
    print("5. Expand target cities")
    print("6. Configure pipeline settings")
    print("7. Exit")
    
    choice = input("\nSelect option (1-7): ").strip()
    
    if choice == "1":
        pipeline.run_daily_prospect_research()
    
    elif choice == "2":
        status = pipeline.check_prospect_database_status()
        print(f"\n📊 Pipeline Status:")
        for key, value in status.items():
            print(f"   {key.replace('_', ' ').title()}: {value}")
    
    elif choice == "3":
        pipeline.generate_pipeline_report()
    
    elif choice == "4":
        pipeline.analyze_research_performance()
    
    elif choice == "5":
        pipeline.expand_target_cities()
        print("Target cities expanded successfully!")
    
    elif choice == "6":
        print(f"Current settings:")
        print(f"   Daily prospect target: {pipeline.config['daily_prospect_target']}")
        print(f"   Target cities: {len(pipeline.config['target_cities'])}")
        print(f"   Prospects per city: {pipeline.config['prospects_per_city']}")
        
        new_target = input(f"New daily target (current {pipeline.config['daily_prospect_target']}): ")
        if new_target.isdigit():
            pipeline.config['daily_prospect_target'] = int(new_target)
            pipeline.save_config()
            print("Settings updated!")
    
    elif choice == "7":
        print("Goodbye!")
    
    else:
        print("Invalid option!")

if __name__ == "__main__":
    main()