/**
 * Jurisdiction Benefits — Schema Definition + Validation
 *
 * Single source of truth for:
 *   - What fields exist and what values are legal
 *   - How to score completeness (readiness gate for indexing)
 *   - Sub-schemas for JSONB fields
 *
 * Used by:
 *   - The extractor (Steps 2-3): maps raw source text → these fields
 *   - The generator (Step 4): knows which fields must be non-null to render each section
 *   - The QA layer (Step 6): validates before promoting to 'verified'
 */

// ─── Enum constants ────────────────────────────────────────────────────────────

export const JURISDICTION_TYPES = ['state', 'county', 'city']

export const BENEFIT_TYPES = [
  'discount',               // fee reduction in dollars
  'fee_waiver',             // full waiver (e.g., Oklahoma near-waiver)
  'waiting_period_reduction', // partial reduction of waiting period
  'waiting_period_waiver',  // full waiver of waiting period
]

export const ACCEPTED_FORMATS = [
  'online',         // synchronous video or async online course
  'in_person',      // face-to-face sessions
  'self_directed',  // workbook / app with no live facilitator
  'video',          // recorded video course (distinct from live online)
  'workbook',       // paper workbook only
]

export const PROVIDER_TYPES = [
  'lmft',               // Licensed Marriage and Family Therapist
  'lpc',                // Licensed Professional Counselor
  'lcsw',               // Licensed Clinical Social Worker
  'psychologist',       // Licensed Psychologist
  'clergy',             // Ordained clergy (any denomination)
  'certified_educator', // State-certified relationship educator
  'approved_program',   // Participant in a named state program (e.g., Twogether in Texas)
]

export const SOURCE_TYPES = [
  'state_statute',      // Legislative code / statute text
  'county_clerk_site',  // Official county clerk website
  'official_form',      // Official government PDF/form
  'state_agency',       // State agency page (AG, DHHS, etc.)
  'court_site',         // Court system website
  'faq_page',           // Government FAQ page
]

export const VERIFICATION_STATUSES = ['draft', 'needs_review', 'verified', 'stale', 'no_benefit']

// ─── Sub-schemas (document shape for JSONB fields) ─────────────────────────────

/**
 * eligibility_rules — who qualifies
 * @typedef {Object} EligibilityRules
 * @property {boolean}  residency_required   - must both parties be residents of this jurisdiction?
 * @property {number|null} age_minimum       - minimum age without parental consent (typically 18)
 * @property {boolean}  both_parties_required - must BOTH attend counseling?
 * @property {string[]} exceptions           - free-text exceptions
 * @property {string}   notes                - catch-all for anything not modeled above
 */
export const ELIGIBILITY_RULES_DEFAULTS = {
  residency_required: false,
  age_minimum: 18,
  both_parties_required: true,
  exceptions: [],
  notes: '',
}

/**
 * approved_provider_rules — who can issue the qualifying certificate
 * @typedef {Object} ApprovedProviderRules
 * @property {string[]} accepted_types          - subset of PROVIDER_TYPES
 * @property {boolean}  approved_list_only      - only providers on a state-maintained list?
 * @property {string|null} approved_list_url    - URL to official provider list
 * @property {boolean}  state_registration_required - must provider register with state?
 * @property {string|null} state_program_name   - e.g., "Twogether in Texas"
 * @property {string}   notes
 */
export const APPROVED_PROVIDER_RULES_DEFAULTS = {
  accepted_types: [],
  approved_list_only: false,
  approved_list_url: null,
  state_registration_required: false,
  state_program_name: null,
  notes: '',
}

/**
 * certificate_fields — what the completion certificate must contain
 * @typedef {Object} CertificateFields
 * @property {string[]} required_fields          - list of fields the cert must show
 * @property {boolean}  provider_signature_required
 * @property {boolean}  notarization_required
 * @property {boolean}  state_issued_form        - must use the official state form?
 * @property {string|null} official_form_url     - URL to download the official form
 * @property {number|null} validity_days         - how long cert is valid; null = no stated expiry
 */
