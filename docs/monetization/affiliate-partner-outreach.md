# Affiliate & Partner Outreach — ready-to-send

_Verified June 2026. Send from `hello@weddingcounselors.com` (Spacemail SMTP)._

Two tracks:

- **Track A — self-serve affiliate programs.** No email needed; just apply. Listed first with the exact signup step and what to paste back into `client/src/lib/affiliateOffers.js`.
- **Track B — direct referral deals.** The marriage-license course operators have no public network, so revenue needs a 1:1 deal. Emails below are written against Cialdini's 7 principles — each lever is annotated `[principle]` so you can see why it's there. Strip the annotations before sending.

---

## Track A — self-serve programs (apply this week, no email)

### 1. Online-Therapy.com — **$150/signup, 90-day cookie** (anchor)
- Apply: <https://www.online-therapy.com/affiliate.php>
- After approval: paste your tracked link into `AFFILIATE_LINKS.onlineTherapy` and flip the `online-therapy` partner `status` to `'live'`.
- Place on: `prepare-enrich-vs-gottman-vs-symbis` (your #1 page, 40 clicks/mo), couples-counseling content, "near me" pages → `<AffiliateOffers context="therapy" />`.

### 2. ReGain / BetterHelp — referral per qualified signup
- Apply via their network (Impact/CJ — search "BetterHelp affiliate" / "ReGain partner").
- After approval: paste tracked link into `AFFILIATE_LINKS.regain`, flip `regain` to `'live'`.

### 3. Amazon Associates — **books 4.5%**, instant approval
- Apply: <https://affiliate-program.amazon.com> (need a few posts with traffic — you qualify).
- After approval: set `AFFILIATE_LINKS.amazonTag` to your store id (e.g. `weddingcouns-20`). The book ASINs are already wired in `affiliateOffers.js`; verify they're the editions you want.
- Place on: `best-premarital-counseling-books` → `<AffiliateOffers context="books" />`.

---

## Track B — direct referral deal: online premarital course providers

**Who:** operators running state-approved online courses (Twogether in Texas, and the equivalents in FL / GA / MN / OK / TN / UT). Find them by searching `"[state] premarital course online"` — the ones already buying ads are the ones with budget to share.

**Your leverage:** you rank **page 1 (pos 6)** for `marriage license discount` and own per-state license pages. You can put their course in front of couples who are *legally required* to buy one. That's a warmer intro than any ad they're running.

These are **Category C** emails (1:1, person-typed). They're sent via the typed-body + designed-footer pipeline — see "How to send" below. Three templates live in `scripts/email/outreach-partners.mjs`: `cold`, `followup`, `proof`. Copy is parameterized (name, state, perk) so each send is personalized.

### How to send (dry-run first, always)

```bash
# Preview (sends nothing):
node scripts/email/outreach-partners.mjs --template cold --first Jamie --state Texas \
  --perk "$60 off the license plus no 72-hour wait"

# Send for real (adds the designed footer + wordmark, copies to Sent):
node scripts/email/outreach-partners.mjs --template cold --to owner@course.com \
  --first Jamie --state Texas --perk "$60 off the license plus no 72-hour wait" --send

# Follow-up 4 days later (optionally cite reader count):
node scripts/email/outreach-partners.mjs --template followup --to owner@course.com \
  --first Jamie --state Texas --readers 240 --send

# Proof-led, once other deals exist:
node scripts/email/outreach-partners.mjs --template proof --to owner@course.com \
  --first Jamie --state Texas --others "Florida and Minnesota" --send
```

The footer (wordmark, contact rows, CAN-SPAM line) is added automatically by `scripts/email/signature.mjs` — never paste it into the body.

### Reference copy (the `cold` template, rendered)

> Hi Jamie,
>
> I run WeddingCounselors.com — a directory couples use to find premarital counseling and the approved courses that go with it.
>
> Our guide to the Texas marriage-license discount sits on the first page of Google, so it gets a steady stream of couples who need to finish an approved course to claim it — in Texas, that's $60 off the license plus no 72-hour wait. Right now we hand them general information and send them on their way.
>
> I'd rather point them to one course we actually trust, and yours keeps coming up as one of the good ones. If you're open to it: you give me a tracked link, I feature your course on the Texas page, and you pay only when a couple completes through us — nothing if it doesn't work.
>
> We're featuring one provider per state, and I wanted to come to you first in Texas. If that's interesting, just reply and I'll send the details — happy to keep it simple.
>
> _(sign-off + designed footer added automatically)_

---

## Notes on the influence levers (the `sales-influence` framework)

The templates bake these in, so you don't have to think about them per send:

- **cold** → authority + social proof ("first page of Google"), scarcity + unity ("one provider per state… you first"), reciprocity ("nothing if it doesn't work"), small-yes commitment ("just reply").

- **Reciprocity / risk reversal** — "no cost unless it works" removes their risk and creates a sense of a fair, generous offer.
- **Authority + social proof** — leading with "page 1 of Google" and real reader counts is the strongest card you hold; never bury it.
- **Scarcity** — "one provider per state" is true (you only feature one) and makes the slot feel losable.
- **Unity** — "I came to you first" signals they're an insider, not a list.
- **Commitment & consistency** — every email asks for the *smallest possible yes* (a call, a one-line reply), never "sign this contract."
- **Liking** — flexible terms ("whatever's simplest on your end") lowers friction and makes you easy to say yes to.

**Disclosure reminder:** every monetized page must carry the FTC line (already baked into `<AffiliateOffers>` via `AFFILIATE_DISCLOSURE`). Don't ship a partner link without it.
