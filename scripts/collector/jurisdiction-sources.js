/**
 * Jurisdiction Source Registry
 *
 * Maps each jurisdiction_id to:
 *   - Known official source URLs (verified to exist)
 *   - Brave Search queries to use when URLs are unknown
 *   - Source type + priority per URL
 *
 * HOW TO ADD A SOURCE:
 *   Add to the KNOWN_URLS array below, then run:
 *     node scripts/collector/run-collector.js --jurisdiction <id>
 *
 * HOW TO DISCOVER URLS:
 *   For jurisdictions with no known URLs, the collector uses Brave Search:
 *     node scripts/collector/run-collector.js --find-sources --jurisdiction <id>
 */

'use strict'

/**
 * @typedef {Object} SourceEntry
 * @property {string}   url          - canonical URL to fetch
 * @property {string}   source_type  - one of: state_statute, county_clerk_site, official_form, state_agency, court_site, faq_page
 * @property {number}   priority     - 1 (highest, statute) → 10 (lowest)
 * @property {number}   recrawl_days - how often to re-fetch this URL
 */

/**
 * Known, verified source URLs per jurisdiction.
 * URLs here are copied from the existing STATE_DISCOUNT_CONFIG.certificateUrl
 * or manually verified against primary government sites.
 */
const KNOWN_URLS = {
  texas: [
    // Best available source: Texas State Law Library guide (369 words, 65/100 readiness).
    // Captures: benefit_types, hours_required, waiting_period, statute_citation, approved_provider_rules.
    // Missing: fee amounts, provider_types, cert_fields, submission_where.
    // To improve: find a Twogether county clerk page that lists the $82→$22 fee explicitly.
    // BLOCKED: twogetherintexas.com (SSL cert mismatch www vs root), statutes.capitol.texas.gov (nav-only),
    //          Justia (403), HHS.texas.gov/laws-regulations/laws/texas-marriage-law (404),
    //          Harris County / Tarrant County clerk URLs (404).
    {
      url: 'https://guides.sll.texas.gov/marriage-in-texas/premarital-education',
      source_type: 'faq_page',
      priority: 1,
      recrawl_days: 30,
    },
  ],
  maryland: [
    // Auto-approved 95/100. Sources: §2-404.1 (discount auth) + §2-406 (solemnization).
    // County fees vary by county governing body — no statewide amount in statute.
    {
      url: 'https://mgaleg.maryland.gov/mgawebsite/Laws/StatuteText?article=gfl&section=2-404.1',
      source_type: 'state_statute',
      priority: 1,
      recrawl_days: 60,
    },
  ],
  oklahoma: [
    // Best available: HB3075 enrolled bill (2327 words, 60/100 readiness).
    // Captures: benefit_types, premarital_program_required, submission_process, statute_citation.
    // Missing: fee amounts (governed by 28 O.S. §31, BLOCKED), program hours + provider rules (43 O.S. §5.1, BLOCKED).
    // BLOCKED: oscn.net (robots.txt blocks all /applications/oscn/ paths),
    //          Justia (403), FindLaw §43-5 (JS SPA, 18 words),
    //          FindLaw §28-31 (403), NCSL page (404), Oklahoma DHS (404).
    // FIX: Manually enter fee ($5 reduced from $50) and program details from
    //      https://www.oscn.net/applications/oscn/DeliverDocument.asp (view in browser).
    {
      url: 'https://www.oklegislature.gov/cf_pdf/2021-22%20ENR/hB/HB3075%20ENR.PDF',
      source_type: 'official_form',
      priority: 1,
      recrawl_days: 365,  // enrolled bill, rarely changes
    },
    {
      url: 'https://www.oklegislature.gov/OK_Statutes/CompleteTitles/os43.pdf',
      source_type: 'state_statute',
      priority: 2,
      recrawl_days: 90,
    },
  ],
  indiana: [
    // Score 40/100 (degraded when wrong sections cleared excerpt field).
    // The discount provision is NOT in IC 31-11-4 (chapter 4 = application requirements).
    // Likely in IC 31-11-4.5 (Premarital Preparation, added by P.L.115-2020) — not findable via
    // automated collection (IGA = JS SPA, Justia = 403, FindLaw = 403 for most sections).
    // BLOCKED: in.gov/courts PDF (404), Justia (403), IGA (JS SPA, 3 words),
    //          FindLaw §§4-4/4-5/4-6/4-7/4-8 (403 except §4-5 = HIV info, §4-6 = age proof, §4-4 = application).
    // FIX: Visit https://iga.in.gov/laws/2023/ic/titles/031/articles/011/chapters/4.5 in browser
    //      and manually enter IC 31-11-4.5 data, OR check if benefit was repealed (in.gov/courts
    //      page currently shows no counseling discount).
    {
      url: 'https://www.in.gov/courts/services/marriage-license/',
      source_type: 'court_site',
      priority: 1,
      recrawl_days: 30,
    },
  ],
  // For all other states, the collector uses Brave Search to discover URLs.
  // Add entries here once you verify a URL is correct.
}

