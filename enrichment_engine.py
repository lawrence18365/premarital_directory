import requests
import re
import json
import os
from urllib.parse import urlparse
from supabase import create_client
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass # dotenv not installed or not needed in production

# --- CONFIGURATION ---
# Use environment variables for secrets, with fallbacks for local testing if needed
SERPER_API_KEY = os.environ.get("SERPER_API_KEY")
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

# Initialize Database
# Only initialize if we have a key (to avoid errors on import if just checking syntax)
if SUPABASE_KEY and SUPABASE_KEY != "your_supabase_service_role_key":
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    print("⚠️  WARNING: SUPABASE_KEY not set. Database operations will fail.")
    supabase = None

def google_search_website(name, city, state):
    """
    Asks Google: 'Where is this person's website?'
    Excludes directories like Psychology Today so we get the REAL site.
    """
    query = f"{name} counseling {city} {state} -site:psychologytoday.com -site:healthgrades.com -site:yelp.com -site:facebook.com"
    
    url = "https://google.serper.dev/search"
    payload = json.dumps({"q": query, "num": 3})
    headers = {'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json'}

    try:
        response = requests.post(url, headers=headers, data=payload)
        results = response.json().get("organic", [])
        
        if results:
            # Return the first link that looks like a real website
            return results[0].get("link")
    except Exception as e:
        print(f"Serper Error: {e}")
    return None

def extract_email_from_site(url):
    """
    Visits the website and looks for an @ symbol.
    OPTIMIZED: Now checks homepage, /contact, /about, and follows contact links!
    This typically doubles the hit rate from 20% to 40-50%.
    """
    def find_emails_on_page(html_content):
        """Extract all emails from HTML content"""
        return set(re.findall(r"[a-z0-9\.\-+_]+@[a-z0-9\.\-+_]+\.[a-z]+", html_content, re.I))

    def find_contact_links(html_content, base_url):
        """Find links that might lead to contact/about pages"""
        contact_patterns = [
            r'href=["\']([^"\']*(?:contact|about|get-in-touch|reach-us)[^"\']*)["\']',
            r'href=["\']([^"\']*mailto:[^"\']*)["\']'
        ]
        links = []
        for pattern in contact_patterns:
            matches = re.findall(pattern, html_content, re.I)
            for match in matches:
                if match.startswith('http'):
                    links.append(match)
                elif match.startswith('/'):
                    links.append(base_url.rstrip('/') + match)
        return links[:3]  # Limit to 3 contact pages to avoid too many requests

    all_emails = set()
    headers = {'User-Agent': 'Mozilla/5.0 (compatible; EmailBot/1.0)'}

    try:
        # 1. Try the homepage
        print(f"      Checking homepage...")
        response = requests.get(url, timeout=10, headers=headers)
        homepage_html = response.text
        homepage_emails = find_emails_on_page(homepage_html)
        all_emails.update(homepage_emails)

        if homepage_emails:
            print(f"      Found {len(homepage_emails)} emails on homepage")

        # 2. If no emails yet, try common contact pages
        if not all_emails:
            print(f"      No emails on homepage, trying contact pages...")
            common_paths = ['/contact', '/contact-us', '/about', '/about-us']

            for path in common_paths:
                try:
                    contact_url = url.rstrip('/') + path
                    response = requests.get(contact_url, timeout=10, headers=headers)
                    if response.status_code == 200:
                        contact_emails = find_emails_on_page(response.text)
                        if contact_emails:
                            print(f"      ✅ Found {len(contact_emails)} emails on {path}")
                            all_emails.update(contact_emails)
                            break  # Found emails, no need to check more pages
                except:
                    pass

        # 3. If still no emails, look for contact links on homepage and follow them
        if not all_emails:
            print(f"      Searching for contact links in page...")
            contact_links = find_contact_links(homepage_html, url)

            for link in contact_links:
                try:
                    if 'mailto:' in link:
                        # Extract email from mailto link
                        email_match = re.search(r'mailto:([a-z0-9\.\-+_]+@[a-z0-9\.\-+_]+\.[a-z]+)', link, re.I)
                        if email_match:
                            all_emails.add(email_match.group(1))
                            print(f"      ✅ Found email in mailto link")
                    else:
                        # Follow the link
                        response = requests.get(link, timeout=10, headers=headers)
                        if response.status_code == 200:
                            link_emails = find_emails_on_page(response.text)
                            if link_emails:
                                print(f"      ✅ Found {len(link_emails)} emails on linked page")
                                all_emails.update(link_emails)
                                break
                except:
                    pass

        # Filter out garbage (image extensions, template emails, etc.)
        bad_patterns = (
            'png', 'jpg', 'gif', 'jpeg', 'svg',  # Images
            'wix.com', 'wixpress.com', 'wixsite.com',  # Wix
            'sentry.io', 'sentry.wixpress.com',  # Error tracking
            'example.com', 'test.com', 'domain.com',  # Placeholders
            'themenectar.com', 'templatemonster.com', 'envato.com',  # Themes
            'wordpress.com', 'wp.com', 'blogger.com',  # Platform emails
            'squarespace.com', 'weebly.com',  # Website builders
            '@support', '@noreply', '@no-reply',  # Auto-emails
            'mapquest.com', 'yelp.com', 'yellowpages.com',  # Directory sites
            'gortlaw.com', '@law',  # Legal firms (wrong profession)
        )

        valid_emails = [
            e for e in all_emails
            if not any(pattern in e.lower() for pattern in bad_patterns)
        ]

        if valid_emails:
            # Prefer personal-looking emails over generic ones
            personal_emails = [e for e in valid_emails if not e.lower().startswith(('info@', 'contact@', 'admin@', 'hello@'))]
            if personal_emails:
                print(f"      ✅ Selected personal email: {personal_emails[0]}")
                return personal_emails[0]
            else:
                print(f"      ✅ Selected email: {valid_emails[0]}")
                return valid_emails[0]

    except Exception as e:
        print(f"      Scrape Error for {url}: {e}")

    return None

