-- Add internal links from top-performing blog posts to relevant directory pages.
-- These posts rank on page 1-2 in Google but don't link to directory pages,
-- missing an opportunity to pass link equity to city/specialty pages.
--
-- Only updates posts that don't already contain the target links (idempotent).
-- Appends a "Find a Counselor" section after the main content.
--
-- Top 5 by impressions (GSC data 2026-03-16):
--   1. church-premarital-counseling-by-denomination: 2,771 imp, pos 3.7
--   2. prepare-enrich-vs-gottman-vs-symbis:          269 imp, pos 4.2
--   3. premarital-counseling-statistics:              197 imp, pos 7.0
--   4. premarital-counseling-curriculum-comparison:   161 imp, pos 6.8
--   5. premarital-counseling-cost:                    124 imp, pos 10.8

-- 1. Denomination post (2,771 impressions) — link to denomination-specific directory pages
UPDATE posts
SET content = content || '

---

### Find a Counselor for Your Denomination

Looking for premarital counseling that fits your faith tradition? Browse our directory:

- [Christian Premarital Counselors](/premarital-counseling/christian) — Evangelical, non-denominational & Protestant counselors
- [Catholic Pre-Cana Programs](/premarital-counseling/catholic) — Parish-based and diocesan marriage prep
- [Interfaith Premarital Counseling](/premarital-counseling/interfaith) — For couples from different faith backgrounds
- [Browse All Premarital Counselors](/premarital-counseling) — Filter by location, method & price',
    updated_at = now()
WHERE slug = 'church-premarital-counseling-by-denomination'
  AND content NOT LIKE '%/premarital-counseling/christian%';

-- 2. PREPARE/ENRICH vs Gottman vs SYMBIS (269 impressions) — link to method-specific pages
UPDATE posts
SET content = content || '

---

### Ready to Get Started?

Find a counselor certified in the method that fits your relationship:

- [PREPARE/ENRICH Counselors](/premarital-counseling/prepare-enrich) — Certified facilitators near you
- [Gottman-Certified Therapists](/premarital-counseling/gottman) — Trained in the Gottman Method
- [Online Premarital Counseling](/premarital-counseling/online) — Flexible virtual sessions from home
- [Browse All Counselors](/premarital-counseling) — Compare methods, prices & availability',
    updated_at = now()
WHERE slug = 'prepare-enrich-vs-gottman-vs-symbis'
  AND content NOT LIKE '%/premarital-counseling/prepare-enrich%';

-- 3. Statistics post (197 impressions) — link to directory + cost page
UPDATE posts
SET content = content || '

---

### Take the Next Step

The data is clear: premarital counseling works. Find the right counselor for your relationship:

- [Browse Premarital Counselors](/premarital-counseling) — Compare therapists, coaches & faith-based counselors near you
- [Affordable Premarital Counseling](/premarital-counseling/affordable) — Budget-friendly options starting at $49
- [Marriage License Discount States](/premarital-counseling/marriage-license-discount) — Save $25-$75 on your license fee
- [How Much Does Premarital Counseling Cost?](/blog/premarital-counseling-cost) — Full pricing breakdown',
    updated_at = now()
WHERE slug = 'premarital-counseling-statistics'
  AND content NOT LIKE '%/premarital-counseling/affordable%';

-- 4. Curriculum comparison (161 impressions) — link to method pages
UPDATE posts
SET content = content || '

---

### Find a Certified Counselor

Ready to start one of these programs? Find a certified provider:

- [PREPARE/ENRICH Facilitators](/premarital-counseling/prepare-enrich) — The most widely used couples assessment
- [Gottman Method Therapists](/premarital-counseling/gottman) — Research-backed relationship skills
- [Online Premarital Counseling](/premarital-counseling/online) — Complete your program from home
- [Compare All Counselors](/premarital-counseling) — Filter by method, location & price',
    updated_at = now()
WHERE slug = 'premarital-counseling-curriculum-comparison'
  AND content NOT LIKE '%/premarital-counseling/gottman%';

-- 5. Cost post (124 impressions) — link to affordable + discount pages
UPDATE posts
SET content = content || '

---

### Find Affordable Counseling Near You

- [Affordable Premarital Counseling](/premarital-counseling/affordable) — Budget-friendly options and sliding-scale providers
- [Online Premarital Counseling](/premarital-counseling/online) — Often 30-50% less than in-person sessions
- [Marriage License Discount](/premarital-counseling/marriage-license-discount) — 8 states offer $25-$75 off your license fee
- [Browse All Counselors](/premarital-counseling) — Compare prices across providers in your area',
    updated_at = now()
WHERE slug = 'premarital-counseling-cost'
  AND content NOT LIKE '%/premarital-counseling/affordable%';
