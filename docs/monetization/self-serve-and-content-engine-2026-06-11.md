# Self-Serve and Content Engine Slice — June 11, 2026

Branch: `feat/self-serve-and-content-engine`

This branch builds the first usable slice of the two compounding revenue machines:

- **Machine 1:** claimed providers can upgrade themselves from owner surfaces, with Stripe Payment Link attribution and durable funnel events.
- **Machine 2:** the proven content surface gets more state-license pages, draft comparison/method posts, affiliate blocks, and stronger internal links.

No email was sent. No Stripe dashboard changes, pushes, or deployments were performed.

## Machine 1: Self-Serve Upgrade Funnel

### Offer config

`client/src/lib/providerOffers.js` now exports `UPGRADE_OFFER`:

- `mode`: `one_time` today, switchable to `subscription` with `REACT_APP_UPGRADE_MODE=subscription`.
- `checkoutUrl`: `REACT_APP_UPGRADE_CHECKOUT_URL` first, then the existing `REACT_APP_FOUNDING_LINK_LISTING`.
- `price` and `billingNote`: env-overridable so the copy can move from one-time founding placement to recurring billing without new checkout code.
- `valueProps`: visibility/profile-polish language only. No lead or income promises.

### CTA surfaces

`UpgradeCTA` renders only when:

- a profile id exists,
- a checkout URL exists,
- the profile is not already sponsored/featured.

It is now shown on:

- Professional dashboard: prominent card after the account/status overview.
- Professional subscription page: primary self-serve upgrade card, with legacy managed packages still available when relevant.
- Owner public profile view: banner only when the authenticated user owns the profile.
- Pricing page: provider copy now sends claimed providers to the dashboard instead of presenting a competing manual checkout surface.

### Attribution and tracking

The CTA appends these query params to the Stripe Payment Link:

- `client_reference_id={profileId}`
- `utm_source={surface}`

Stripe documents `client_reference_id` as a Payment Link URL parameter that attaches the value to the Checkout Session for reconciliation and webhooks: <https://docs.stripe.com/payment-links/url-parameters>.

The CTA also records:

- GA events: `upgrade_cta_view`, `upgrade_cta_click`
- Supabase table: `upgrade_events(profile_id, event_type, surface, created_at)`

Migration: `supabase/migrations/20260611120000_create_upgrade_events.sql`.

RLS allows insert-only public logging for `view`/`click` events and admin-only reads, matching the existing analytics/event pattern.

### Reading paid events

For this slice, paid attribution is manual:

1. Open Stripe Dashboard → Payment Links / Payments / Checkout Sessions.
2. Inspect the completed Checkout Session.
3. Match `client_reference_id` to `profiles.id`.
4. Compare that profile id with `upgrade_events` rows for view/click source context.

A webhook is intentionally not included yet. When recurring is proven, add a webhook that listens for `checkout.session.completed` and writes a `paid`/subscription row.

## Machine 2: Content Engine Slice

### State license/discount cluster

The direct-incentive state cluster is now focused on states with a real premarital-course marriage-license incentive:

- Florida
- Georgia
- Maryland
- Minnesota
- Oklahoma
- Tennessee
- Texas
- Utah
- West Virginia

Changes made:

- State discount pages render `AffiliateOffers context="license"`.
- State discount pages now add links to the matching state counselor directory, online counselor directory, provider claim page, and related incentive-state pages.
- Sitemap/redirect generation no longer treats Indiana as a discount state.
- Indiana discount content is corrected through migration: the old post is moved to draft, Indiana jurisdiction benefit is marked `no_benefit`, and stale Indiana links in existing posts are replaced.
- Utah and West Virginia are added to the jurisdiction benefit data through migration.
- Minnesota fee/waiting-period data is corrected.

Key verification sources captured in the corrective migration include:

- Indiana Courts marriage-license fee guidance: <https://www.in.gov/courts/services/marriage-license/>
- Minnesota county fee/waiting-period examples: <https://www.millelacs.mn.gov/1182/Marriage-Licenses-Certificates>, <https://www.blueearthcountymn.gov/866/Marriage-Licenses-Records>
- Utah MED/county clerk guidance: <https://extension.usu.edu/strongermarriage/utah-med/>, <https://www.utahcounty.gov/Dept/Clerk/marriage/marriagelicense.html>
- West Virginia statute/county clerk guidance: <https://code.wvlegislature.gov/48-2-701/>, <https://www.monroecountywv.gov/clerk/marriage-license/67>

### New draft comparison/method posts

Migration `20260611122000_add_draft_comparison_method_posts.sql` inserts six draft posts:

- `prepare-enrich-vs-foccus`
- `symbis-vs-prepare-enrich`
- `gottman-vs-eft-premarital-counseling`
- `online-premarital-counseling-vs-self-paced-course`
- `twogether-in-texas-vs-private-premarital-counseling`
- `premarital-counseling-certificate-requirements-by-state`

They are draft-by-default for human review before publishing. `BlogPostPage` is already mapped so these slugs show the relevant affiliate block when published.

### Internal links

Migration `20260611123000_add_internal_links_to_ranking_posts_monetization.sql` appends “Related next steps” sections to the two existing ranking posts:

- `prepare-enrich-vs-gottman-vs-symbis`
- `best-premarital-counseling-books`

Those links point into the license-discount hub, relevant state pages, method directories, and the provider claim surface where it fits naturally.

## Affiliate Status

Affiliate blocks are now present on:

- Existing ranking blog posts via slug-to-context mapping.
- New draft method/comparison posts when published.
- Main marriage-license discount guide.
- Per-state license/discount pages.

They remain safe to ship because `AffiliateOffers` renders nothing until real env links exist.

Human signups still needed:

- Online-Therapy.com affiliate link → `REACT_APP_AFF_ONLINE_THERAPY`
- Amazon Associates tag → `REACT_APP_AFF_AMAZON_TAG`
- ReGain/BetterHelp tracked URL → `REACT_APP_AFF_REGAIN`
- Direct referral links for state course providers, if those partnerships close

## Build Result

Final verification command:

```bash
cd client && npm install && npm run build
```

Expected non-blocking warnings to watch:

- `npm audit` still reports legacy dependency vulnerabilities.
- Sitemap generation may warn when live Supabase profile credentials are unavailable and fall back to static data.
- Prerender may emit `react-helmet` timeout warnings, but the build is acceptable if it finishes with `Prerender complete: ... 0 failed`.

## Human TODO

- Apply the Supabase migrations before deploying this branch.
- Review and publish the six draft posts after checking quality and factual fit.
- Deploy only after migration review and final production config review.
- When ready to test recurring billing, create the Stripe subscription product/payment link and set:
  - `REACT_APP_UPGRADE_MODE=subscription`
  - `REACT_APP_UPGRADE_CHECKOUT_URL=<subscription payment link>`
  - `REACT_APP_UPGRADE_PRICE=<recurring price>`
  - `REACT_APP_UPGRADE_BILLING_NOTE=<billing note>`
- Complete remaining affiliate signups and paste tracked values into `.env`.
- Monitor `upgrade_events` and Stripe Checkout Sessions by `client_reference_id` to evaluate the funnel.