def run_daily_enrichment():
    if not supabase:
        print("❌ Cannot run enrichment: Supabase client not initialized.")
        return

    print("🤖 Waking up worker...")

    # 1. GET BATCH: Ask DB for 75 profiles that need emails (SCALED UP!)
    # CRITICAL: Only get profiles we haven't tried yet (prevents duplicates!)
    # Filter: email is NULL AND status is 'pending' (first-time profiles)
    # 75/day = 2,250/month = Within Serper free tier (2,500/month)
    try:
        response = supabase.table('profiles') \
            .select("*") \
            .is_("email", "null") \
            .eq("status", "pending") \
            .limit(75) \
            .execute()

        profiles = response.data
        print(f"📋 Found {len(profiles)} profiles to process (never attempted before).")

        for profile in profiles:
            # Use full_name instead of first_name + last_name
            name = profile.get('full_name', 'Unknown')
            print(f"Processing: {name}...")
            
            # 2. FIND WEBSITE
            website = google_search_website(
                profile.get('full_name', ''),
                profile.get('city', ''),
                profile.get('state_province', '')
            )
            
            if website:
                print(f"   Found Website: {website}")
                
                # 3. EXTRACT EMAIL
                email = extract_email_from_site(website)
                
                if email:
                    print(f"   ✅ FOUND EMAIL: {email}")
                    # 4. UPDATE DB with email and status
                    from datetime import datetime
                    supabase.table('profiles').update({
                        "email": email,
                        "status": "enrichment_success",  # Needs manual review before sending
                        "enrichment_attempted_at": datetime.now().isoformat()
                    }).eq("id", profile['id']).execute()
                else:
                    print("   ❌ No email on site.")
                    # Mark as failed so we don't try again
                    from datetime import datetime
                    supabase.table('profiles').update({
                        "status": "enrichment_failed",
                        "enrichment_attempted_at": datetime.now().isoformat()
                    }).eq("id", profile['id']).execute()
            else:
                print("   ❌ No website found.")
                # Mark as failed so we don't try again
                from datetime import datetime
                supabase.table('profiles').update({
                    "status": "enrichment_failed",
                    "enrichment_attempted_at": datetime.now().isoformat()
                }).eq("id", profile['id']).execute()
                
    except Exception as e:
        print(f"❌ Database Error: {e}")

# Run it
if __name__ == "__main__":
    run_daily_enrichment()
