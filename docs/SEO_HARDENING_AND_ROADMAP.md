# SEO Hardening (Round 2) + Growth Roadmap — Jun 2026

Builds on `docs/SEO_INDEXATION_FIX.md`. This round hardens server-level behavior
and improves sitemap truthfulness, then lays out the growth work (content,
performance, keywords) that is NOT yet implemented.

## Implemented and deployed this round

**Phase 2 — server-level noindex (no JS required).** Added an `X-Robots-Tag:
noindex, follow` route in the production inline `config.json` (`deploy.yml`) for
non-indexable utility/search/embed routes: `/professionals-search`, `/embed/*`,
`/go/*`, `/claim-*`, `/thank-you`, `/quiz/*`. This is a specific allow-pattern,
never a catch-all, so an indexable page can never be accidentally noindexed.
Indexable pages are all prerendered static files served by `handle: filesystem`
before these rules, so they are unaffected. Raw (no-JS) crawls now see noindex.

**Phase 3 — bot allowlist hardening (edge middleware).** The edge middleware is
the real production bot/geo policy (vercel.json is ignored in prod). Added
`adsbot-google`, `storebot-google`, `google-safety`, `chrome-lighthouse`,
`google page speed`/`google-pagespeed` to `ALLOWED_BOTS`, with a guard comment
warning never to remove major crawlers. The allowlist is checked before the
headless/bad-bot block, so Lighthouse/PageSpeed (headless Chrome) are no longer
blocked. Googlebot/Bingbot were already safe.

**Phase 4 — truthful lastmod + profile prune.** `generate-sitemap.js` no longer
stamps the build date on every URL. Core static pages omit `lastmod`. City,
specialty-state, and specialty-city pages derive `lastmod` from the most recent
profile update in that location (real signal) and omit it when unknown. Profiles
use `onboarding_last_saved_at || created_at`, else omit. The prerender noindex
prune now also runs the profiles sitemap (null-guarded: a profile is only dropped
when its rendered HTML positively says noindex).

**Phase 5 (partial) — indexable orphan pages added to sitemap.** `/for-officiants`,
`/premarital-counseling/state-requirements`, and `/locations` are real,
indexable hub pages that were not in any sitemap and therefore not prerendered.
Added to `CORE_PAGES` so they are now generated, prerendered, and discoverable.

**Phase 6 — WebSite structured data.** `SEOHelmet` now emits a `WebSite` schema
node alongside `Organization` on every page (brand SERP / knowledge panel).

**Validation.** `client/scripts/validate-seo.mjs` extended to assert: the
`X-Robots-Tag` noindex header on the utility routes (raw fetch), and that the
new hub pages are 200 + indexable.

## GSC snapshot (last ~90 days, real data via google API)
- ~45 clicks / ~14,336 impressions. CTR is the core problem, not indexation.
- Winners: blog posts. `/blog/prepare-enrich-vs-gottman-vs-symbis` (pos 5.7, 96
  clicks), `/premarital-counseling/marriage-license-discount` (pos 6.0, 68 clicks).
- City pages get large impressions but rank deep: `illinois/chicago` 2,486 imp at
  pos ~47; `alabama/birmingham`, `minnesota/minneapolis` similar. These need
  supply + authority, not crawl changes.

## NOT implemented — prioritized growth roadmap

### A. Programmatic supply + content (Phase 5 remainder)
- **Do not lower noindex thresholds.** The thin city/specialty pages rank pos
  ~47 precisely because they are thin; indexing more of them would add bloat, not
  traffic. Keep the gates.
- **Add real supply to high-impression cities first:** Chicago, Birmingham,
  Minneapolis, Wichita, Nashville, Louisville, Sioux Falls. These already pull
  impressions; more/better profiles per city is the highest-leverage move.
- **Strengthen internal linking** from winning blog posts to the matching
  city/specialty hubs (e.g. the curriculum/comparison posts → specialty pages).
- **`/seo/:slug` pages:** enumerate published slugs from the DB and add the
  indexable ones to the sitemap (same treatment as the hub pages this round).

### B. Keyword push list (pos 4-20, real impressions)
| Query | Pos | Imp | Target URL | Action |
|---|---|---|---|---|
| marriage certificate discount | 19.6 | 159 | /premarital-counseling/marriage-license-discount | add "marriage certificate" synonym to title/H1/body |
| cheap marriage counseling near me | 14.8 | 93 | /premarital-counseling/affordable | strengthen "cheap/low-cost near me" copy |
| in person marriage counseling | 19.6 | 59 | (none) | consider an in-person hub or section |
| best premarital counseling books | 10.5 | 60 | /blog/best-premarital-counseling-books | refresh, internal links, schema |
| pre marital counselling near me | 15.3 | 103 | /premarital-counseling | add British-spelling "counselling" variant |
| marriage consultant | 19.6 | 43 | (none) | low priority |

Implement as title/meta/body/internal-link tweaks. No keyword stuffing.

### C. Performance / Core Web Vitals (Phase 7, audit only)
- Main render-blocker: Font Awesome full CSS from cdnjs in `index.html`. Consider
  swapping to a subset or self-hosting, or `media="print" onload` deferral
  (test for icon FOUC first).
- Google Fonts already use `display=swap` and preconnect. Good.
- Recommend a Lighthouse/PSI run (now unblocked in the bot allowlist) to get real
  LCP/CLS numbers before changing anything risky.

### D. Authority / off-page
- Pursue the affiliate/partner and directory backlinks already in the outreach
  pipeline; thin-supply city pages will not rank without domain authority growth.

## Honest status
The technical/indexation foundation is now strong and server-hardened. Rankings
are gated by content depth (supply per city) and domain authority, which are
content/growth efforts, not crawl-plumbing. This is explicitly not "perfect SEO."
