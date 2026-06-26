# Design Standardization Plan

The full backlog to make the site "look, feel, and behave like one company built it on purpose."
Grounded in the actual codebase (React CRA + plain CSS, no Tailwind). Ordered so each phase makes the next cheaper.

**Baseline facts (measured):**
- 47 hand-written CSS files, ~20,035 lines
- 169 unique hardcoded hex colors, 248 unique `font-size` values
- 1,528 inline `style={{}}` blocks in JSX
- 0 reusable design primitives (`Button` / `Field` / `Card` / `Section`)
- 40 page components; biggest: `ProfilePage.js` (900 lines), `HomePage.js` (547), `ProfessionalsPage.js` (499)
- Token system EXISTS (`enterprise-theme.css`, 153 tokens incl. WCAG-audited state colors). The gap is enforcement, not authoring.

Status key: `[x]` done, `[ ]` todo, `[~]` partial.

---

## EXECUTION SNAPSHOT (2026-06-26)
What an automated multi-agent pass completed, all build-verified (webpack compile exits 0):

| Phase | Status | Result |
|---|---|---|
| 0 Token source of truth | DONE | 30 shadowed brand tokens removed from main.css; 0 conflicts |
| 1 Guardrails | DONE | stylelint (no-hex + off-scale font) + eslint (no inline style) + jsx-a11y, husky pre-commit, CSS README. Baseline measured |
| 2 Core components | DONE | `ui/` Button, Field, Card, Section/Container/Stack, Empty/Error/Loading + dev-gated `/_styleguide` |
| 3 Sprawl cleanup | PARTIAL | 285 CSS violations auto-fixed exact-match (hex 366→237, font-size 771→615). Inline styles (1527), button one-offs, off-palette colors remain (need visual judgment) |
| 4 Competing themes | PARTIAL | 2 dead files deleted (Hero.css, profiles-highlight.css). Navbar trio is NOT competing. Hero merge + profile theme choice need user decision |
| 5 Page polish | NOT STARTED | Needs visual judgment, per-page |
| 6 UX & conversion | NOT STARTED | Needs product judgment + analytics |
| 7 Accessibility | PARTIAL | 8 money-path form labels fixed; jsx-a11y guardrail on (93 warnings now visible). Onboarding wizard labels backlog |
| 8 Performance | DONE (font) | Render-blocking font @import moved to index.html preconnect/preload/swap. Routes already lazy-loaded. Lighthouse run pending |
| 9 QA & lock | PARTIAL | Build verified repeatedly. Visual-snapshot harness added (`npm run snapshot`), 22 pages captured desktop+mobile. Cross-browser + warn→error flip pending |

### Key finding from visual review (do not skip)
Screenshotting the live build at desktop and mobile showed the rendered site is already a
coherent, professional teal/cream editorial design. The funnel pages (founding-provider,
pricing) have clear tiers, hierarchy, CTAs, and FAQs. The CEO brief's premise that the site
"looks amateur and stitched together" is NOT borne out by the rendered pages. The real
problems were all under the hood (token conflict, 367 stray hex, 1527 inline styles, dead CSS,
no guardrails), which is what got fixed. CONCLUSION: Phase 5 (redesign every page) is largely
unnecessary and risky. Reprioritize remaining effort to: (a) finish the mechanical sprawl
migration incrementally, now enforced by guardrails; (b) Phase 6 conversion tuning driven by
real analytics, not guesswork; (c) the 3 user decisions below.

The 4 design-system commits are on branch `feat/self-serve-and-content-engine`
(`d35718c`, `cdaa7ff`, `70f5435`, `708b445`) plus the visual harness commit.

---

---

## Phase 0 — One source of truth for tokens
Make every token defined exactly once.

- [x] Remove 30 shadowed brand/color tokens from `main.css` (enterprise-theme wins anyway). Done: 0 conflicts remaining, scale intact, braces balanced.
- [ ] Run a production build (`cd client && npm run build`) to confirm the token change compiles clean.
- [ ] Document the split at the top of each file: `enterprise-theme.css` = brand/color/state; `main.css` = scale (spacing/type/radius/shadow/transition/container). (One-line comment exists in main.css; add the mirror note to enterprise-theme.css.)
- [ ] Audit the 3 `:root` blocks in `main.css` (block 2 = `--navbar-height`, block 3 = responsive type scale). Confirm responsive overrides are intentional, not accidental.
- [ ] Decide the canonical type scale: `--text-*` tokens vs the 248 raw `font-size` values. The tokens are the answer; the raw values are the cleanup target (Phase 3).

