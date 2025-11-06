#!/usr/bin/env python3
"""
Enhanced Psychology Today Scraper for Premarital Counselors
Version 12.2 - Final Bug Fixes
Integrates undetected-chromedriver, robust element waiting, cookie/challenge handling,
and enhanced timeout diagnostics to improve scraping reliability.
"""

import time
import json
import re
import logging
import sys
import argparse
from datetime import datetime
from typing import List, Dict, Optional
import os

# Make sure to install necessary libraries:
# pip install selenium beautifulsoup4 undetected-chromedriver
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from bs4 import BeautifulSoup

# --- Enhanced Configuration ---

# State name to 2-letter code mapping
STATE_CODES = {
    'alabama': 'al', 'alaska': 'ak', 'arizona': 'az', 'arkansas': 'ar', 'california': 'ca',
    'colorado': 'co', 'connecticut': 'ct', 'delaware': 'de', 'florida': 'fl', 'georgia': 'ga',
    'hawaii': 'hi', 'idaho': 'id', 'illinois': 'il', 'indiana': 'in', 'iowa': 'ia',
    'kansas': 'ks', 'kentucky': 'ky', 'louisiana': 'la', 'maine': 'me', 'maryland': 'md',
    'massachusetts': 'ma', 'michigan': 'mi', 'minnesota': 'mn', 'mississippi': 'ms', 'missouri': 'mo',
    'montana': 'mt', 'nebraska': 'ne', 'nevada': 'nv', 'new-hampshire': 'nh', 'new-jersey': 'nj',
    'new-mexico': 'nm', 'new-york': 'ny', 'north-carolina': 'nc', 'north-dakota': 'nd', 'ohio': 'oh',
    'oklahoma': 'ok', 'oregon': 'or', 'pennsylvania': 'pa', 'rhode-island': 'ri', 'south-carolina': 'sc',
    'south-dakota': 'sd', 'tennessee': 'tn', 'texas': 'tx', 'utah': 'ut', 'vermont': 'vt',
    'virginia': 'va', 'washington': 'wa', 'west-virginia': 'wv', 'wisconsin': 'wi', 'wyoming': 'wy'
}

CONFIG = {
    "min_score_threshold": 15,
    "selectors": {
        "listing_container": [
            "[data-qa='result-listing']",
            "article[data-test='therapist-result']",
            "li[data-test='search-result']",
            "div.results-row"
        ],
        "name": [
            "a.profile-title", "h3.profile-title a", "div.profile-title a",
            "a[href*='/therapists/']", ".profile-title"
        ],
        "credentials": [
            "div.profile-subtitle-credentials", "div.profile-subtitle",
            "span.credentials", "div.profile-credentials", ".credentials"
        ],
        "location": [
            "div.profile-location span.address", "div.profile-location",
            "span.address", "div.location", ".profile-location"
        ],
        "phone": [
            "span.results-row-phone", "a.results-row-phone-sm", "div.profile-phone",
            "span.phone", "a[href^='tel:']", ".phone"
        ],
        "profile_url": [
            "a.profile-title", "a.results-row-cta-view", "h3.profile-title a",
            "div.profile-title a", "a[href*='/therapists/']"
        ],
        "description": [
            "div.statements", "div.profile-statement", "div.profile-statements",
            "div.statement", "p.statement", ".statements"
        ],
        "verified_badge": [
            "div.verified-badge", "span.verified", ".verified-badge", ".verified"
        ]
    },
    "base_url_template": "https://www.psychologytoday.com/us/therapists/{state_code}/{city}?category=couples-counseling",
    "scoring": {
        "tier1_indicators": {
            'prepare/enrich': 100, 'prepare enrich': 100, 'gottman': 60, 'eft': 60,
            'emotionally focused therapy': 60, 'marriage preparation': 80, 'engagement counseling': 90
        },
        "tier2_indicators": {
            'mft': 40, 'lmft': 40, 'marriage and family therapy': 40, 'marriage & family therapy': 40,
            'couples therapy': 20, 'couples counseling': 20, 'relationship therapy': 18
        },
        "tier3_indicators": {
            'marriage counseling': 20, 'relationship counseling': 18, 'family therapy': 15,
            'communication': 10, 'conflict resolution': 15
        },
        "faith_indicators": {
            'christian': 30, 'faith-based': 30, 'spiritual': 25, 'pastoral': 30,
            'biblical': 25, 'religious': 20, 'church': 15, 'prayer': 10
        },
        "penalties": {
            'child therapy': -15, 'adolescent': -15, 'teen': -15,
            'addiction': -10, 'substance abuse': -10,
        },
        "credential_bonuses": {
            "mft_credential": 15, "verified_profile": 5
        }
    },
    "tier_thresholds": {
        "tier1": 80, "tier2": 30, "tier3": 15
    }
}