export const CERTIFICATE_FIELDS_DEFAULTS = {
  required_fields: [
    'couple_names',
    'completion_date',
    'provider_name',
    'provider_credentials',
    'hours_completed',
  ],
  provider_signature_required: true,
  notarization_required: false,
  state_issued_form: false,
  official_form_url: null,
  validity_days: null,
}

/**
 * submission_process — how to redeem the benefit
 * @typedef {Object} SubmissionProcess
 * @property {string}   where                  - "County Clerk of Court", "Circuit Court Clerk", etc.
 * @property {string}   how                    - "In person at time of license application"
 * @property {string}   deadline_window        - when cert must be presented relative to application
 * @property {string[]} forms_required         - names of any required forms besides the certificate
 * @property {boolean}  online_submission_allowed
 * @property {string}   notes
 */
export const SUBMISSION_PROCESS_DEFAULTS = {
  where: '',
  how: '',
  deadline_window: '',
  forms_required: [],
  online_submission_allowed: false,
  notes: '',
}

/**
 * official_source — one primary-source citation
 * @typedef {Object} OfficialSource
 * @property {string}   url
 * @property {string}   source_type            - one of SOURCE_TYPES
 * @property {string}   title                  - page/doc title
 * @property {string}   retrieved_at           - ISO8601 timestamp
 * @property {string}   excerpt                - verbatim text snippet supporting the data
 * @property {string}   content_hash           - sha256 of full page content at retrieval
 * @property {string[]} fields_supported       - which schema fields this source supports
 */

/**
 * faq_item — one FAQ entry on the page
 * @typedef {Object} FaqItem
 * @property {string} question
 * @property {string} answer
 * @property {string} jtbd   - which job-to-be-done: qualify|savings|online|submission|fastest
 */

// ─── Readiness scoring ─────────────────────────────────────────────────────────

/**
 * Score weights — must sum to 100.
 * Mirror the SQL function compute_jb_readiness_score() exactly.
 * If you change weights here, update the SQL function too.
 */
export const READINESS_WEIGHTS = {
  has_source_with_excerpt: 20,  // ≥1 official_source with url + excerpt
  has_statute_citation:    15,  // statute_citation present
  has_hours_or_no_program: 15,  // hours_required set OR program not required
  has_accepted_formats:    15,  // accepted_formats non-empty
  has_provider_types:      10,  // approved_provider_rules.accepted_types non-empty
  has_cert_fields:         10,  // certificate_fields.required_fields non-empty
  has_submission_where:    10,  // submission_process.where present
  recently_verified:        5,  // last_verified_at within 90 days
}

export const READINESS_INDEX_THRESHOLD = 70  // score must be >= this AND status='verified'

/**
 * Compute a readiness score for a jurisdiction benefit record.
 * @param {Object} record — a row from jurisdiction_benefits
 * @returns {{ score: number, breakdown: Object, indexed: boolean, noindex_reason: string|null }}
 */
