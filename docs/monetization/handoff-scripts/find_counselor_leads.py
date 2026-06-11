"""
find_counselor_leads.py

Daily lead-finder for the Wedding Counselors directory outreach.

Strategy:
  1. SERP-search for premarital/couples therapist practice websites in a
     daily-rotating US state.
  2. For each result domain, scrape the contact + homepage via Jina Reader.
  3. Extract emails. Keep ONLY emails whose domain matches the practice's
     own website domain — this is the "real practice with custom inbox" signal.
  4. Hard-reject free email providers (gmail/yahoo/hotmail/etc.) defensively.
  5. Reject directory aggregators (psychologytoday.com etc.) since the goal
     is to email practices, not the directories listing them.
  6. Dedupe vs existing Lead rows. Insert up to DAILY_LEAD_CAP per run.
  7. Attach to the 'Wedding Counselors [A] Social Proof' campaign so the
     existing send pipeline picks them up.

Why this approach: a previous 744-lead seed list sourced via raw SERP email
extraction was heavy with @gmail.com addresses and converted at ~0%. The
custom-domain-match filter is the cheapest reliable signal that the lead
runs a real practice with budget for a $29/mo listing.

Run: python find_counselor_leads.py [--limit 50] [--dry-run]
"""

import argparse
import logging
import os
import random
import re
import sys
import time
from datetime import datetime, timezone
from typing import Dict, List, Optional, Set, Tuple
from urllib.parse import urlparse

import requests
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app
from models import Campaign, CampaignLead, Lead, db

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

DAILY_LEAD_CAP = int(os.getenv("LEAD_FINDER_DAILY_CAP", "50"))
TARGET_CAMPAIGN_NAME = "Wedding Counselors [A] Social Proof"
SOURCE_TAG = "therapyden_serp_v1"
MAX_SEARCHES_PER_RUN = 25  # Soft budget for SERP API calls
FETCH_TIMEOUT_SECONDS = 20
INTER_REQUEST_DELAY_SECONDS = 1.0

BRAVE_API_KEY = os.getenv("BRAVE_API_KEY")
SERPER_API_KEY = os.getenv("SERPER_API_KEY")
JINA_API_KEY = os.getenv("JINA_API_KEY")  # Optional but raises Jina rate limits

# ---------------------------------------------------------------------------
# Filters
# ---------------------------------------------------------------------------

# Emails from these providers are rejected outright (the gmail-leads-are-trash rule).
FREE_EMAIL_DOMAINS: Set[str] = {
    "gmail.com", "googlemail.com",
    "yahoo.com", "yahoo.co.uk", "yahoo.ca", "ymail.com", "rocketmail.com",
    "hotmail.com", "hotmail.co.uk", "hotmail.ca",
    "outlook.com", "live.com", "msn.com",
    "aol.com", "aim.com",
    "icloud.com", "me.com", "mac.com",
    "protonmail.com", "proton.me", "pm.me",
    "gmx.com", "gmx.us", "gmx.net",
    "fastmail.com", "fastmail.fm",
    "zoho.com", "zohomail.com",
    "yandex.com", "yandex.ru",
    "tutanota.com", "tutanota.de", "tuta.io",
    "mail.com", "email.com",
    "comcast.net", "verizon.net", "att.net", "sbcglobal.net",
    "bellsouth.net", "cox.net", "earthlink.net",
}

# Domains that aggregate listings — we want their listed practices, not them.
DIRECTORY_DENYLIST: Set[str] = {
    "psychologytoday.com", "therapyden.com", "goodtherapy.org",
    "betterhelp.com", "talkspace.com", "yelp.com", "healthgrades.com",
    "zocdoc.com", "wellness.com", "vitals.com", "ratemds.com",
    "facebook.com", "instagram.com", "linkedin.com", "twitter.com", "x.com",
    "tiktok.com", "youtube.com", "pinterest.com",
    "wikipedia.org", "reddit.com", "quora.com",
    "amazon.com", "google.com", "bing.com",
    "wix.com", "squarespace.com", "wordpress.com", "weebly.com",
    "eventbrite.com", "meetup.com",
    "nytimes.com", "theknot.com", "weddingwire.com", "brides.com",
}

# Mailbox prefixes we always reject (operational, not a person).
REJECTED_PREFIXES: Set[str] = {
    "noreply", "no-reply", "donotreply", "do-not-reply",
    "webmaster", "postmaster", "abuse", "mailer-daemon",
    "bounce", "bounces", "unsubscribe", "marketing", "newsletter",
}

EMAIL_REGEX = re.compile(
    r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}",
    re.IGNORECASE,
)