## Phase 1 — Guardrails (lock the standard so it can't decay)
Do this BEFORE mass cleanup, so cleanup stays clean. Highest ROI now.

- [ ] Add **stylelint** to `client/` with `stylelint-config-standard`.
- [ ] Rule: ban raw hex/rgb outside the two token files (`color-no-hex` / custom `declaration-property-value-disallowed-list`), forcing `var(--token)`.
- [ ] Rule: warn on raw `font-size` / `spacing` values not from the scale (custom allowlist of `var(--text-*)`, `var(--space-*)`).
- [ ] Add **eslint** rule discouraging inline `style={{}}` in JSX (`react/forbid-dom-props` or a custom warn) so new code reaches for classes/components.
- [ ] Wire both into the existing lint/CI step (or add `npm run lint:css`); make it non-blocking (warn) first, blocking (error) after Phase 3.
- [ ] Add a pre-commit hook (husky + lint-staged) so violations are caught before they land.
- [ ] Add a short `CONTRIBUTING` / `client/src/assets/css/README.md`: "no new CSS file per feature; no raw hex; use tokens + shared components."

## Phase 2 — Core component library
Build the 4 primitives every page reinvents. Put them in `client/src/components/ui/`.

- [ ] `Button` — variants: `primary | secondary | outline | ghost | destructive`; sizes: `sm | md | lg`; states: hover/focus/active/disabled/loading. Wrap the existing `.btn` convention (already used 270+ times) so adoption is mechanical.
- [ ] `Field` — label + input/textarea/select + helper + error + success, with consistent validation styling. (Standardizes the forms the CEO audit flags.)
- [ ] `Card` — `default | interactive | pricing | testimonial`. One radius/shadow/padding system from tokens.
- [ ] `Section` / `Container` — standard max-widths (`--container-*`), vertical rhythm, grid/stack helpers. Kills random section heights.
- [ ] State primitives: `EmptyState`, `ErrorState`, `LoadingState` (you have `LoadingSpinner` + `ErrorMessage`; consolidate into governed components).
- [ ] Add a lightweight component preview page (route like `/_styleguide`, dev-only) showing every variant/state. This is your "source of truth you can see."

## Phase 3 — Standardize the sprawl (replace one-offs)
Now that primitives + guardrails exist, retire the duplicates. Measure progress by the baseline numbers shrinking.

- [ ] **Buttons:** migrate one-off classes to `<Button>`: `wellness-btn`, `wellness-btn-outline`, `boost-btn*`, `pc-btn*`, `profdash-copy-btn`, `profdash-danger-btn`, `btn-continue`, `btn-skip`, `provider-cta__btn*`, `blog-pagination-btn`, `post-inquiry-share-btn`. Then delete their CSS.
- [ ] **Colors:** replace the 169 raw hex values with the nearest token. Triage: the top offenders are `#0e5e5e`(115), `#fff`(106), `#e5e5e5`(80), `#000000`(68), `#1a1a1a`(56) — most map to existing tokens 1:1.
- [ ] **Type:** collapse the 248 `font-size` values onto the `--text-*` scale. Anything not on-scale needs a reason or a fix.
- [ ] **Inline styles:** burn down the 1,528 `style={{}}` blocks, starting with the highest-traffic pages (HomePage, ProfilePage, ProfessionalsPage). Move to classes/components.
- [ ] **CSS file consolidation:** 47 files is the symptom. Merge/retire feature-specific files into component-scoped styles or shared utilities. Target the obvious duplicate clusters first (see Phase 4).

## Phase 4 — Resolve competing themes / pick one brand direction
You currently have multiple parallel visual systems for the same surfaces. Pick one each.

- [ ] **Profile page** — 5 competing stylesheets: `profile-page-enhanced.css`, `profile-heirloom.css` (cream/heirloom), `profile-wellness.css` (wellness), `profiles-highlight.css`, `unclaimed-profile-banner.css`. Choose ONE direction, delete the rest. (These are partly uncommitted in the current branch — decide before merge.)
- [ ] **Navbar** — `navbar-glass.css` (dark glass) vs `navbar-transparent.css` vs `premium-mobile-nav.css`. Pick one nav treatment.
- [ ] **Hero** — 4 competing files: `Hero.css`, `hero-modern.css`, `hero-immersive.css`, `enhanced-hero.css`. Consolidate to one Hero component + one stylesheet.
- [ ] Answer the brand-direction questions (premium vs cheap, serious vs playful, minimal vs expressive). Without this, theme picks are arbitrary. The existing palette (deep teal `#0e5e5e` + Cormorant Garamond display) implies "premium/trustworthy/editorial" — confirm or change deliberately.
- [ ] Lock the choice in the styleguide page so future work copies it instead of inventing.