export function computeReadinessScore(record) {
  const breakdown = {}
  let score = 0

  // has_source_with_excerpt
  const sources = record.official_sources || []
  const w1 = READINESS_WEIGHTS.has_source_with_excerpt
  if (sources.length > 0 && sources[0].url && sources[0].excerpt) {
    breakdown.has_source_with_excerpt = w1
    score += w1
  } else {
    breakdown.has_source_with_excerpt = 0
  }

  // has_statute_citation
  const w2 = READINESS_WEIGHTS.has_statute_citation
  if (record.statute_citation) {
    breakdown.has_statute_citation = w2
    score += w2
  } else {
    breakdown.has_statute_citation = 0
  }

  // has_hours_or_no_program
  const w3 = READINESS_WEIGHTS.has_hours_or_no_program
  if (record.hours_required != null || record.premarital_program_required === false) {
    breakdown.has_hours_or_no_program = w3
    score += w3
  } else {
    breakdown.has_hours_or_no_program = 0
  }

  // has_accepted_formats
  const w4 = READINESS_WEIGHTS.has_accepted_formats
  if ((record.accepted_formats || []).length > 0) {
    breakdown.has_accepted_formats = w4
    score += w4
  } else {
    breakdown.has_accepted_formats = 0
  }

  // has_provider_types
  const w5 = READINESS_WEIGHTS.has_provider_types
  const provTypes = record.approved_provider_rules?.accepted_types || []
  if (provTypes.length > 0) {
    breakdown.has_provider_types = w5
    score += w5
  } else {
    breakdown.has_provider_types = 0
  }

  // has_cert_fields — counts if any certificate_fields data was extracted
  // (required_fields defaults are often not explicitly stated in source docs)
  const w6 = READINESS_WEIGHTS.has_cert_fields
  const hasCertData = record.certificate_fields != null &&
    (record.certificate_fields.required_fields?.length > 0 ||
     record.certificate_fields.state_issued_form != null ||
     record.certificate_fields.validity_days != null)
  if (hasCertData) {
    breakdown.has_cert_fields = w6
    score += w6
  } else {
    breakdown.has_cert_fields = 0
  }

  // has_submission_where
  const w7 = READINESS_WEIGHTS.has_submission_where
  if (record.submission_process?.where) {
    breakdown.has_submission_where = w7
    score += w7
  } else {
    breakdown.has_submission_where = 0
  }

  // recently_verified (90 days)
  const w8 = READINESS_WEIGHTS.recently_verified
  if (record.last_verified_at) {
    const ageMs = Date.now() - new Date(record.last_verified_at).getTime()
    const ageDays = ageMs / (1000 * 60 * 60 * 24)
    if (ageDays <= 90) {
      breakdown.recently_verified = w8
      score += w8
    } else {
      breakdown.recently_verified = 0
    }
  } else {
    breakdown.recently_verified = 0
  }

  const totalScore = Math.min(score, 100)
  const isVerified = record.verification_status === 'verified'
  const indexed = totalScore >= READINESS_INDEX_THRESHOLD && isVerified

  let noindexReason = null
  if (!indexed) {
    if (totalScore < READINESS_INDEX_THRESHOLD) noindexReason = `low_readiness_score:${totalScore}`
    else if (!isVerified) noindexReason = `unverified:${record.verification_status}`
    else if (!record.last_verified_at) noindexReason = 'never_verified'
  }

  return { score: totalScore, breakdown, indexed, noindexReason }
}

// ─── Validation (pre-publish checks) ──────────────────────────────────────────

/**
 * Validate a jurisdiction_benefits record.
 * Returns an array of error strings. Empty array = valid.
 * @param {Object} record
 * @returns {string[]} errors
 */
