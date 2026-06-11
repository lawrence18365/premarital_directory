# Email 2 — Cold outreach: 172 unclaimed scraped profiles

**Audience:** Counselors with profiles auto-created from public web data, not yet claimed (file: `unclaimed-with-email.csv`).
**Goal:** Get them to claim AND pay $79 in one motion.
**Send via:** The existing GH Actions outreach cron (`~/Desktop/email`) once billing is restored. Replace the current "free founding" template with this paid one.
**When:** After GitHub billing fixed + Stripe links live.

---

## Why a NEW template (not the existing free one)

The existing template (`setup_wedding_counselors.py`) pitches **free permanently, $29/mo for new joiners later.** That generated 48 responses, ~22 explicitly interested, and **zero dollars** because the offer is free.

The new template asks for $79 up-front. Lower response rate is expected and fine — the only metric that matters now is *paid conversions per 1,000 sent.*

---

## Subject lines (rotate to avoid spam fingerprinting)

- `Your weddingcounselors.com profile — quick question`
- `{first_name}, your premarital counseling profile in {city}`
- `Founding featured spot for {state_long} counselors`

---

## Body — paste into a new template file in `~/Desktop/email/`

```
Hi {first_name|there},

Your premarital counseling practice is already listed on
weddingcounselors.com — couples in {city} can find you here:

{profile_url}

I built the directory because Psychology Today is bloated and couples
searching specifically for premarital counselors get lost. We focus only
on premarital. 5,000+ pages indexed by Google, growing every week.

Your basic listing stays free either way. But I'm offering 5 founding
featured slots per state — featured profiles rank at the top of every
city and specialty search page, plus you get the Verified badge.

For {state_long}, founding spots are $79 one-time, lifetime. No monthly,
no per-lead fees. After founding closes, featured slots will be $29/month
for new counselors — yours stays locked in forever.

If you want one of the {state_long} slots: {payment_link}
You'll get a login link by email within minutes of payment. Profile
boosted within 24h.

If you'd rather just claim the free version, here:
https://www.weddingcounselors.com/claim-profile?email={email_url_encoded}

Either way, let me know if anything on your profile needs editing.

Sarah
Wedding Counselors Directory
hello@weddingcounselors.com
```

---

## Follow-up sequence (existing 3-step is fine — adapt subjects only)

| Step | Day | Subject | Body change |
|---|---|---|---|
| 1 | 0 | `Your weddingcounselors.com profile — quick question` | Body above |
| 2 | +3 | `re: your premarital counseling profile` | Open with: *"Quick follow-up — wanted to make sure this didn't get buried."* Same offer, slightly compressed. |
| 3 | +7 | `closing {state_long} founding spots` | Last note. Same link. End with: *"If not for you, no problem — I'll close the loop and stop reaching out."* |

**Cap at 3 emails per recipient.** The existing cron's 4-step sequence overdoes it for a paid pitch.

---

## Variables you'll need

| Variable | Source |
|---|---|
| `{first_name}` | First word of `full_name` from CSV |
| `{city}` | `city` column |
| `{state_long}` | Full state name (lookup table; `KS` → `Kansas`) |
| `{profile_url}` | `profile_url` column |
| `{payment_link}` | Your $79 Stripe Payment Link |
| `{email_url_encoded}` | URL-encoded `email` column |

---

## Volume plan

- Existing daily cap: 50/day, M–F, 9am–3pm PT
- 172 unclaimed × 3 emails = 516 sends ÷ 50/day = **~11 send-days = 2 weeks of outreach**
- Plus warm list (42) sent manually in week 1
- Total: 2 weeks of testing, ~558 unique emails sent

---

## Conversion math (so you have a benchmark)

The existing free pitch got ~22 interested replies / ~250 sent → ~9% reply rate.

Paid pitch realistic ranges:
- Reply rate: 2–5% (vs 9% free)
- Of replies, paid conversion: 10–30%
- **Expected paid conversions on 500 sends:** 1–7

If you get **0 of 500**, the price/offer is wrong. Lower to $29 first-month or "$19/mo".
If you get **3+ of 500**, you have a real signal worth automating around.
