# Handoff scripts for `lawrence18365/email`

Drop these two files into the email repo to add a daily lead-finder that
refills the empty queue (see `../email-repo-handoff-2026-04-22.md` for full
context).

## Files

| File | Goes in | Notes |
|---|---|---|
| `find_counselor_leads.py` | repo root (alongside `lead_finder.py`, `lead_enrichment.py`) | Main script. Self-contained, uses existing `app`/`models` imports. |
| `find-counselor-leads.yml` | `.github/workflows/` | Daily 13:00 UTC cron, Mon–Fri, manual trigger via workflow_dispatch. |

## Required GH Actions secrets

The script needs at least one SERP key. Free tiers are plenty for 50 leads/day:

- `BRAVE_API_KEY` — preferred. 2,000 searches/month free at [api.search.brave.com](https://api.search.brave.com/).
- `SERPER_API_KEY` — fallback. 2,500 searches/month free at [serper.dev](https://serper.dev/).
- `JINA_API_KEY` — optional. Raises Jina Reader rate limits; without it the
  free anonymous tier still works for ~100 fetches/day.

All other secrets it uses (`DATABASE_URI`, `TURSO_AUTH_TOKEN`, `SECRET_KEY`,
`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`) are already set in this repo.

## How it works

1. Picks today's US state from a 50-state rotation (each state hit ~7×/year).
2. Runs 5 SERP query templates (`"premarital counseling" "{state}" contact`, etc.).
3. Collects unique result domains, drops directory aggregators
   (`psychologytoday.com`, `theknot.com`, social media, etc.).
4. For each candidate site, fetches `/contact`, `/contact-us`, `/about`, and
   homepage via Jina Reader. Stops at first page that yields a domain-matched
   email.
5. Hard-rejects:
   - Free email providers (gmail/yahoo/hotmail/etc. — full list in script)
   - Any email whose domain doesn't match the site's domain
   - Operational mailboxes (`noreply@`, `webmaster@`, etc.)
6. Dedupes vs the `Lead` table.
7. Inserts each accepted lead with `source='therapyden_serp_v1'` (rename if
   you want to A/B against a future v2) and attaches it to the
   `Wedding Counselors [A] Social Proof` campaign with status `active`.
8. Stops at 50 new leads or 25 SERP queries, whichever comes first.

## Validating before letting it run free

```bash
# Dry run — searches and filters, prints what it would add, no DB writes.
python find_counselor_leads.py --dry-run --limit 10

# Real run, small cap, to sanity-check the pipeline end-to-end.
python find_counselor_leads.py --limit 5
```

The first real run will likely return fewer than 50 leads (the
domain-match filter is aggressive on purpose). That's expected and a feature
— you want quality over volume per the gmail-leads-are-trash insight.

## What this does NOT do

- **Email verification.** The next `email-cron` run will hand off new leads
  to the existing Verifalia integration before the first send.
- **First-name extraction.** Same — `lead_enrichment.py` already runs in the
  cron with a 50-lead-per-run limit and will personalize new leads.
- **Sending.** This script never sends mail. Only `email-cron.yml` does.

## After deployment, watch for

- **Daily-yield drop-off.** Each state rotates ~7× per year. If you see
  yields fall after a full rotation (50 days), the dedupe is working — the
  state has been mined. Add city-level rotation or expand `QUERY_TEMPLATES`.
- **Domain-match rejection rate.** Add `--dry-run` and grep `domain mismatch`
  in logs to see how many gmail-style leads are being filtered out. High
  rejection rate is good (filter is doing its job); near-zero would mean
  the filter is broken.
- **Conversion vs the burned baseline.** Tag is `therapyden_serp_v1`; the
  burned list was `csv_import` (or similar). After 200+ new leads have run
  the full sequence, compare reply rates to confirm the new pipeline is
  actually higher-quality.
