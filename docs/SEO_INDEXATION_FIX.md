# SEO Indexation & Crawl-Hygiene Fix (Jun 2026)

Goal: make Google see **one clean, canonical, intentional** set of indexable URLs.

## Canonical host
`https://www.weddingcounselors.com`
- non-www → www (307) and http → https (308) are enforced at the Vercel domain
  level (verified live).
- All sitemap `<loc>` values, page canonicals, and the robots.txt sitemap
  reference use this host.

## Deployment architecture (important)
Production is **not** built by Vercel's own build (Vercel cannot run the
Puppeteer prerender). It is built and deployed by GitHub Actions
`.github/workflows/deploy.yml`:
1. `generate-sitemap.js` (Supabase-backed, quality-gated) → `client/public/*.xml`
2. `react-scripts build` (compiles React; bakes the SEO bundle)
3. `prerender.js` (Puppeteer renders every sitemap route to static HTML, then
   **prunes noindex URLs from the deployed sitemaps**)
4. deploy prebuilt bundle to Vercel with an **inline `config.json`** (routes /
   redirects) + edge middleware (bot/geo + state-abbrev 301s).

Because of this, the root `vercel.json` is effectively ignored in production —
production routing lives in `deploy.yml`'s inline `config.json` and the edge
middleware. Changes to redirects/headers must go there.

`push` to main = build-only (no deploy). Production deploys on the twice-weekly
schedule or via manual `workflow_dispatch`.

## Root cause that was fixed
`public/index.html` ships `<meta name="googlebot" content="index, follow">`.
Thin city/specialty pages set `robots: noindex` via react-helmet but did **not**
override the crawler-specific `googlebot` tag. Google obeys the `googlebot`
directive over the generic `robots` one, so pages intended to be `noindex` were
treated as **indexable** — defeating the sitemap quality-gates and inflating the
discovered/not-indexed counts in GSC.

**Fix:** `SEOHelmet` now emits a per-page `googlebot` meta mirroring `robots`.
The prerender duplicate-meta cleanup collapses it to a single correct tag.

## Indexation strategy by URL type
| URL type | Pattern | Indexable? | In sitemap? |
|---|---|---|---|
| Home / core static | `/`, `/about`, `/pricing`, … | Yes | Yes (`sitemap-core`) |
| State directory | `/premarital-counseling/:state` | Yes if ≥1 profile, else noindex | Yes when ≥1 profile |
| City directory | `/premarital-counseling/:state/:city` | Yes if anchor & ≥1, or ≥3 (page noindexes <5 non-anchor) | Yes when gate met |
| Specialty (global) | `/premarital-counseling/:specialty` | Yes | Yes (`sitemap-core`) |
| Specialty + state | `/premarital-counseling/:specialty/:state` | Yes if ≥3 matching (catholic: ≥3 programs) | Yes when gate met |
| Specialty + city | `/premarital-counseling/:specialty/:state/:city` | Yes if ≥2 (anchor ≥1; catholic ≥3 programs) | Yes when gate met |
| Profile | `/premarital-counseling/:state/:city/:slug` | Yes if bio ≥50 chars; missing/hidden → 404+noindex | Yes (`sitemap-profiles`, bio-gated) |
| Blog post | `/blog/:slug` | Yes | Yes (`sitemap-blog`) |
| Search/filter | `/professionals-search?...` | **noindex** | No |
| Legacy paths | `/states`, `/professionals`, `/pre-cana`, … | 301 | No |
| Old profile route | `/profile/:id` | `X-Robots-Tag: noindex` (config.json) | No |
| Abbrev state paths | `/premarital-counseling/tx/...` | 301 → full name (edge middleware) | No |

**Self-healing guarantee:** after prerender, any sitemap URL whose rendered HTML
is `noindex` is dropped from the deployed child sitemaps
(core/cities/specialties/blog). The rendered page is the single source of truth,
so generator-heuristic drift can no longer put noindex URLs in the sitemap.
Profiles are SSR/prerendered and bio-gated, so that sitemap is left intact.

## Sitemap structure
`/sitemap.xml` is a sitemap **index** referencing:
`sitemap-core.xml`, `sitemap-cities.xml`, `sitemap-specialties.xml`,
`sitemap-blog.xml`, `sitemap-profiles.xml`. Live total ≈ 1,950 URLs.

## Stale sitemaps
- `/sitemap-phase1.xml` → **301 → /sitemap.xml** (was 200 HTML ghost).
- non-www `/sitemap.xml` → 307 → www.
- standalone `sitemap-core.xml` is a valid child (kept).

## Validation
`cd client && npm run validate:seo` (or `node scripts/validate-seo.mjs --base <url>`)
checks: robots.txt sitemap reference, sitemap index + children return 200 XML,
canonical host, no duplicates, sampled URLs are 200 / not redirected / not
noindex / self-canonical, the phase1 redirect, and non-www/http redirects.
Exits non-zero on failure (CI-friendly).

## Manual GSC follow-up
- Remove stale sitemap submissions: non-www `sitemap.xml`, `sitemap-phase1.xml`,
  standalone `sitemap-core.xml` / `sitemap-phase1`.
- Keep only `https://www.weddingcounselors.com/sitemap.xml`.
- URL-inspect a few key pages; request validation after the next crawl.