# ---------------------------------------------------------------------------
# Search query rotation
# ---------------------------------------------------------------------------

US_STATES: List[str] = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
    "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
    "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine",
    "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
    "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
    "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
    "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina",
    "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia",
    "Washington", "West Virginia", "Wisconsin", "Wyoming",
]

QUERY_TEMPLATES: List[str] = [
    '"premarital counseling" "{state}" contact',
    '"premarital counselor" "{state}"',
    '"couples therapy" "{state}" "premarital"',
    '"marriage counselor" "{state}" contact',
    '"couples counseling" "{state}" "premarital"',
]


def todays_state() -> str:
    """Rotate states by day-of-year so each gets ~7 cycles per year."""
    day_of_year = datetime.now(timezone.utc).timetuple().tm_yday
    return US_STATES[day_of_year % len(US_STATES)]


# ---------------------------------------------------------------------------
# SERP search
# ---------------------------------------------------------------------------


def _brave_search(query: str, count: int = 10) -> List[str]:
    if not BRAVE_API_KEY:
        return []
    try:
        resp = requests.get(
            "https://api.search.brave.com/res/v1/web/search",
            headers={"X-Subscription-Token": BRAVE_API_KEY, "Accept": "application/json"},
            params={"q": query, "count": count, "country": "US"},
            timeout=FETCH_TIMEOUT_SECONDS,
        )
        resp.raise_for_status()
        results = resp.json().get("web", {}).get("results", [])
        return [r["url"] for r in results if r.get("url")]
    except Exception as exc:
        logger.warning("Brave search failed for %r: %s", query, exc)
        return []


def _serper_search(query: str, count: int = 10) -> List[str]:
    if not SERPER_API_KEY:
        return []
    try:
        resp = requests.post(
            "https://google.serper.dev/search",
            headers={"X-API-KEY": SERPER_API_KEY, "Content-Type": "application/json"},
            json={"q": query, "num": count, "gl": "us"},
            timeout=FETCH_TIMEOUT_SECONDS,
        )
        resp.raise_for_status()
        return [r["link"] for r in resp.json().get("organic", []) if r.get("link")]
    except Exception as exc:
        logger.warning("Serper search failed for %r: %s", query, exc)
        return []


def search_serp(query: str, count: int = 10) -> List[str]:
    """Try Brave first, then Serper. Returns deduped result URLs."""
    urls = _brave_search(query, count) or _serper_search(query, count)
    seen, deduped = set(), []
    for url in urls:
        if url not in seen:
            seen.add(url)
            deduped.append(url)
    return deduped


# ---------------------------------------------------------------------------
# Page fetching + email extraction
# ---------------------------------------------------------------------------


def jina_fetch(url: str) -> Optional[str]:
    """Fetch a URL via Jina Reader, returning markdown."""
    headers = {"Accept": "text/plain"}
    if JINA_API_KEY:
        headers["Authorization"] = f"Bearer {JINA_API_KEY}"
    try:
        resp = requests.get(
            f"https://r.jina.ai/{url}",
            headers=headers,
            timeout=FETCH_TIMEOUT_SECONDS,
        )
        if resp.status_code == 200:
            return resp.text
        logger.debug("Jina returned %s for %s", resp.status_code, url)
        return None
    except Exception as exc:
        logger.debug("Jina fetch failed for %s: %s", url, exc)
        return None


def base_domain(url_or_email: str) -> str:
    """Return the registrable host (last two labels) for matching purposes."""
    if "@" in url_or_email:
        host = url_or_email.split("@", 1)[1].lower().strip()
    else:
        parsed = urlparse(url_or_email if "://" in url_or_email else f"http://{url_or_email}")
        host = (parsed.hostname or "").lower()
    host = host.lstrip(".")
    if host.startswith("www."):
        host = host[4:]
    parts = host.split(".")
    if len(parts) >= 2:
        return ".".join(parts[-2:])
    return host


def is_acceptable_email(email: str, site_domain: str) -> Tuple[bool, str]:
    """Return (accept, reason). The reason is logged on rejection."""
    email = email.lower().strip()
    if "@" not in email:
        return False, "no @"
    local, domain = email.split("@", 1)
    if local in REJECTED_PREFIXES:
        return False, f"rejected prefix ({local})"
    if base_domain(domain) in FREE_EMAIL_DOMAINS:
        return False, "free email provider"
    if base_domain(domain) != base_domain(site_domain):
        return False, f"domain mismatch ({base_domain(domain)} vs {base_domain(site_domain)})"
    if any(domain.endswith(ext) for ext in (".png", ".jpg", ".gif", ".svg", ".webp")):
        return False, "image filename"
    return True, "ok"