/**
 * Brave Search queries for each jurisdiction, ordered by expected quality.
 * The collector runs these, scores results by domain authority pattern
 * (gov > org > edu >> com), and returns the top 2–3 candidates for review.
 *
 * Queries are intentionally precise to surface statutes and clerk sites first.
 */
const BRAVE_SEARCH_QUERIES = {
  florida: [
    'Florida marriage license premarital counseling discount statute site:leg.state.fl.us OR site:flsenate.gov',
    'Florida "741.0305" marriage license premarital preparation',
    'Florida county clerk marriage license premarital education certificate',
  ],
  georgia: [
    'Georgia marriage license premarital education discount statute site:law.georgia.gov OR site:legis.ga.gov',
    'Georgia "19-3-30.1" OR "19-3-42" marriage license premarital education',
    'Georgia probate court marriage license premarital counseling discount form',
  ],
  maryland: [
    'Maryland marriage license premarital counseling discount statute site:mgaleg.maryland.gov',
    'Maryland "2-406" marriage license premarital instruction waiver',
    'Maryland circuit court marriage license premarital counseling certificate',
  ],
  minnesota: [
    'Minnesota marriage license premarital education discount statute site:revisor.mn.gov',
    'Minnesota "517.08" marriage license premarital education course',
    'Minnesota county marriage license premarital education certificate form',
  ],
  oklahoma: [
    // NOTE: oscn.net blocks robots.txt for all /applications/oscn/ paths.
    // The codified statute (43 O.S. §5 + §5.1) must be viewed manually at oscn.net.
    // Fee amounts are in 28 O.S. §31 (FindLaw 403, Justia 403).
    // Best automated source is the HB3075 enrolled bill PDF on oklegislature.gov.
    'Oklahoma "43 O.S. 5" OR "Section 5.1" premarital counseling marriage license fee county clerk',
    'Oklahoma premarital counseling marriage license fee reduced site:oklahomacounty.org OR site:tulsacounty.org',
    'Oklahoma marriage license premarital counseling program hours providers certificate',
  ],
  tennessee: [
    'Tennessee marriage license premarital preparation discount statute site:tennesseecode.org OR site:tn.gov',
    'Tennessee "36-3-104" marriage license premarital preparation discount',
    'Tennessee county clerk marriage license premarital preparation certificate',
  ],
  texas: [
    // NOTE: twogetherintexas.com has SSL cert mismatch (www vs root domain).
    // statutes.capitol.texas.gov returns nav-menu only (150 words, no statute text).
    // Best source: guides.sll.texas.gov (Texas State Law Library, 369 words, 65/100).
    // Missing: specific fee amounts ($82 standard → $22 with Twogether), cert fields, submission process.
    'Texas Twogether premarital education certificate "marriage license" fee discount county clerk',
    'Texas "Family Code 2.013" OR "Section 2.013" premarital education marriage license discount',
    'Texas county clerk marriage license Twogether certificate submission process form',
  ],
  indiana: [
    // NOTE: The discount provision is NOT in IC 31-11-4 (application requirements chapter).
    // Likely in IC 31-11-4.5 "Premarital Preparation" (P.L.115-2020) — IGA is a JS SPA.
    // Justia and FindLaw block most IC 31-11 sections (403).
    // Check if benefit still exists: in.gov/courts page shows no counseling discount currently.
    'Indiana "IC 31-11-4.5" OR "31-11-4.5" premarital preparation marriage license discount',
    'Indiana marriage license premarital counseling fee waiver reduction site:in.gov OR site:iga.in.gov',
    'Indiana county clerk marriage license premarital counseling discount certificate',
  ],
}

/**
 * Returns the known source URLs for a jurisdiction.
 * If none exist, returns empty array (caller should use Brave Search).
 * @param {string} jurisdictionId
 * @returns {SourceEntry[]}
 */
function getKnownUrls(jurisdictionId) {
  return KNOWN_URLS[jurisdictionId] || []
}

/**
 * Returns Brave Search queries for a jurisdiction.
 * @param {string} jurisdictionId
 * @returns {string[]}
 */
function getBraveQueries(jurisdictionId) {
  return BRAVE_SEARCH_QUERIES[jurisdictionId] || [
    `${jurisdictionId} marriage license premarital counseling discount statute`,
    `${jurisdictionId} county clerk marriage license premarital education certificate form`,
  ]
}

/**
 * All jurisdiction IDs in the DB seed, ordered by priority
 * (approximate search volume / strategic value).
 */
const JURISDICTION_PRIORITY_ORDER = [
  'texas',      // highest volume + known program
  'florida',
  'minnesota',
  'oklahoma',
  'tennessee',
  'indiana',
  'georgia',
  'maryland',
]

module.exports = { getKnownUrls, getBraveQueries, JURISDICTION_PRIORITY_ORDER }
