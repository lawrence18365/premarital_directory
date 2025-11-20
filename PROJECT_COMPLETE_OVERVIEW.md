# Wedding Counselors Directory - Complete Project Overview

## 🎯 What This Project Is

**Website:** weddingcounselors.com
**Mission:** Connect engaged couples with qualified premarital counselors, therapists, clergy, and relationship coaches across the United States.

**The Problem We Solve:**
- Couples struggle to find qualified premarital counselors in their area
- Counselors lack visibility and an easy way to reach engaged couples
- Existing directories (Psychology Today) are expensive and generic

**Our Solution:**
- FREE directory for all counselors (no fees, no commitments)
- Location-based search optimized for premarital counseling specifically
- Direct lead generation for counselors
- SEO-optimized for couples searching "premarital counseling [city]"

---

## 📊 Current Status & Metrics

**Growth:**
- **5,000+ monthly impressions** (3 months of growth)
- **1,581 total profiles** in database
- **134 profiles** ready for automated outreach
- **21 profiles contacted** (1 test + 20 from today's campaign)
- **133 remaining** to be contacted over next 4 days

**Traffic Sources:**
- Organic Google search (primary)
- Direct navigation
- Blog content (SEO)
- Counselor referrals

---

## 🏗️ Technical Architecture

### Frontend (React + Vercel)

**Technology Stack:**
- React 18.2.0 with React Router v6
- Hosted on Vercel (serverless)
- Supabase JavaScript SDK for data
- Recharts for analytics visualizations
- React Helmet for SEO
- Stripe integration (ready but not active)

**Key Pages:**

**Public-Facing:**
- **HomePage** - Directory search, featured counselors
- **StatePage** - State landing pages (all 50 states + DC)
- **CityPage** - City-specific directories (major US cities)
- **ProfilePage** - Individual counselor profiles
- **BlogPage** - SEO content on premarital topics
- **AboutPage** - Mission and value proposition

**Professional Portal:**
- **ProfessionalSignup** - Create profile
- **ProfessionalDashboard** - Manage profile, view leads
- **ProfessionalAnalytics** - Track performance
- **ProfessionalLeads** - View couple inquiries

**Admin Portal:**
- **AdminDashboard** - Site-wide metrics
- **ClaimsReview** - Approve profile claims
- **CampaignMonitor** - Track outreach progress
- **CityHealthDashboard** - City-level analytics

### Backend (Supabase PostgreSQL)

**Main Tables:**

1. **`profiles`** (1,581 records)
   - Core counselor information (name, email, phone, website, bio)
   - Professional details (profession, specialties, credentials, years_experience)
   - Location (city, state_province, postal_code)
   - Status tracking (is_claimed, user_id, claimed_at)
   - Tier/monetization (tier, subscription_price, featured_until)
   - Outreach tracking (status: 'ready_to_email' or 'contacted', contacted_at)
   - Analytics (contact_reveals_count, sponsored_rank)
   - Unique slug for URLs

2. **`profile_leads`**
   - Couple inquiries submitted through contact forms
   - Tracks which profiles were contacted
   - Lead source and timestamp

3. **`contact_reveals`**
   - Tracks when couples click to reveal phone/email
   - Includes geolocation data for analytics
   - City-level attribution

4. **`profile_clicks`**
   - Tracks clicks from city pages to profiles
   - Used for conversion rate optimization

5. **`subscription_plans`**
   - Free (current default)
   - Local Featured ($49/month - configured but not active)
   - Area Spotlight ($99/month - configured but not active)

6. **`profile_claims`**
   - Pending claim requests from counselors
   - Admin approval workflow

7. **`posts`**
   - Blog articles for SEO
   - Markdown content support

8. **`city_overrides`**
   - Custom intro text for major cities
   - Overrides AI-generated content

### Automation System (Python + GitHub Actions)

**Daily Automated Workflow:**

```
GitHub Actions (Runs at 9 AM UTC daily)
    ↓
Step 1: enrichment_engine.py
    - Queries profiles without emails
    - Searches Google for each counselor
    - Scrapes their website for email
    - Updates profile with email
    - Sets status = 'ready_to_email'
    ↓
Step 2: auto_send_emails.py
    - Gets daily limit (Day 1: 20, Day 2: 20, Day 3: 30, etc.)
    - Counts emails sent today
    - Loads profiles up to remaining limit
    - Sends via Resend API
    - 30-90 second delays (natural pattern)
    - Updates status = 'contacted'
    - Records contacted_at timestamp
```

**Email Content:**
- **Subject:** "Your profile is live on Wedding Counselors (5K+ monthly impressions)"
- **Key Points:**
  - Profile is already live (creates urgency)
  - 5,000+ impressions in 3 months (social proof)
  - Free forever, no commitments
  - Claim in 2 minutes
  - Already seeing referrals (credibility)
- **Sender Rotation:** Haylee, Lauren, Jessie @weddingcounselors.com
- **Reply-To:** haylee@weddingcounselors.com

**Warm-Up Schedule (Spam Prevention):**
```
Day 1-2:  20 emails/day  → 40 total
Day 3-4:  30 emails/day  → 100 total
Day 5-7:  40 emails/day  → 140+ total (all 133 done!)
Day 8+:   50+ emails/day (for new profiles)
```

**Why Warm-Up Matters:**
- Prevents spam filter triggers
- Protects sender reputation
- Ensures inbox delivery (not spam folder)
- Follows Resend + 2025 industry best practices
- Keeps bounce rate <4%, spam rate <0.08%

---

## 💰 Business Model

**Current Strategy: FREE for All**

Every counselor gets:
- ✅ Complete profile listing
- ✅ Contact information displayed
- ✅ Specialty tags & credentials
- ✅ Location-based search visibility
- ✅ Profile photo upload
- ✅ Professional bio (unlimited length)
- ✅ Direct lead inquiries from couples
- ✅ Email notifications for new leads
- ✅ SEO-optimized listing
- ✅ Mobile-friendly profile
- ✅ Analytics dashboard
- ✅ No fees, no contracts, no commitments

**Future Monetization (Infrastructure Ready):**

**Tier 1: Community (Free - Current)**
- Standard listing
- Basic analytics
- Lead notifications

**Tier 2: Local Featured ($49/month)**
- Featured badge
- Priority placement in city searches
- Enhanced analytics
- Profile boost
- Stripe payment processing ready

**Tier 3: Area Spotlight ($99/month)**
- Top placement
- Featured on multiple city pages
- Premium analytics
- Priority support
- Enhanced visibility

**Revenue Projections (Future):**
- Assumption: 5-10% conversion to paid tiers
- With 1,500 profiles: 75-150 paying = $3,675-$14,850/month
- With 5,000 profiles: 250-500 paying = $12,250-$49,500/month

---

## 🚀 How It Works

### For Engaged Couples:

1. **Search** - Visit weddingcounselors.com
2. **Browse** - Select state, then city
3. **Filter** - By specialty, profession, approach
4. **Review** - Read bios, credentials, specialties
5. **Contact** - Reveal phone/email or submit inquiry form
6. **Connect** - Book session with chosen counselor

### For Counselors:

**Option 1: Direct Signup**
1. Visit /professional/signup
2. Create profile with credentials
3. Add specialties, bio, photo
4. Verify email
5. Profile goes live immediately

**Option 2: Claim Existing Profile**
1. Receive outreach email ("Your profile is live...")
2. Click claim link or visit website
3. Complete profile with additional details
4. Profile ownership transferred

**Option 3: Admin-Sourced**
1. Admin finds counselor (Psychology Today, directories)
2. Creates basic profile
3. Sends claim invitation
4. Counselor claims and enhances

### Profile Management:

Once claimed, counselors can:
- Edit all profile information
- Upload/change profile photo
- Add/remove specialties
- Update contact info
- Set pricing and insurance
- Add booking link (Calendly/Acuity)
- View leads from couples
- Track analytics (contact reveals, clicks)
- Respond to inquiries
- Hide profile temporarily
- Delete account anytime

---

## 📍 Location Coverage

**50 US States + DC** - Complete coverage

**Anchor Cities (Priority SEO Focus):**

**Texas:** Austin, Dallas, Houston, San Antonio
**California:** Los Angeles, San Francisco, San Diego, Sacramento
**Florida:** Miami, Orlando, Tampa, Jacksonville
**New York:** New York City, Buffalo, Rochester, Syracuse
**Illinois:** Chicago, Aurora, Naperville
**Pennsylvania:** Philadelphia, Pittsburgh
**Ohio:** Columbus, Cleveland, Cincinnati
**Georgia:** Atlanta
**North Carolina:** Charlotte, Raleigh
**Michigan:** Detroit
**Arizona:** Phoenix
**Massachusetts:** Boston
**Tennessee:** Nashville, Memphis
**Colorado:** Denver
**Washington:** Seattle
**Indiana:** Indianapolis
**Missouri:** Kansas City, St. Louis
**Wisconsin:** Milwaukee, Madison
**Nevada:** Las Vegas
**Oregon:** Portland
**Oklahoma:** Oklahoma City
**New Mexico:** Albuquerque
**Virginia:** Virginia Beach
**District of Columbia:** Washington DC

Each city page includes:
- SEO-optimized intro (custom or AI-generated)
- Complete directory of local counselors
- Filter by specialty, profession
- FAQ section tailored to location
- Structured data (Schema.org)
- Mobile-optimized
- Analytics tracking

---

## 📈 Growth Strategy

### Phase 1: Build Inventory (Current)
**Goal:** 5,000+ quality counselor profiles

**Tactics:**
- ✅ Scrape Psychology Today for profiles
- ✅ Automated email enrichment (finds emails)
- ✅ Personalized outreach campaign
- ✅ Claim flow optimization
- ✅ Zero acquisition cost

**Status:** 1,581 profiles, 134 ready to contact

### Phase 2: Drive Traffic
**Goal:** 50,000+ monthly visitors

**Tactics:**
- SEO optimization (city pages, blog)
- Google Ads (high-intent keywords)
- Social media (wedding/relationship content)
- Partnership with wedding vendors
- Content marketing (blog)
- Backlink building

**Status:** 5,000+ monthly impressions, growing organically

### Phase 3: Optimize Conversions
**Goal:** 30%+ contact reveal rate

**Tactics:**
- A/B testing profile layouts
- Improve CTAs
- Better specialty filtering
- Enhanced mobile UX
- Trust signals (reviews, credentials)

### Phase 4: Monetization
**Goal:** 5-10% paid tier conversion

**Tactics:**
- Introduce featured listings
- Value-based pricing
- Show ROI (leads generated)
- Premium analytics
- Priority support
- Multi-city packages

---

## 🔍 SEO Strategy

**Target Keywords:**
- "premarital counseling [city]"
- "premarital therapy [city]"
- "couples counseling before marriage [city]"
- "wedding counseling [city]"
- "marriage preparation [city]"
- "engaged couples therapy [city]"

**On-Page SEO:**
- ✅ Optimized title tags (city-specific)
- ✅ Meta descriptions with target keywords
- ✅ H1/H2/H3 hierarchy
- ✅ Structured data (LocalBusiness, Person schemas)
- ✅ Alt text on images
- ✅ Internal linking
- ✅ Mobile-responsive
- ✅ Fast page load (Vercel CDN)

**Content Strategy:**
- City landing pages (50 states + major cities)
- Blog posts on premarital topics
- FAQ sections
- Counselor bios (user-generated content)

**Technical SEO:**
- ✅ XML sitemap
- ✅ Robots.txt
- ✅ Clean URL structure (/state/city, /profile/slug)
- ✅ HTTPS
- ✅ Schema markup
- ✅ Canonical tags

---

## 📊 Analytics & Tracking

**Implemented:**
- Google Analytics - Traffic, behavior, conversions
- Facebook Pixel - Conversion tracking
- Google Ads Pixel - Campaign performance
- Custom tracking:
  - Contact reveals (phone/email clicks)
  - Profile clicks from city pages
  - Lead form submissions
  - Signup sources (UTM parameters)
  - City-level attribution

**Key Metrics Tracked:**
1. **Directory Health:**
   - Total profiles
   - Claimed vs unclaimed
   - Profiles by tier
   - Profiles by city/state

2. **User Engagement:**
   - Monthly visitors
   - Searches per session
   - Contact reveal rate
   - Lead submission rate

3. **Counselor Engagement:**
   - Signup rate
   - Claim rate
   - Profile completion rate
   - Response rate to leads
   - Login frequency

4. **City Performance:**
   - Impressions per city
   - Contact reveals per city
   - Conversion rate by city
   - City "health score"

**Admin Dashboards:**
- Real-time metrics
- 7-day and 30-day trends
- City-level breakdowns
- Campaign performance
- Claims pending review
- Top-performing profiles

---

## 🛠️ Development Setup

**Frontend (React):**
```bash
cd client
npm install
npm start  # Development server
npm run build  # Production build
```

**Environment Variables:**
```bash
# .env file in /client
REACT_APP_SUPABASE_URL=https://bkjwctlolhoxhnoospwp.supabase.co
REACT_APP_SUPABASE_ANON_KEY=<anon_key>
```

**Backend (Supabase):**
- Database hosted on Supabase cloud
- Migrations in /supabase/migrations/
- No local setup required (uses cloud)

**Automation (Python):**
```bash
pip install -r requirements.txt
python3 enrichment_engine.py  # Find emails
python3 auto_send_emails.py   # Send campaign
python3 test_system_status.py # Check status
```

**Environment Variables:**
```bash
# .env file in root
SUPABASE_URL=<production_url>
SUPABASE_KEY=<service_role_key>
SERPER_API_KEY=<serper_key>
RESEND_API_KEY=<resend_key>
```

**Deployment:**
- Frontend: Vercel (auto-deploy from main branch)
- Database: Supabase (cloud-hosted)
- Automation: GitHub Actions (scheduled daily)

---

## 🎯 Success Metrics

**Short-Term (30 Days):**
- [ ] 133 profiles contacted via automation
- [ ] 13-27 responses received (10-20% rate)
- [ ] 4-13 profiles claimed (30-50% conversion)
- [ ] 10,000+ monthly impressions (2x growth)

**Medium-Term (90 Days):**
- [ ] 500+ profiles contacted
- [ ] 50-100 claimed profiles
- [ ] 25,000+ monthly impressions
- [ ] 100+ couple inquiries
- [ ] Top 3 Google ranking for 10+ "[city] premarital counseling" keywords

**Long-Term (1 Year):**
- [ ] 5,000+ profiles in directory
- [ ] 500+ claimed profiles
- [ ] 100,000+ monthly visitors
- [ ] 1,000+ couple inquiries/month
- [ ] $10,000+ MRR from paid tiers
- [ ] Top 3 Google ranking for 100+ keywords

---

## 🔐 Security & Compliance

**Data Protection:**
- HTTPS everywhere
- Supabase Row Level Security (RLS)
- User authentication via Supabase Auth
- Email verification required
- Admin-only access controls

**Privacy:**
- Contact information only revealed on user action
- Analytics anonymized
- GDPR-friendly (can delete account anytime)
- No personal data sold to third parties

**Email Compliance:**
- CAN-SPAM compliant
- Unsubscribe option in every email
- Sender identification clear
- Physical address in footer
- Reply-to functional email

---

## 📁 Key Files Reference

**Frontend:**
- `/client/src/pages/HomePage.jsx` - Main landing page
- `/client/src/pages/CityPage.jsx` - City directory pages
- `/client/src/pages/ProfilePage.jsx` - Individual profiles
- `/client/src/pages/ProfessionalDashboard.jsx` - Counselor portal
- `/client/src/pages/AdminDashboard.jsx` - Admin metrics
- `/client/src/lib/database.js` - Supabase operations
- `/client/src/data/locationConfig.js` - All US cities/states

**Backend:**
- `/supabase/migrations/` - Database schema (33 files)
- Key tables: profiles, profile_leads, contact_reveals, profile_clicks

**Automation:**
- `/enrichment_engine.py` - Email finding
- `/auto_send_emails.py` - Email sending via Resend
- `/.github/workflows/daily_enrichment.yml` - Scheduler

**Configuration:**
- `/vercel.json` - Vercel deployment config
- `/client/package.json` - React dependencies
- `/requirements.txt` - Python dependencies

**Documentation:**
- `/README.md` - Quick start
- `/PROJECT_COMPLETE_OVERVIEW.md` - This file
- `/EMAIL_WARMUP_STRATEGY.md` - Spam prevention
- `/WORKFLOW_TRIGGERED.md` - Campaign status
- `/SYSTEM_READY_FINAL.md` - Setup checklist

---

## 🎉 What Makes This Special

**1. Zero Acquisition Cost**
- Automated email finding (no manual work)
- Free for counselors (no barriers)
- Self-service claim flow
- Viral growth potential

**2. Smart Automation**
- Daily email campaigns (GitHub Actions)
- Spam-safe warm-up schedule
- Automatic status tracking
- No manual intervention needed

**3. Location-First**
- 50 states + major cities covered
- SEO optimized for local search
- City-level analytics
- Geo-targeted content

**4. Professional Polish**
- Modern React UI
- Mobile-optimized
- Fast page loads (Vercel CDN)
- Real-time data (Supabase)
- Analytics dashboards

**5. Built to Scale**
- Serverless architecture
- Database handles millions
- CDN distribution
- Modular codebase
- Ready for paid tiers

---

## 🚀 Current State Summary

**What's Working:**
✅ Directory is live and operational
✅ 1,581 profiles in database
✅ 5,000+ monthly impressions
✅ Automated email system built and tested
✅ GitHub Actions workflow configured
✅ Resend API integration complete
✅ Warm-up strategy implemented
✅ 20 emails sent successfully today

**What's Next:**
→ Monitor today's email campaign results
→ Continue daily automated sending
→ Track response rates and profile claims
→ Scale to 5,000+ profiles
→ Drive more organic traffic
→ Optimize conversion rates
→ Prepare for monetization

**The System:**
This is a **fully automated counselor acquisition engine** that runs on autopilot, sending safe, personalized outreach emails daily while protecting sender reputation and ensuring high deliverability.

**The Goal:**
Become the #1 directory for couples searching for premarital counseling in the US, with 100,000+ monthly visitors and 5,000+ quality counselor profiles.

---

**We're building a valuable service that helps couples prepare for marriage while giving counselors free visibility and lead generation. It's a win-win platform with strong growth potential and zero customer acquisition cost.** 🚀
