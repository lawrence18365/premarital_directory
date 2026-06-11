/**
 * affiliateOffers.js
 *
 * Verified affiliate / referral partners, grouped by the page context they
 * fit. Drop <AffiliateOffers context="..." /> onto a ranking page and it
 * renders only the partners relevant to that page, with the required FTC
 * disclosure.
 *
 * STATUS LEGEND (per partner):
 *   live      — affiliate link is real, you are approved, revenue flows
 *   pending   — program is real & verified to pay, but you have NOT signed up
 *               yet. The `url` is the program's PUBLIC page, not your tracked
 *               link. Sign up, then paste your tracked URL into `url` and flip
 *               status to 'live'.
 *   partner   — no public network; revenue requires a direct referral/rev-share
 *               deal closed via outreach (see docs/monetization/affiliate-partner-outreach.md)
 *
 * Verified June 2026 — see commit notes / GSC+monetization analysis.
 */

// ── One-line edit after each program approves you ───────────────────────────
// Paste your tracked affiliate URL here and set the matching partner to 'live'.
export const AFFILIATE_LINKS = {
  onlineTherapy: 'https://www.online-therapy.com/affiliate.php', // → replace w/ tracked link after signup
  regain: 'https://www.regain.us/',                             // BetterHelp/ReGain — via CJ/Impact after approval
  amazonTag: '',                                                // e.g. 'weddingcouns-20' — Amazon Associates store id
}

const amazon = (asin, label) => {
  const tag = AFFILIATE_LINKS.amazonTag
  const base = `https://www.amazon.com/dp/${asin}`
  return tag ? `${base}?tag=${tag}` : base
}

// ── Partners ────────────────────────────────────────────────────────────────
export const AFFILIATE_PARTNERS = {
  // Couples / online therapy — the highest confirmed payout. Anchor offer.
  therapy: [
    {
      id: 'online-therapy',
      name: 'Online-Therapy.com',
      status: 'pending',
      url: AFFILIATE_LINKS.onlineTherapy,
      payoutNote: '$150 per signup · 90-day cookie',
      blurb: 'Structured CBT-based program with dedicated couples therapy, worksheets, and live sessions. 20% off the first month.',
      cta: 'Start couples therapy',
      bestFor: 'Couples who want ongoing support, not just an assessment.'
    },
    {
      id: 'regain',
      name: 'ReGain (BetterHelp for couples)',
      status: 'pending',
      url: AFFILIATE_LINKS.regain,
      payoutNote: 'Referral payout per qualified signup',
      blurb: 'The largest online couples-counseling network. Matched to a licensed relationship therapist, message or video anytime.',
      cta: 'Get matched with a counselor',
      bestFor: 'Couples who want the biggest therapist network and fast matching.'
    }
  ],

  // Books — trivial, instant-approval Amazon Associates (4.5% on books).
  books: [
    {
      id: 'book-8-dates',
      name: 'Eight Dates — Gottman',
      status: 'pending',
      url: amazon('1984818007'),
      payoutNote: 'Amazon Associates',
      blurb: 'Eight essential conversations for a lifetime of love, from the Gottman Institute.',
      cta: 'View on Amazon',
      bestFor: 'Couples who want a guided, do-it-yourselves conversation framework.'
    },
    {
      id: 'book-saving-marriage',
      name: 'Saving Your Marriage Before It Starts — Parrott',
      status: 'pending',
      url: amazon('0310875455'),
      payoutNote: 'Amazon Associates',
      blurb: 'The book behind the SYMBIS assessment — seven questions to ask before (and after) you marry.',
      cta: 'View on Amazon',
      bestFor: 'Faith-friendly couples comparing assessment approaches.'
    }
  ],

  // Marriage-license discount — small course operators, NO public network.
  // Revenue requires a direct referral deal (outreach). Until a deal closes,
  // leave this empty so nothing un-monetized-but-link-farmy ships.
  license: [
    // Filled in per state as partnership deals close. Example shape:
    // {
    //   id: 'twogether-provider-tx',
    //   name: 'Approved Online Premarital Course (Texas)',
    //   status: 'partner',
    //   url: 'https://partner.example.com/?ref=weddingcounselors',
    //   payoutNote: 'Direct referral deal',
    //   blurb: 'State-approved 8-hour course. Qualifies for the $60 license discount + waives the 72-hour wait.',
    //   cta: 'Take the approved course',
    //   bestFor: 'Texas couples who want the license discount.'
    // }
  ]
}

export const AFFILIATE_DISCLOSURE =
  'Some links on this page are partner links. If you sign up through them we may earn a referral fee at no extra cost to you. We only list services we would point a friend to — it never changes what we recommend.'

// Only return partners that are actually actionable (have a usable url).
export const getOffers = (context) =>
  (AFFILIATE_PARTNERS[context] || []).filter((p) => p.url && p.url.length > 0)
