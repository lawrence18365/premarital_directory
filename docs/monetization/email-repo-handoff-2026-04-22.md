# Handoff: Wedding Counselors outreach is stalled — needs a lead-gen pipeline

**To:** maintainer of `lawrence18365/email`
**From:** premarital_directory side
**Date:** 2026-04-22
**TL;DR:** Cron is healthy, sending is healthy, but the lead pool is empty *and* the original list was the wrong shape. Need a new lead-finder that pulls custom-domain practice emails (not gmail) from therapist directories, capped at 50/day, dropping into the existing `Wedding Counselors [A] Social Proof` campaign.

---

## Where we are right now

The outreach system is **live and running** — `email-cron.yml` fires hourly during sending hours and exits cleanly every time. But it has been sending **zero emails for weeks**. The smoking gun is one log line from today's 19:14 UTC run:

```
Campaign 'Wedding Counselors [A] Social Proof': 0 active, 702 completed, 69 stopped
```

So 702 leads finished the full sequence, 69 were stopped (bounced / unsubscribed / suppressed), and **0 are still active**. The cron now does maintenance (response checks, SLA, A/B analytics, bounce processing) on an empty queue. Nothing is broken — there's just nothing to send.

## How the pool ran dry

The seed list (`counselor_emails_usa.csv`, 744 rows) was sourced via Google SERP scraping for therapist contact pages. It got blasted through the full sequence between Feb 28 and ~Mar 28. Conversion was effectively 0%.

The directory side has been static: 16/37 real profiles indexed, $0 revenue, no organic signups attributable to the campaign. So this isn't "the funnel is slow" — it's "the funnel didn't fire."

## Why it didn't convert (the important part)

The original list was heavy with `@gmail.com` addresses, and **gmail-address counselors are the wrong buyer persona**. They tend to be:
- Side-hustle / part-time practitioners without a real business presence
- Unwilling to pay $29/mo for a directory listing
- Quick to mark cold mail as spam (which damages sender reputation for the whole list — likely contaminated deliverability for the better leads on the list too)

The strong signal isn't "is this a counselor" — it's **"does this counselor own a custom-domain inbox"**. `sarah@drsmiththerapy.com` means a real practice with a website and budget. `katiemai@gmail.com` doesn't.

This is now saved as durable feedback in our project memory so it doesn't get re-discovered.

## What needs to happen

Build a daily lead-finder job that refills the queue with **50 high-quality leads per day**, matching the existing send cap.

### Hard constraints

1. **Reject any lead** whose email domain is in: `gmail.com, yahoo.com, hotmail.com, outlook.com, aol.com, icloud.com, msn.com, live.com, protonmail.com, gmx.com` (full list — extend if you find more free providers).
2. **Strong-prefer** leads where `email_domain == website_domain` (real practice signal).
3. **Cap at 50 new leads/day** — exceeding the send cap just builds a backlog of stale leads.
4. **Dedupe** against existing `Lead` rows AND against the directory's `do_not_contact` table (bounces, complaints, self-removes).
5. **Assign to** the `Wedding Counselors [A] Social Proof` campaign (already configured, sequence already written).

### Recommended sourcing

Don't reuse the SERP-scraping pattern that produced the original list — it returns the same gmail garbage. Instead source from professional directories where therapists list their practice website:

1. **TherapyDen first** (~5k US couples therapists, friendly to scrape, good signal). Profile pages link out to practice websites; visit the website and extract the contact email.
2. **Psychology Today second** (~30k+ profiles, much better volume, but Cloudflare-protected — needs Jina Reader or similar). Add only after TherapyDen pipeline is validated end-to-end.
3. **GoodTherapy as a third tap** if the first two run dry.

Filter on specialty `premarital` or `couples` + US-based.

### Existing infrastructure to use

- `lead_finder.py` — already has `_jina_search`, `_brave_search`, `_serper_search`, `_extract_emails`, `_should_exclude_email`, dedup. The exclusion list at `EXCLUDE_PATTERNS` (lines ~52–70) needs the free-provider domains added.
- `LeadFinderScheduler.run_prospecting()` — already auto-adds to DB. The default criteria (line ~1014) is for mortgage brokers from a different project; needs a counselor-specific criteria dict.
- `lead_enrichment.py` — already runs in the cron, will pick up new leads and personalize them.
- `email_verifier.py` / Verifalia — already wired up, will catch bad addresses pre-send.

### Recommended structure

- New script `find_counselor_leads.py` that:
  1. Queries the chosen directory (TherapyDen first) for premarital/couples therapist profiles in a target state (rotate through US states day by day).
  2. For each profile, fetches the practice website URL.
  3. Scrapes the website's contact page for an email.
  4. Filters: drop free-provider domains, drop if `domain != website_domain` (or downgrade priority).
  5. Enriches with first name, business name, city, state.
  6. Dedupes vs `Lead` table and `do_not_contact`.
  7. Inserts up to 50 leads/day into the `Wedding Counselors [A] Social Proof` campaign with status `new`.
- New workflow `.github/workflows/find-counselor-leads.yml` running once daily (e.g. 14:00 UTC, before sending hours start at 16:00 UTC) so newly-found leads get enriched in the next email-cron run.

### What NOT to do

- **Don't reload the original 744 list.** Same garbage, same 0% conversion.
- **Don't increase send volume** to compensate. Send cap is 50/day for a reason — sender reputation on `hello@weddingcounselors.com` is the most fragile asset here, and the post-Lisa-Riebel cleanup already hurt it.
- **Don't add new email sequences** before validating the new lead source converts. The current sequence is fine; the previous 0% was almost certainly a list-quality issue, not a copy issue. Prove that with the new pipeline before changing copy.
- **Don't skip the free-provider filter** even if it cuts your daily volume in half. Half the leads at 5x conversion beats double the leads at 0%.

## Open questions for the maintainer

1. Are `BRAVE_API_KEY`, `SERPER_API_KEY`, `JINA_API_KEY` set in this repo's GH Actions secrets? If only one is set, the script should prefer it. If none are set, signing up for Jina (10M free tokens/mo) is enough for this volume.
2. Is the `Lead` model's `source` field used anywhere downstream for reporting? If yes, the new script should tag with `source='therapydn_v1'` (or similar) so we can measure conversion rate against the burned `source='counselor_emails_usa'` baseline.
3. Has the Spacemail inbox reputation recovered enough to restart sending at full 50/day cap? If not, ramp 10/day → 25/day → 50/day over the first two weeks of the new lead source to rebuild reputation on better-quality recipients.

## What's already in project memory on the directory side

- `feedback_lead_quality.md` — the gmail-leads-are-trash insight, formalized
- `feedback_email_address.md` — always use `hello@weddingcounselors.com`, never `support@`
- `feedback_no_indexing_api.md` — don't use Google Indexing API on profiles (separate issue, but flagging in case it comes up)
- `project_indexing_strategy.md` — current SEO state (16/37 indexed, $0 revenue) for context on how much organic acquisition is *not* coming through

That's the full picture. The work is small (~one new script, one new workflow, a one-line addition to the exclusion regex) but the framing matters more than the code: the goal is **50 high-signal leads/day**, not "as many as possible."