def setup_logging():
    """Sets up a standardized logging configuration."""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

def load_test_targets(filename='test-targets.txt'):
    """Load state and city combinations from a file."""
    targets = []
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    parts = line.split(',')
                    if len(parts) >= 2:
                        state = parts[0].strip().lower()
                        city = parts[1].strip().lower()
                        targets.append((state, city))
                    else:
                        logging.warning(f"Invalid line format in {filename}: {line}")
        logging.info(f"Loaded {len(targets)} target locations from {filename}")
        return targets
    except FileNotFoundError:
        logging.error(f"Could not find {filename}. Please create this file with state,city pairs.")
        return []
    except Exception as e:
        logging.error(f"Error reading {filename}: {e}")
        return []

def parse_arguments():
    """Parses command-line arguments."""
    parser = argparse.ArgumentParser(description='Scrape Psychology Today for premarital counselors.')
    parser.add_argument('--max-pages', type=int, default=5, help='Max pages per location.')
    parser.add_argument('--targets-file', type=str, default='test-targets.txt', help='File with state,city pairs.')
    parser.add_argument('--no-headless', action='store_false', dest='headless', help='Run in visible mode.')
    parser.set_defaults(headless=True)
    return parser.parse_args()

class EnhancedScalpelScraper:
    """A resilient scraper with anti-bot evasion and robust error handling."""

    def __init__(self, state: str, city: str, headless: bool, max_pages: int):
        self.driver: Optional[uc.Chrome] = None
        self.headless = headless
        self.state = state.lower()
        self.city = city.lower().replace(' ', '-')
        self.max_pages = max_pages
        self.config = CONFIG
        self.state_code = STATE_CODES.get(self.state, self.state)
        if self.state_code == self.state and self.state not in STATE_CODES.values():
            logging.warning(f"⚠️ State code not found for '{self.state}', using as-is")
        self.base_url = self.config['base_url_template'].format(state_code=self.state_code, city=self.city)
        self.setup_driver()

    def setup_driver(self):
        """Configures the undetected_chromedriver for resilience."""
        try:
            chrome_options = uc.ChromeOptions()
            if self.headless:
                chrome_options.headless = True
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--window-size=1920,1080")
            chrome_options.add_argument("accept-language=en-US,en;q=0.9")
            
            # Let undetected-chromedriver automatically find the correct driver version
            self.driver = uc.Chrome(options=chrome_options)
            self.driver.set_page_load_timeout(60)
            logging.info("✅ Enhanced WebDriver setup (UC) complete.")
        except Exception as e:
            logging.error(f"❌ Failed to set up UC driver: {e}", exc_info=True)
            raise

    def accept_cookies_if_present(self):
        """Handles cookie consent banners to prevent them from blocking content."""
        try:
            # OneTrust (most common)
            btn = WebDriverWait(self.driver, 5).until(
                EC.element_to_be_clickable((By.ID, "onetrust-accept-btn-handler"))
            )
            btn.click()
            logging.info("✅ Accepted OneTrust cookie banner.")
            time.sleep(0.5) # Allow banner to disappear
            return True
        except Exception:
            pass # No OneTrust banner found
        
        # Fallback for other generic buttons
        try:
            btn = WebDriverWait(self.driver, 3).until(
                EC.element_to_be_clickable((By.XPATH, "//button[.//text()[contains(., 'Accept') or contains(., 'Agree')]]"))
            )
            btn.click()
            logging.info("✅ Accepted fallback cookie banner.")
            time.sleep(0.5)
            return True
        except Exception:
            logging.debug("No cookie banner found or could not be clicked.")
            return False

    def is_blocked(self) -> bool:
        """Checks if the page content indicates a security block or challenge."""
        html = self.driver.page_source.lower()
        signals = [
            "access denied", "verify you are a human", "are you a human",
            "temporarily blocked", "unusual traffic", "blocked by security rules"
        ]
        return any(s in html for s in signals)

    def ensure_full_page_load(self):
        """Scrolls the page to trigger lazy-loading of all listings."""
        try:
            logging.debug("🔄 Scrolling to load all content...")
            last_height = self.driver.execute_script("return document.body.scrollHeight")
            while True:
                self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(2) # Wait for new content to load
                new_height = self.driver.execute_script("return document.body.scrollHeight")
                if new_height == last_height:
                    break
                last_height = new_height
            logging.debug("✅ Full page scrolling complete.")
        except Exception as e:
            logging.warning(f"⚠️ Error during full page loading scroll: {e}")

    def scrape_enhanced(self) -> (List[Dict], int):
        """Main scraping method with integrated resiliency features."""
        all_therapists: Dict[str, Dict] = {}
        total_scraped = 0
        
        logging.info(f"🎯 Engaging target: {self.base_url}")
        
        for page in range(1, self.max_pages + 1):
            current_url = f"{self.base_url}&page={page}"
            logging.info(f"📄 Scraping page {page}: {current_url}")

            if page > 1:
                time.sleep(abs(1.5 + (0.5 - time.time() % 1)))  # Small random delay

            # --- Page Load with Retry ---
            try:
                self.driver.get(current_url)
            except Exception as e:
                logging.error(f"❌ Page load failed for {current_url}: {e}")
                break

            # --- Post-Load Checks ---
            if self.is_blocked():
                logging.error("🚫 Blocked/challenged by site. Saving artifacts and stopping.")
                ts = int(time.time())
                self.driver.save_screenshot(f"blocked_{self.city}_{ts}.png")
                with open(f"blocked_{self.city}_{ts}.html", "w", encoding="utf-8") as f:
                    f.write(self.driver.page_source)
                return [], total_scraped

            self.accept_cookies_if_present()

            # --- Wait for Real Content ---
            try:
                results_selector = ",".join([
                    "[data-qa='result-listing']",
                    "article[data-test='therapist-result']",
                    "div.results-row"
                ])
                WebDriverWait(self.driver, 30).until(
                    EC.presence_of_all_elements_located((By.CSS_SELECTOR, results_selector))
                )
            except TimeoutException:
                ts = int(time.time())
                self.driver.save_screenshot(f"timeout_{self.city}_{page}_{ts}.png")
                with open(f"timeout_{self.city}_{page}_{ts}.html", "w", encoding="utf-8") as f:
                    f.write(self.driver.page_source)
                logging.warning(f"⏰ Timeout waiting for results on page {page}. Artifacts saved. Assuming end of results.")
                break

            self.ensure_full_page_load()
            soup = BeautifulSoup(self.driver.page_source, 'html.parser')
            listings = self._extract_listings_enhanced(soup)

            if not listings:
                logging.info(f"No more listings found on page {page}. Ending operation for this location.")
                break
            
            total_scraped += len(listings)
            logging.info(f"🔍 Found {len(listings)} listings on page {page}")

            for row in listings:
                therapist = self._parse_listing_enhanced(row)
                if therapist and self._is_valid_listing(therapist):
                    score = self._calculate_tiered_score(therapist)
                    therapist['premarital_score'] = score
                    therapist['tier'] = self._determine_tier(score)
                    
                    if score >= self.config['min_score_threshold']:
                        unique_key = therapist.get('profile_url') or therapist.get('name')
                        if unique_key not in all_therapists:
                            all_therapists[unique_key] = therapist
                            logging.debug(f"  ✅ Qualified: {therapist.get('name')} (Score: {score})")
        
        # This block now runs AFTER the page loop is complete
        qualified_therapists = sorted(all_therapists.values(), key=lambda x: x['premarital_score'], reverse=True)
        return qualified_therapists, total_scraped

    def _extract_listings_enhanced(self, soup: BeautifulSoup) -> List[BeautifulSoup]:
        """Extracts listing elements using a prioritized list of modern selectors."""
        selectors = [
            "[data-qa='result-listing']",
            "article[data-test='therapist-result']",
            "li[data-test='search-result']",
            "div.results-row"
        ]
        for sel in selectors:
            found = soup.select(sel)
            if found:
                logging.debug(f"Found {len(found)} listings with selector: '{sel}'")
                return found
        logging.warning("⚠️ No listings found with any of the defined selectors.")
        return []

    def _parse_listing_enhanced(self, row: BeautifulSoup) -> Optional[Dict]:
        """Parses a single listing element using fallback selectors."""
        data = {
            'name': self._extract_with_fallbacks(row, 'name'),
            'profile_url': self._extract_profile_url_enhanced(row),
            'phone': self._extract_phone_enhanced(row),
            'description': self._extract_with_fallbacks(row, 'description'),
            'is_verified': bool(row.select_one(",".join(self.config['selectors']['verified_badge']))),
            'full_text': row.get_text(separator=' ', strip=True)
        }
        data.update(self._extract_credentials_enhanced(row))
        data.update(self._extract_location_enhanced(row))
        return data

    def _extract_with_fallbacks(self, row: BeautifulSoup, field_name: str) -> Optional[str]:
        """Generic text extraction with fallbacks."""
        for selector in self.config['selectors'].get(field_name, []):
            element = row.select_one(selector)
            if element and element.get_text(strip=True):
                return element.get_text(strip=True)
        return None
    
    def _extract_profile_url_enhanced(self, row: BeautifulSoup) -> Optional[str]:
        """Extracts profile URL with fallbacks."""
        for selector in self.config['selectors']['profile_url']:
            element = row.select_one(selector)
            if element and element.has_attr('href'):
                href = element['href']
                if href.startswith('http'):
                    return href
                return f'https://www.psychologytoday.com{href}'
        return None

    def _extract_phone_enhanced(self, row: BeautifulSoup) -> Optional[str]:
        """Extracts phone number with fallbacks."""
        for selector in self.config['selectors']['phone']:
            element = row.select_one(selector)
            if element:
                phone_text = element.get_text(strip=True) or (element.get('href', 'tel:')).replace('tel:', '')
                if phone_text:
                    return re.sub(r'[^\d\-\(\)\s\+]', '', phone_text)
        return None

    def _extract_credentials_enhanced(self, row: BeautifulSoup) -> Dict:
        """Extracts credentials."""
        creds = self._extract_with_fallbacks(row, 'credentials')
        is_mft = bool(creds and ('MFT' in creds.upper() or 'LMFT' in creds.upper()))
        return {'credentials': creds, 'is_mft': is_mft}

    def _extract_location_enhanced(self, row: BeautifulSoup) -> Dict:
        """Extracts location data."""
        loc_text = self._extract_with_fallbacks(row, 'location')
        if not loc_text:
            return {'city': None, 'state': None, 'full_location': None}
        parts = [p.strip() for p in loc_text.split(',')]
        city = parts[0] if parts else None
        state = parts[1] if len(parts) > 1 else None
        return {'city': city, 'state': state, 'full_location': loc_text}

    def _is_valid_listing(self, data: Dict) -> bool:
        """Validates minimum required data for a listing."""
        return bool(data.get('name') and data.get('profile_url'))

    def _calculate_tiered_score(self, therapist_data: Dict) -> int:
        """Calculates a relevance score based on keywords and credentials."""
        score = 0
        text = therapist_data.get('full_text', '').lower()
        
        scoring_rules = {**self.config['scoring']['tier1_indicators'],
                         **self.config['scoring']['tier2_indicators'],
                         **self.config['scoring']['tier3_indicators'],
                         **self.config['scoring']['faith_indicators'],
                         **self.config['scoring']['penalties']}

        for keyword, value in scoring_rules.items():
            if keyword in text:
                score += value
        
        if therapist_data.get('is_mft'):
            score += self.config['scoring']['credential_bonuses']['mft_credential']
        if therapist_data.get('is_verified'):
            score += self.config['scoring']['credential_bonuses']['verified_profile']
            
        return max(0, score)

    def _determine_tier(self, score: int) -> str:
        """Determines tier classification based on score."""
        if score >= self.config['tier_thresholds']['tier1']: return "Tier 1 - Confirmed"
        if score >= self.config['tier_thresholds']['tier2']: return "Tier 2 - Probable"
        if score >= self.config['tier_thresholds']['tier3']: return "Tier 3 - Potential"
        return "Below Threshold"

    def save_results(self, therapists: List[Dict], total_scraped: int):
        """Saves qualified leads and analytics to JSON files."""
        if not therapists:
            logging.warning("No qualified leads found to save.")
            return

        timestamp = datetime.now().strftime("%Y%m%d_%H%M")
        location_clean = f"{self.state.replace(' ', '_')}_{self.city.replace(' ', '_')}"
        
        # Create output directory if it doesn't exist
        output_dir = "scraped_results"
        os.makedirs(output_dir, exist_ok=True)
        
        # Save all qualified results
        filename = os.path.join(output_dir, f"leads_{location_clean}_{timestamp}.json")
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(therapists, f, indent=4, ensure_ascii=False)
        
        logging.info(f"💾 Saved {len(therapists)} qualified leads to {filename}")
        
    def close(self):
        """Closes the Selenium WebDriver."""
        if self.driver:
            self.driver.quit()
            logging.info("✅ WebDriver closed.")

def main():
    """Main execution function."""
    setup_logging()
    args = parse_arguments()
    
    targets = load_test_targets(args.targets_file)
    if not targets:
        sys.exit(1)
    
    for i, (state, city) in enumerate(targets, 1):
        logging.info(f"\n{'='*60}\n🎯 TARGET {i}/{len(targets)}: {city.title()}, {state.upper()}\n{'='*60}")
        
        scraper = None
        try:
            scraper = EnhancedScalpelScraper(state, city, args.headless, args.max_pages)
            therapists, total_scraped = scraper.scrape_enhanced()
            if therapists:
                scraper.save_results(therapists, total_scraped)
            else:
                logging.info(f"No qualified therapists found for {city.title()}, {state.upper()}.")
        except Exception as e:
            logging.error(f"❌ An unhandled error occurred for {city.title()}: {e}", exc_info=True)
        finally:
            if scraper:
                scraper.close()
        
        if i < len(targets):
            time.sleep(5) # Pause between different locations

    logging.info(f"\n{'='*60}\n✅ Operation complete.\n{'='*60}")

if __name__ == "__main__":
    main()