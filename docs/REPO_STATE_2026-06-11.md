# Repo State & Mess Map — June 11, 2026

A snapshot for when you return to this project. The repo isn't *broken* — it's
**unfocused**: more half-built monetization bets than revenue. This maps what's
here, what's real, and what to do.

## TL;DR

- **$0 revenue.** ~194 organic clicks/mo, growing. Traffic comes from blog/comparison
  content (page 1); the directory product ranks page 4–5 and converts ~1 lead/week.
- The one bet the data supports: **content → affiliate**. Everything else is unfinished.
- Working tree was cleaned up June 11 (43 uncommitted files → 6 commits on branch
  `cleanup/monetization-and-outreach`).

## The monetization sprawl (the actual "mess")

Four+ separate revenue attempts, each with code/tables/forms, **none earning**:

| Bet | Surface area | Status | Verdict |
|---|---|---|---|
| **Paid directory** (Featured/Premium tiers) | `profiles.tier`, SubscriptionPage | schema only, payments 0% built | Blocked — needs 10× traffic first |
| **Founding listings** ($79–$299 one-time) | `providerOffers.js`, FoundingProviderPage, mailto | built, not committed until now, no payments | Low priority — leave dormant |
| **Concierge Matchmaker** | `platform_leads` table, form | half-built | Unproven — park it |
| **Catholic Pre-Cana programs** | `program_leads`, program inventory migration | half-built | Unproven — park it |
| **Affiliate/content** (NEW, June 11) | `affiliateOffers.js`, AffiliateOffers component | built, not yet wired into pages | **The recommended bet** |

Plus a jurisdiction-scraping pipeline (`scripts/collector` + `scripts/extractor`,
uses a Kimi API) that populates premarital-requirement content — useful for SEO,
not revenue.

## Lead lists — you have many, but for the wrong strategy

All target **counselors** (supply side of the paid-directory model that isn't working):

| File (gitignored — PII) | Count | Who |
|---|---|---|
| `counselor_emails_usa.csv` | 744 | Cold counselor emails |
| `docs/monetization/handoff-scripts/unclaimed-with-email.csv` | 172 | $79 founding-listing targets |
| `docs/monetization/handoff-scripts/claimed-counselors.csv` | 42 | Real claimed users (warmest) |
| `scripts/officiant-leads.csv` | 69 | DFW officiants |

Lead-finder tool: `docs/monetization/handoff-scripts/find_counselor_leads.py`.
In-product couple inquiries: `profile_leads`, `platform_leads`, `program_leads` tables.

**The gap:** the affiliate pivot needs ~10–20 **course-provider** contacts (for
referral deals) — that list does NOT exist yet. Don't blast the 744 counselors;
that's the dead model and risks the fresh Spacemail mailbox.

## Email / outreach capability (NEW, June 11 — working)

- Send from `hello@weddingcounselors.com` via Spacemail SMTP, verified.
- `scripts/email/`: mailer (SMTP + IMAP Sent append), signature engine (typed body +
  designed footer w/ wordmark), partner outreach templates. Dry-run by default.
- Domain email-auth (SPF/DKIM/DMARC) all valid.

## Branch sprawl (cleanup candidate, not yet done)

Stale remote branches to consider deleting: `claude/fix-state-pages-seo-ux-*`,
`claude/project-setup-*`, `claude/seo-city-hubs-*`, `claude/take-a-break-*`,
`claude/wedding-counselors-phase-1-*`. Current work branches: `codex/vercel-root-fix`,
`cleanup/monetization-and-outreach`.

## Verified vs unverified

- **Verified working:** GA/GSC pulls, Spacemail send, affiliate component (renders nothing
  until partners approved — safe), wordmark render.
- **UNVERIFIED (review before merging to main):** the `founding-provider` and `wip(leads)`
  commits are older edits captured to clean the tree. Run a client build before merging.

## What to do next (focus, don't add)

1. **Wire `<AffiliateOffers>`** into the 3 ranking pages; apply to Online-Therapy.com + Amazon.
2. **Build the course-provider list** (~10–20, TX/FL/GA/MN/OK) and run the outreach templates.
3. **Stop building** founding/concierge/Pre-Cana. Leave dormant; don't delete.
4. **Before merging this branch to main:** run `cd client && npm run build` to verify the
   unverified commits compile.
