# GSC Removal List — 2026-05-17

Goal: hard-remove URL patterns from Google's index so the domain stops looking like a 10K-page directory that 89% of which Google rejected. Pair with the noindex changes that shipped today.

## How to use

1. Open https://search.google.com/search-console
2. Pick property `sc-domain:weddingcounselors.com`
3. Left nav → Indexing → **Removals**
4. Click **New request**
5. For each URL below, choose either:
   - **"Remove this URL only"** (Section A — specific high-impression pages)
   - **"Remove all URLs with this prefix"** (Section B — directory patterns)
6. GSC removals are temporary (~6 months) but Google usually fully deindexes the URL within that window if the page is noindex'd or returns 404. Since we just shipped noindex on all of these, they'll stay out.

## Section A — Individual high-impression dead pages

Each of these has 100+ impressions/28d, 0 clicks, position 40+. Each one is a quality-signal drag. Submit each via **"Remove this URL only"**.

```
https://www.weddingcounselors.com/premarital-counseling/florida/miami
https://www.weddingcounselors.com/premarital-counseling/california/los-angeles
https://www.weddingcounselors.com/premarital-counseling/alabama/birmingham
https://www.weddingcounselors.com/premarital-counseling/arizona/phoenix
https://www.weddingcounselors.com/premarital-counseling/north-carolina/raleigh
https://www.weddingcounselors.com/premarital-counseling/north-carolina/charlotte
https://www.weddingcounselors.com/premarital-counseling/illinois/chicago
https://www.weddingcounselors.com/premarital-counseling/minnesota/minneapolis
https://www.weddingcounselors.com/premarital-counseling/georgia/atlanta
https://www.weddingcounselors.com/premarital-counseling/oklahoma/oklahoma-city
https://www.weddingcounselors.com/premarital-counseling/new-york
https://www.weddingcounselors.com/premarital-counseling/florida
https://www.weddingcounselors.com/premarital-counseling/california
https://www.weddingcounselors.com/premarital-counseling/georgia
https://www.weddingcounselors.com/premarital-counseling/texas
https://www.weddingcounselors.com/premarital-counseling/pennsylvania
https://www.weddingcounselors.com/premarital-counseling/online
https://www.weddingcounselors.com/premarital-counseling/christian
https://www.weddingcounselors.com/premarital-counseling/prepare-enrich
https://www.weddingcounselors.com/premarital-counseling/lgbtq
```

NOTE: most of these were just set to `noindex` in code. The GSC removal accelerates the cleanup — without it, Google may take 30–90 days to recrawl, see the noindex, and drop. With it, they're out in 24 hours.

## Section B — URL prefixes to remove

Use **"Remove all URLs with this prefix"**. These directories should never appear in Google index.

```
https://www.weddingcounselors.com/professional/
https://www.weddingcounselors.com/admin/
https://www.weddingcounselors.com/auth/
https://www.weddingcounselors.com/embed/
https://www.weddingcounselors.com/profile/
https://www.weddingcounselors.com/professionals/
https://www.weddingcounselors.com/professionals-list
https://www.weddingcounselors.com/find-counselor
https://www.weddingcounselors.com/find-counselors
https://www.weddingcounselors.com/counselors
https://www.weddingcounselors.com/states
https://www.weddingcounselors.com/therapists
https://www.weddingcounselors.com/coaches
https://www.weddingcounselors.com/clergy
```

(Some of these are already in robots.txt as Disallow, but robots.txt doesn't deindex existing pages — it only prevents future crawling. Removal is the right tool for already-indexed garbage.)

## After submission

- Check `Page indexing` 7 days later. The "Not indexed" number should start dropping.
- Re-run the local index coverage report after 30 days:
  ```
  node scripts/ga/index-coverage-report.js --sample 100
  ```
  Expect ratio to invert from 11% indexed → 40%+ indexed by 60 days.
