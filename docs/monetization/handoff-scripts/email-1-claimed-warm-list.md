# Email 1 — Warm list: the 42 claimed counselors

**Audience:** Counselors who already claimed their profile (file: `claimed-counselors.csv`).
**Goal:** First-dollar attempt. Acknowledge form bug, offer Founding Pro upgrade at $79.
**Send via:** Reply manually from `hello@weddingcounselors.com`. Personalize {first_name}, {city}, {state_long}, {profile_url}, {payment_link}.
**When:** As soon as Stripe Payment Links are created.

---

## Subject lines (A/B if you can — pick one)

A. `quick fix on your weddingcounselors.com profile`
B. `apology + something I'd like to offer you`
C. `your profile leads were stuck — fixed today`

Recommended: **A**. Curiosity + ownership, no salesy energy.

---

## Body — plain text, paste into Spacemail

```
Hi {first_name},

Quick honest note. I run weddingcounselors.com — you claimed your profile
({profile_url}) a while back, and I owe you a heads-up.

Our contact form has been silently failing on the server side for the past
several weeks. Couples were submitting inquiries through profile pages, our
analytics counted the submissions, but they never landed in the database.
That bug is fixed as of today.

If you weren't getting leads from us, that's why. Sorry about that.

Two things I want to offer you because you stuck around through it:

1. We're locking in 5 founding featured slots per state. Featured profiles
   appear at the top of city + specialty search pages on weddingcounselors.com,
   plus you get the Verified badge on your listing. {state_long} has {slots_left}
   spots left.

2. Founding price is $79 once. Lifetime — no monthly, no per-lead fee.
   After founding closes, featured slots are $29/month for new counselors.

If that fits, here's the link: {payment_link}
Profile gets boosted within 24h of payment. I'll handle it personally.

If it doesn't fit, no problem — your profile stays free either way and
the form fix is live regardless.

Sarah
Wedding Counselors Directory
hello@weddingcounselors.com
```

---

## Mail-merge variables

For each row in `claimed-counselors.csv`:

- `{first_name}` = first word of `full_name` (handle `Dr.`, `Rev.` titles — check for prefix)
- `{profile_url}` = the `profile_url` column
- `{state_long}` = full state name (e.g., `KS` → `Kansas`)
- `{slots_left}` = manual; just say "a few" if you don't want to track. Real number = 5 minus claimed-this-week-in-state.
- `{payment_link}` = your $79 Stripe Payment Link

---

## Why this email works

- **Leads with truth, not pitch.** Acknowledging the bug builds trust before asking for money.
- **No pretend scarcity.** "5 per state" is a real cap you set. "A few left" is honest.
- **Lifetime price beats monthly anchor.** $79 once vs $29/mo positions $79 as the obvious deal.
- **No-friction opt-out.** "Profile stays free either way" removes the fear of pressure.
- **Hand-personalized signoff.** Sarah, real email. No "team" voice.

---

## Manual follow-up sequence (if no reply in 4 days)

**Email 2 (T+4):** one-line check-in.

```
Hi {first_name} — wanted to make sure my last note didn't get buried.
Founding featured slot for {state_long} is still open: {payment_link}
No worries if not for you.

Sarah
```

**Don't email a 3rd time.** This list is too small to burn.