export function validateJurisdictionBenefit(record) {
  const errors = []

  // Identity
  if (!record.jurisdiction_id) errors.push('jurisdiction_id is required')
  if (!JURISDICTION_TYPES.includes(record.jurisdiction_type)) {
    errors.push(`jurisdiction_type must be one of: ${JURISDICTION_TYPES.join(', ')}`)
  }
  if (!record.jurisdiction_name) errors.push('jurisdiction_name is required')
  if (!record.state_abbr || record.state_abbr.length !== 2) {
    errors.push('state_abbr must be a 2-letter code')
  }
  if (record.jurisdiction_type !== 'state' && !record.parent_jurisdiction_id) {
    errors.push('county/city records must have a parent_jurisdiction_id pointing to the state')
  }

  // Benefit types
  if (!record.benefit_types || record.benefit_types.length === 0) {
    errors.push('benefit_types must have at least one value')
  }
  const invalidBenefits = (record.benefit_types || []).filter(b => !BENEFIT_TYPES.includes(b))
  if (invalidBenefits.length) errors.push(`Invalid benefit_types: ${invalidBenefits.join(', ')}`)

  // Fees — if discount benefit, must have fee data
  if ((record.benefit_types || []).includes('discount')) {
    if (record.license_fee_cents == null && !record.fee_varies_by_county) {
      errors.push('discount benefit requires license_fee_cents (or set fee_varies_by_county=true for counties)')
    }
    if (record.discounted_fee_cents == null && !record.fee_varies_by_county) {
      errors.push('discount benefit requires discounted_fee_cents (or set fee_varies_by_county=true)')
    }
    if (
      record.license_fee_cents != null &&
      record.discounted_fee_cents != null &&
      record.discounted_fee_cents > record.license_fee_cents
    ) {
      errors.push('discounted_fee_cents must be <= license_fee_cents')
    }
  }

  // Waiting period
  if ((record.benefit_types || []).some(b => b.startsWith('waiting_period'))) {
    if (record.standard_waiting_period_hours == null) {
      errors.push('waiting period benefit requires standard_waiting_period_hours')
    }
  }

  // Program requirements
  if (record.premarital_program_required) {
    const invalidFormats = (record.accepted_formats || []).filter(f => !ACCEPTED_FORMATS.includes(f))
    if (invalidFormats.length) errors.push(`Invalid accepted_formats: ${invalidFormats.join(', ')}`)
  }

  // Sources
  const sources = record.official_sources || []
  sources.forEach((src, i) => {
    if (!src.url) errors.push(`official_sources[${i}].url is required`)
    if (!SOURCE_TYPES.includes(src.source_type)) {
      errors.push(`official_sources[${i}].source_type must be one of: ${SOURCE_TYPES.join(', ')}`)
    }
    if (!src.excerpt) errors.push(`official_sources[${i}].excerpt is required`)
  })

  // Verification status
  if (!VERIFICATION_STATUSES.includes(record.verification_status)) {
    errors.push(`verification_status must be one of: ${VERIFICATION_STATUSES.join(', ')}`)
  }

  // Readiness gate: cannot be 'verified' with score < threshold
  const { score } = computeReadinessScore(record)
  if (record.verification_status === 'verified' && score < READINESS_INDEX_THRESHOLD) {
    errors.push(`Cannot mark verified with readiness score ${score} (minimum: ${READINESS_INDEX_THRESHOLD})`)
  }

  return errors
}

// ─── Field-level required for each page section ────────────────────────────────

/**
 * Maps page sections to the fields that must be non-null to render that section.
 * The generator uses this to decide whether to render or skip a section.
 */
export const SECTION_FIELD_REQUIREMENTS = {
  savings_summary_box: [
    'license_fee_cents',
    'discounted_fee_cents',
    'savings_amount_cents',
  ],
  waiting_period_callout: [
    'standard_waiting_period_hours',
    // waiting_period_waived or waiting_period_reduction_hours
  ],
  eligibility_checker: [
    'eligibility_rules',
  ],
  program_requirements: [
    'premarital_program_required',
    'accepted_formats',
    // hours_required (if program required)
  ],
  provider_rules: [
    'approved_provider_rules',
  ],
  certificate_details: [
    'certificate_fields',
  ],
  submission_process: [
    'submission_process',
  ],
  fast_path: [
    'fast_path_text',
  ],
  citations: [
    'official_sources',
    // at least one source with url
  ],
  statute_reference: [
    'statute_citation',
  ],
  faqs: [
    'faqs',
    // at least one FAQ item
  ],
}

const JurisdictionBenefitsSchema = {
  JURISDICTION_TYPES,
  BENEFIT_TYPES,
  ACCEPTED_FORMATS,
  PROVIDER_TYPES,
  SOURCE_TYPES,
  VERIFICATION_STATUSES,
  ELIGIBILITY_RULES_DEFAULTS,
  APPROVED_PROVIDER_RULES_DEFAULTS,
  CERTIFICATE_FIELDS_DEFAULTS,
  SUBMISSION_PROCESS_DEFAULTS,
  READINESS_WEIGHTS,
  READINESS_INDEX_THRESHOLD,
  SECTION_FIELD_REQUIREMENTS,
  computeReadinessScore,
  validateJurisdictionBenefit,
}

export default JurisdictionBenefitsSchema