CONTACT_PATHS = ("/contact", "/contact-us", "/contact-me", "/about", "")


def harvest_emails_from_site(site_url: str) -> List[str]:
    """Fetch likely-contact pages on a site and return matching emails."""
    domain = base_domain(site_url)
    if not domain or domain in DIRECTORY_DENYLIST:
        return []

    parsed = urlparse(site_url if "://" in site_url else f"https://{site_url}")
    scheme = parsed.scheme or "https"
    host = parsed.hostname or domain

    found: List[str] = []
    seen: Set[str] = set()
    for path in CONTACT_PATHS:
        page_url = f"{scheme}://{host}{path}"
        markdown = jina_fetch(page_url)
        time.sleep(INTER_REQUEST_DELAY_SECONDS)
        if not markdown:
            continue
        for raw_email in EMAIL_REGEX.findall(markdown):
            email = raw_email.lower().strip(".,;:")
            if email in seen:
                continue
            ok, reason = is_acceptable_email(email, site_url)
            if ok:
                seen.add(email)
                found.append(email)
            else:
                logger.debug("rejected %s on %s: %s", email, page_url, reason)
        if found:
            break  # First page that yields a domain-matched email is enough
    return found


# ---------------------------------------------------------------------------
# Lead persistence
# ---------------------------------------------------------------------------


def get_target_campaign() -> Campaign:
    campaign = Campaign.query.filter_by(name=TARGET_CAMPAIGN_NAME).first()
    if not campaign:
        raise RuntimeError(
            f"Campaign {TARGET_CAMPAIGN_NAME!r} does not exist — run setup_wedding_counselors.py first"
        )
    return campaign


def existing_emails() -> Set[str]:
    rows = db.session.query(Lead.email).all()
    return {row[0].lower() for row in rows if row[0]}


def insert_lead(email: str, site_url: str, state: str, campaign: Campaign) -> bool:
    """Insert a Lead + CampaignLead. Returns True on success."""
    domain = base_domain(site_url)
    company = domain.split(".")[0].replace("-", " ").title() if domain else ""
    lead = Lead(
        email=email,
        website=site_url,
        company=company,
        industry=state,
        source=SOURCE_TAG,
        status="new",
    )
    db.session.add(lead)
    db.session.flush()  # Need lead.id for CampaignLead
    db.session.add(CampaignLead(campaign_id=campaign.id, lead_id=lead.id, status="active"))
    return True


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def run(limit: int, dry_run: bool) -> Dict[str, int]:
    state = todays_state()
    logger.info("Searching for counselor leads in %s (cap=%d, dry_run=%s)", state, limit, dry_run)

    if not (BRAVE_API_KEY or SERPER_API_KEY):
        logger.error("No search API key configured — set BRAVE_API_KEY or SERPER_API_KEY")
        return {"found": 0, "added": 0, "searches": 0}

    queries = [tpl.format(state=state) for tpl in QUERY_TEMPLATES]
    random.shuffle(queries)

    with app.app_context():
        campaign = get_target_campaign() if not dry_run else None
        already_have = existing_emails()
        added = 0
        searches = 0
        candidate_sites: Set[str] = set()

        for query in queries:
            if added >= limit or searches >= MAX_SEARCHES_PER_RUN:
                break
            urls = search_serp(query)
            searches += 1
            logger.info("Query %r → %d results", query, len(urls))
            for url in urls:
                site_domain = base_domain(url)
                if not site_domain or site_domain in DIRECTORY_DENYLIST:
                    continue
                candidate_sites.add(f"https://{site_domain}")

        logger.info("Evaluating %d candidate sites", len(candidate_sites))

        for site in candidate_sites:
            if added >= limit:
                break
            emails = harvest_emails_from_site(site)
            if not emails:
                continue
            for email in emails:
                if email in already_have:
                    continue
                if dry_run:
                    logger.info("[dry-run] would add %s (from %s)", email, site)
                else:
                    insert_lead(email, site, state, campaign)
                    db.session.commit()
                    logger.info("added %s (from %s)", email, site)
                already_have.add(email)
                added += 1
                if added >= limit:
                    break

        summary = {"found": len(candidate_sites), "added": added, "searches": searches, "state": state}
        logger.info("Run complete: %s", summary)
        return summary


def main() -> int:
    parser = argparse.ArgumentParser(description="Find premarital counselor leads with custom-domain emails")
    parser.add_argument("--limit", type=int, default=DAILY_LEAD_CAP)
    parser.add_argument("--dry-run", action="store_true", help="Search and filter but do not write to DB")
    args = parser.parse_args()
    run(limit=args.limit, dry_run=args.dry_run)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