## Phase 5 — Page-by-page polish (highest commercial value first)
Each page should have ONE job. Audit against: what is this / who for / why care / what next / what happens after I click.

Revenue/conversion pages first:
- [ ] `HomePage` — clear offer above the fold, one primary CTA, proof near CTA.
- [ ] `ProfilePage` (900 lines — split into sections/components while restyling) — the core SEO + conversion surface.
- [ ] `ProfessionalsPage` / `FoundingProviderPage` / `ClaimProgramPage` / `BoostLandingPage` — the self-serve provider funnel. Pricing must be unambiguous; one main action each.
- [ ] `MarriageLicenseDiscountPage` / lead capture (`LeadContactForm`, `concierge-form`, `city-inquiry`) — short, low-friction forms using the new `Field` component.
- [ ] Directory/SEO pages (`CityPage`, `StatePage`, `SpecialtyPage`, `Locations/StatesIndex`) — consistent card grid via `Card` + `Section`.
- [ ] Trust/content pages (`AboutPage`, `HowItWorksPage`, `GuidelinesPage`, `FAQ`, `EditorialStandardsPage`) — one voice, consistent headings.
- [ ] Utility pages (auth, confirm/verify email, unsubscribe, 404, thank-you) — consistent, not afterthoughts.
- [ ] For every page: kill decorative copy, surface proof higher, make the next step obvious within 5 seconds.

## Phase 6 — UX & conversion
- [ ] One primary CTA per page; consistent CTA label language (pick "Get listed" / "Claim your profile" etc., stop mixing "Get Started / Contact Us / Buy Now").
- [ ] Information architecture pass on the navbar (`Navbar.js`) — reduce choices, clarify hierarchy.
- [ ] Verify analytics events fire on every primary CTA and form submit (`components/analytics`); confirm funnel drop-off points are tracked.
- [ ] Define the post-click journey for each conversion (what the provider/couple sees after submitting).
- [ ] Mobile-first review of every conversion path (the audit flags mobile as likely an afterthought).

## Phase 7 — Accessibility & quality (baseline, not polish)
- [ ] Contrast: enterprise-theme already has WCAG-AA notes; verify the whole site hits 4.5:1 after color cleanup.
- [ ] Every form field has a real `<label>` (driven by the `Field` component).
- [ ] Visible focus states on all interactive elements (built into `Button`/`Field`).
- [ ] Keyboard-accessible buttons/links; no `div` click handlers without roles.
- [ ] Alt text on meaningful images; empty alt on decorative.
- [ ] Mobile tap targets >= 44px.
- [ ] Per-page `<title>` + meta description (SEO-critical for this directory; cross-check with indexing strategy).
- [ ] No overflow, no layout shift, no broken links, no dead buttons, no console errors.

## Phase 8 — Performance
- [ ] Lighthouse + Core Web Vitals baseline (mobile + desktop) before/after.
- [ ] CSS: after Phase 3/4 consolidation, measure unused CSS reduction from cutting redundant files.
- [ ] Fonts: `main.css` loads Inter + Cormorant via Google `@import` (render-blocking). Switch to `<link rel=preload>` / `font-display: swap`.
- [ ] Images: confirm `LazyImage` is used everywhere; size/compress; correct crops.
- [ ] JS bundle: check for route-level code splitting on the 40 pages.
- [ ] Third-party scripts / analytics: defer where possible.

## Phase 9 — QA & lock the standard
- [ ] Cross-browser + responsive QA pass on the redesigned high-value pages.
- [ ] Add visual regression / screenshot tests (or at least manual screenshot baselines) for the styleguide page + top 5 pages.
- [ ] Flip the Phase 1 lint rules from warn to error in CI.
- [ ] Final rule, written down and enforced: no new per-feature CSS file, no raw hex, no inline styles, use tokens + `ui/` components. New page = compose existing primitives, never invent design again.

---

## Suggested execution order (if doing it incrementally)
1. Phase 0 finish (build check) + Phase 1 guardrails — locks the foundation. ~1 day.
2. Phase 2 components + styleguide page. ~2-3 days.
3. Phase 4 theme decisions (profile/nav/hero) — unblocks the current branch.
4. Phase 3 sprawl cleanup, page by page, alongside Phase 5 polish.
5. Phases 6-9 as each high-value page is touched.

This is a system-repair project, not a redesign. The order matters more than the speed.
