# Refill the empty lead queue with custom-domain practice emails

## The problem

The cron is healthy but **sending zero emails for weeks**. Today's `email-cron` 19:14 UTC log:

```
Campaign 'Wedding Counselors [A] Social Proof': 0 active, 702 completed, 69 stopped
```

702 leads finished the entire sequence, 69 are stopped (bounced/unsubscribed), 0 are active. The cron now runs maintenance on an empty queue.

## Why the original list went to zero conversions

The seed list (`counselor_emails_usa.csv`, 744 rows) was sourced via raw Google SERP email scraping and was heavy with `@gmail.com` addresses. After the full Feb–Mar 2026 sequence ran:

- ~0% reply / signup conversion on the directory side
- The Lisa Riebel unsubscribe failure on Mar 28 likely tanked sender reputation further

Counselors with personal gmail addresses are the wrong buyer persona for a $29/mo directory listing — they're side-hustle / part-time, more likely to mark cold mail as spam, and don't have a real practice presence to advertise. The reliable quality signal is **whether the counselor owns a custom-domain inbox** (e.g. `sarah@drsmiththerapy.com`).

## The fix

Two files attached. Drop in as-is:

| File | Destination |
|---|---|
| `find_counselor_leads.py` | repo root |
| `find-counselor-leads.yml` | `.github/workflows/` |

What it does:

1. Daily 13:00 UTC (6 AM PT, before sending starts at 9 AM PT), Mon–Fri
2. Picks today's US state from a 50-state rotation
3. SERP-searches via Brave → Serper for premarital/couples therapist practices
4. Drops results from directory aggregators (Psychology Today, social media, etc.)
5. For each candidate site, fetches `/contact`, `/contact-us`, `/about`, `/` via Jina Reader
6. Extracts emails. **Keeps only emails whose domain matches the site's own domain.** Rejects free email providers + operational mailboxes defensively.
7. Dedupes vs `Lead` table, inserts up to 50/day with `source='therapyden_serp_v1'`
8. Attaches to existing `Wedding Counselors [A] Social Proof` campaign with status `active`
9. The next `email-cron` run picks them up — `lead_enrichment.py` personalizes them, Verifalia verifies, sending begins

No changes to existing `email-cron`, no copy changes, no campaign changes. Just refill the queue with leads that pass the domain-match filter.

## Action items

- [ ] Add `BRAVE_API_KEY` to repo secrets (free 2k/mo at api.search.brave.com). `SERPER_API_KEY` works as a fallback. `JINA_API_KEY` optional.
- [ ] Place the two files
- [ ] Validate with `python find_counselor_leads.py --dry-run --limit 10` — should print candidate emails, no DB writes
- [ ] Run `python find_counselor_leads.py --limit 5` to sanity-check end-to-end DB insert
- [ ] Trigger workflow manually via `workflow_dispatch` once before letting the cron take over
- [ ] After 200+ new leads have completed the sequence, compare reply rate of `source='therapyden_serp_v1'` vs the burned baseline to confirm the filter is actually improving quality

## What this does NOT do

- **No email verification** — handed off to existing Verifalia in `email-cron`
- **No first-name extraction** — handed off to existing `lead_enrichment.py`
- **No sending** — only `email-cron.yml` sends. This script only fills the queue.
- **No copy / sequence / template changes** — the previous 0% conversion was almost certainly a list-quality issue, not a copy issue. Prove that with a clean source before changing anything else.

## Hard "do not" list

- Don't re-import the old `counselor_emails_usa.csv` — same garbage in, same 0% out
- Don't raise `DAILY_SEND_CAP` above 50 — sender reputation is the most fragile asset right now, especially post-Lisa-Riebel
- Don't relax the domain-match filter "to get more volume." Half the leads at 5× conversion beats double at 0%
- Don't add Psychology Today as a source until the TherapyDen-style SERP pipeline is validated. PT has Cloudflare and will need a different fetch path

## Open questions for you

1. **Are any of `BRAVE_API_KEY` / `SERPER_API_KEY` / `JINA_API_KEY` already in repo secrets?** If yes, the script will use them automatically. If no, signing up for Brave free tier is the fastest unblock.
2. **Has Spacemail inbox reputation recovered enough for full 50/day from day 1?** If you're not sure, set `LEAD_FINDER_DAILY_CAP=15` in the workflow env for the first 5 days, then 30 for 5 more, then 50 — gives the new high-signal recipients time to establish a clean reputation before going to full volume.
3. **Should the source tag be more granular?** Current is `therapyden_serp_v1`. If you want to A/B different query templates or filters later, splitting tags per template would let you measure conversion per source.

Full context including memory entries and the campaign history in the directory-side handoff doc: `docs/monetization/email-repo-handoff-2026-04-22.md` in `lawrence18365/premarital_directory`.
