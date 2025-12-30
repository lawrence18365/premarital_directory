# Cold Outreach Email Templates

## Overview
These templates are optimized for cold outreach to therapists found on Psychology Today, TherapyDen, and other directories. Goal: Get them to create a free profile on WeddingCounselors.com.

---

## Template A: Direct & Short (RECOMMENDED)

**Subject:** `Your premarital counseling practice + {city} couples`

```
Hi {first_name},

I found your profile on Psychology Today and noticed you work with engaged couples in {city}.

I run WeddingCounselors.com — a directory specifically for premarital counseling (not general therapy). We're building city pages that rank for "premarital counseling {city}" searches.

Want a free listing? Takes 2 minutes:
https://www.weddingcounselors.com/professional/signup?utm_source=outreach&utm_medium=email&utm_campaign=provider_acquisition&city={city_slug}

Couples contact you directly — no middleman fees.

Best,
{sender_name}
Wedding Counselors

P.S. Already have 47 providers in {state}. Reply "remove" to opt out.
```

**Why this works:**
- Shows you did research (Psychology Today)
- Clear differentiator (premarital-specific)
- Low commitment (free, 2 minutes)
- Direct CTA with tracking

---

## Template B: Social Proof Version

**Subject:** `{first_name}, join 47 {state} premarital counselors`

```
Hi {first_name},

Quick question — do you work with engaged couples preparing for marriage?

I ask because I run WeddingCounselors.com, and we already have 47 premarital counselors in {state}. I noticed you're not listed yet.

It's a free directory (no fees ever). Couples find you, contact you directly.

Add your free profile here:
https://www.weddingcounselors.com/professional/signup?utm_source=outreach&utm_medium=email&utm_campaign=social_proof

Takes about 2 minutes.

{sender_name}
Wedding Counselors

Reply "remove" to opt out of future emails.
```

---

## Template C: Problem-Aware Version

**Subject:** `Getting found for "premarital counseling {city}"`

```
Hi {first_name},

When couples in {city} search for premarital counseling, are they finding you?

I run WeddingCounselors.com — a directory that ranks for "premarital counseling [city]" searches. We're looking for quality providers to feature in {city}.

No cost to list. No middleman fees. Couples contact you directly.

Claim your free listing:
https://www.weddingcounselors.com/professional/signup?utm_source=outreach&utm_medium=email&utm_campaign=seo_focused

{sender_name}
Wedding Counselors

P.S. Psychology Today is great for general therapy. We focus exclusively on marriage prep.
```

---

## Template D: Follow-Up (Day 3-5)

**Subject:** `Re: Your premarital counseling practice + {city} couples`

```
Hi {first_name},

Just following up on my note about WeddingCounselors.com.

Quick reminder: It's a free directory for premarital counselors. No fees, no contracts.

If you'd like to be listed, here's the link:
https://www.weddingcounselors.com/professional/signup

If not interested, no worries at all — just reply "pass" and I won't follow up again.

{sender_name}
```

---

## Template E: Final Follow-Up (Day 7-10)

**Subject:** `Last note about WeddingCounselors`

```
Hi {first_name},

This is my last email about WeddingCounselors.com.

If you'd like a free listing in our premarital counseling directory, the link is below. If not, no hard feelings.

https://www.weddingcounselors.com/professional/signup?utm_source=outreach&utm_medium=email&utm_campaign=final_followup

Best of luck with your practice,
{sender_name}
```

---

## Variables

| Variable | Example | Source |
|----------|---------|--------|
| `{first_name}` | Jane | Parse from full name |
| `{city}` | Austin | From Psychology Today profile |
| `{city_slug}` | austin | Lowercase, hyphenated |
| `{state}` | Texas | From profile |
| `{sender_name}` | Haylee | Rotate senders |

---

## Subject Line A/B Tests

**Test these:**
1. `Your premarital counseling practice + {city} couples` (personal)
2. `Free listing: WeddingCounselors.com` (direct)
3. `{first_name}, join 47 {state} premarital counselors` (social proof)
4. `Getting found for "premarital counseling {city}"` (problem-aware)
5. `Quick question about your practice` (curiosity)

---

## Best Practices

1. **Send 50-100/day** — Stay under spam thresholds
2. **Rotate sender accounts** — Spread load across 3+ email addresses
3. **Track UTM parameters** — Know which template converts
4. **Follow up 2x max** — Day 3-5 and Day 7-10
5. **Respect opt-outs immediately** — Add to do_not_contact table
6. **Send Tue-Thu 10am-2pm** — Best open rates for B2B

---

## Tracking

Add these UTM parameters to all links:
```
?utm_source=outreach
&utm_medium=email
&utm_campaign={template_name}
&city={city_slug}
```

This lets you see in Google Analytics which emails drive signups.
