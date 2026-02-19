import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import SEOHelmet from '../components/analytics/SEOHelmet'
import Breadcrumbs from '../components/common/Breadcrumbs'
import FAQ from '../components/common/FAQ'
import ProfileCard from '../components/profiles/ProfileCard'
import CitationsBlock from '../components/benefits/CitationsBlock'
import { STATE_DISCOUNT_CONFIG } from '../data/specialtyConfig'
import { STATE_CONFIG } from '../data/locationConfig'
import { SECTION_FIELD_REQUIREMENTS } from '../data/jurisdictionBenefitsSchema'
import { supabase, profileOperations } from '../lib/supabaseClient'
import '../assets/css/discount-page.css'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDollars(cents) {
  if (cents == null) return null
  return `$${(cents / 100).toFixed(2)}`
}

function formatHours(hours) {
  if (hours == null) return null
  if (hours % 24 === 0) return `${hours / 24}-day`
  return `${hours}-hour`
}

const FORMAT_LABELS = {
  online:        'Online',
  in_person:     'In-person',
  self_directed: 'Self-directed',
  video:         'Video course',
  workbook:      'Workbook',
}

const PROVIDER_LABELS = {
  lmft:               'Licensed Marriage & Family Therapist (LMFT)',
  lpc:                'Licensed Professional Counselor (LPC)',
  lcsw:               'Licensed Clinical Social Worker (LCSW)',
  psychologist:       'Licensed Psychologist',
  clergy:             'Ordained Clergy',
  certified_educator: 'Certified Relationship Educator',
  approved_program:   'State-approved program provider',
}

// ─── DB → display adapters ────────────────────────────────────────────────────

/**
 * Returns true when a field section can be rendered from the DB record.
 * Uses SECTION_FIELD_REQUIREMENTS from the schema.
 */
function sectionReady(dbRecord, sectionKey) {
  if (!dbRecord) return false
  const required = SECTION_FIELD_REQUIREMENTS[sectionKey] || []
  return required.every(field => {
    const val = dbRecord[field]
    if (val === null || val === undefined) return false
    if (Array.isArray(val)) return val.length > 0
    if (typeof val === 'object') return Object.keys(val).length > 0
    return true
  })
}

// ─── Component ────────────────────────────────────────────────────────────────

const MarriageLicenseStatePage = () => {
  const { state } = useParams()
  const staticConfig = STATE_DISCOUNT_CONFIG[state]
  const stateConfig  = STATE_CONFIG[state]

  const [dbRecord, setDbRecord]         = useState(null)
  const [dbLoading, setDbLoading]       = useState(true)
  const [providers, setProviders]       = useState([])
  const [loadingProviders, setLoadingProviders] = useState(true)

  // Load from jurisdiction_benefits_public view
  useEffect(() => {
    let cancelled = false
    setDbLoading(true)
    supabase
      .from('jurisdiction_benefits_public')
      .select('*')
      .eq('jurisdiction_id', state)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) {
          setDbRecord(data || null)
          setDbLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setDbLoading(false)
      })
    return () => { cancelled = true }
  }, [state])

  useEffect(() => {
    if (stateConfig) loadProviders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  const loadProviders = async () => {
    try {
      setLoadingProviders(true)
      const { data } = await profileOperations.getProfiles({
        state: stateConfig?.abbr || state.toUpperCase()
      })
      setProviders((data || []).slice(0, 6))
    } catch (err) {
      console.error('Error loading providers:', err)
    } finally {
      setLoadingProviders(false)
    }
  }

  // 404 guard — still need EITHER a static config OR a DB record
  if (!dbLoading && !dbRecord && !staticConfig) {
    return (
      <div className="container" style={{ padding: 'var(--space-20) 0', textAlign: 'center' }}>
        <h2>State Not Found</h2>
        <p className="text-secondary mb-8">
          This state does not offer a marriage license discount for premarital counseling,
          or the page does not exist.
        </p>
        <Link to="/premarital-counseling/marriage-license-discount" className="btn btn-primary">
          View All State Discounts
        </Link>
      </div>
    )
  }

  // Derive display values — DB takes precedence, static config is fallback
  const stateName  = dbRecord?.jurisdiction_name || staticConfig?.name || stateConfig?.name || state
  const stAbbr     = dbRecord?.state_abbr || staticConfig?.abbr || stateConfig?.abbr || state.toUpperCase()

  // Fee display
  const stdFee     = dbRecord ? formatDollars(dbRecord.license_fee_cents) : staticConfig?.originalFee
  const discFee    = dbRecord ? formatDollars(dbRecord.discounted_fee_cents) : staticConfig?.discountedFee
  const savings    = dbRecord ? formatDollars(dbRecord.savings_amount_cents) : staticConfig?.discount

  // Waiting period
  const waitingWaived    = dbRecord?.waiting_period_waived ?? false
  const waitingHours     = dbRecord?.standard_waiting_period_hours
  // eslint-disable-next-line no-unused-vars
  const waitingLabel     = staticConfig?.waitingPeriod  // fallback text

  // Program requirements
  const hoursRequired    = dbRecord?.hours_required ?? null
  const acceptedFormats  = dbRecord?.accepted_formats || []
  const acceptedNote     = dbRecord?.accepted_formats_notes

  // Provider rules
  const providerRules    = dbRecord?.approved_provider_rules || {}
  const acceptedTypes    = providerRules.accepted_types || []

  // Certificate
  const certFields       = dbRecord?.certificate_fields || {}
  const certValidDays    = certFields.validity_days
  const stateIssuedForm  = certFields.state_issued_form
  const officialFormUrl  = certFields.official_form_url || staticConfig?.certificateUrl

  // Submission
  const submission       = dbRecord?.submission_process || {}

  // Sources (public — no content_hash)
  const sources          = dbRecord?.official_sources_public || []
  const statuteCitation  = dbRecord?.statute_citation

  // Page readiness: use is_indexed from DB; for static-only fallback, assume renderable
  const isIndexed        = dbRecord ? dbRecord.is_indexed : Boolean(staticConfig)
  // eslint-disable-next-line no-unused-vars
  const isDbVerified     = dbRecord?.verification_status === 'verified'

  // FAQs — merge DB if available, fall back to static + add standard ones
  const staticFaqs = staticConfig?.faqs || []
  const faqs = [
    ...staticFaqs,
    {
      question: `How much does a marriage license cost in ${stateName} with the discount?`,
      answer: discFee
        ? `With the premarital counseling discount, the ${stateName} marriage license costs ${discFee} instead of the standard ${stdFee}. That is a savings of ${savings}.`
        : `${stateName} offers a discount on marriage license fees for couples who complete premarital counseling. Contact your county clerk for exact amounts.`,
    },
    {
      question: `Can we do premarital counseling online and still get the ${stateName} discount?`,
      answer: acceptedFormats.length > 0
        ? acceptedFormats.includes('online')
          ? `Yes, ${stateName} accepts online premarital counseling${acceptedNote ? '. ' + acceptedNote : '.'}`
          : `${stateName} currently requires in-person premarital counseling for the license discount. Online-only programs may not qualify. Confirm with your county clerk.`
        : `Requirements vary. Contact your county clerk in ${stateName} to confirm whether online premarital counseling certificates are accepted for the marriage license discount.`,
    },
    {
      question: `Who qualifies to provide premarital counseling in ${stateName}?`,
      answer: acceptedTypes.length > 0
        ? `${stateName} accepts premarital counseling from: ${acceptedTypes.map(t => PROVIDER_LABELS[t] || t).join(', ')}.${providerRules.state_registration_required ? ' Providers must be registered with the state.' : ''}`
        : `${stateName} accepts premarital counseling from licensed professionals (LMFT, LPC, LCSW, psychologists) and ordained clergy.`,
    },
  ]

  // Structured data
  const howToStructuredData = staticConfig?.steps ? {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    'name': `How to Get the ${stateName} Marriage License Discount`,
    'description': `Step-by-step guide to saving ${savings} on your ${stateName} marriage license through premarital counseling.`,
    'totalTime': 'P1D',
    'step': staticConfig.steps.map((step, index) => ({
      '@type': 'HowToStep',
      'position': index + 1,
      'text': step,
    })),
  } : null

  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'Premarital Counseling', url: '/premarital-counseling' },
    { name: 'Marriage License Discounts', url: '/premarital-counseling/marriage-license-discount' },
    { name: stateName, url: null },
  ]

  return (
    <>
      <SEOHelmet
        title={`${stateName} Marriage License Discount — Save ${savings || 'money'} with Premarital Counseling`}
        description={`Save ${savings || 'money'} on your ${stateName} marriage license by completing premarital counseling. ${waitingWaived ? 'Waiting period waived.' : ''} Step-by-step guide and certified providers in ${stAbbr}.`}
        url={`/premarital-counseling/marriage-license-discount/${state}`}
        canonicalUrl={`https://www.weddingcounselors.com/premarital-counseling/marriage-license-discount/${state}`}
        breadcrumbs={breadcrumbItems}
        structuredData={howToStructuredData}
        faqs={faqs}
        // Noindex if DB says not ready, but only once DB load is finished
        noindex={!dbLoading && !isIndexed}
      />

      <div className="page-container discount-page">
        <div className="container">
          <Breadcrumbs items={breadcrumbItems} />

          <div className="container-narrow">
            <div className="page-header">
              <h1>{stateName} Marriage License Discount</h1>
              <p className="lead">
                {savings
                  ? `Save ${savings} on your marriage license by completing premarital counseling in ${stateName}`
                  : `${stateName} rewards couples who complete premarital counseling with a marriage license benefit`}
              </p>
            </div>

            {/* ── At-a-glance summary box ──────────────────────────────── */}
            {sectionReady(dbRecord, 'savings_summary_box') && (
              <div className="benefit-summary-box">
                <div className="benefit-stat">
                  <p className="stat-label">Standard Fee</p>
                  <p className="stat-value strikethrough">{stdFee}</p>
                </div>
                <div className="benefit-stat highlight">
                  <p className="stat-label">You Save</p>
                  <p className="stat-value">{savings}</p>
                </div>
                <div className="benefit-stat">
                  <p className="stat-label">With Counseling</p>
                  <p className="stat-value">{discFee}</p>
                </div>
                {(waitingWaived || (waitingHours && dbRecord?.waiting_period_reduction_hours)) && (
                  <div className="benefit-stat bonus">
                    <p className="stat-label">Bonus</p>
                    <p className="stat-value">
                      {waitingWaived
                        ? `${formatHours(waitingHours) || 'Waiting period'} waived`
                        : `${formatHours(dbRecord.waiting_period_reduction_hours)} reduced`}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Static fee box fallback when DB not ready */}
            {!sectionReady(dbRecord, 'savings_summary_box') && staticConfig && (
              <div className="benefit-summary-box">
                <div className="benefit-stat">
                  <p className="stat-label">Standard Fee</p>
                  <p className="stat-value strikethrough">{staticConfig.originalFee}</p>
                </div>
                <div className="benefit-stat highlight">
                  <p className="stat-label">You Save</p>
                  <p className="stat-value">{staticConfig.discount}</p>
                </div>
                <div className="benefit-stat">
                  <p className="stat-label">With Counseling</p>
                  <p className="stat-value">{staticConfig.discountedFee}</p>
                </div>
                {staticConfig.waitingPeriod && staticConfig.waitingPeriod !== 'No waiting period impact' && (
                  <div className="benefit-stat bonus">
                    <p className="stat-label">Bonus</p>
                    <p className="stat-value">{staticConfig.waitingPeriod}</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Fast path ────────────────────────────────────────────── */}
            {sectionReady(dbRecord, 'fast_path') && (
              <div className="fast-path-box">
                <h3>Fastest Route</h3>
                <p>{dbRecord.fast_path_text}</p>
              </div>
            )}

            {/* ── Program requirements (DB-driven) ─────────────────────── */}
            {dbRecord && (
              <div className="content-section">
                <h2>Requirements</h2>

                {/* Online/In-person callout */}
                {acceptedFormats.length > 0 && (
                  <div className={`format-callout ${acceptedFormats.includes('online') ? 'online-ok' : 'inperson-only'}`}>
                    <strong>
                      {acceptedFormats.includes('online')
                        ? '✅ Online counseling accepted'
                        : '⚠️ In-person required'}
                    </strong>
                    {acceptedNote && <span> — {acceptedNote}</span>}
                    {!acceptedNote && acceptedFormats.length > 1 && (
                      <span> · Formats: {acceptedFormats.map(f => FORMAT_LABELS[f] || f).join(', ')}</span>
                    )}
                  </div>
                )}

                {/* Hours */}
                {hoursRequired != null && (
                  <p><strong>Minimum hours:</strong> {hoursRequired} hours of premarital counseling</p>
                )}
                {hoursRequired == null && dbRecord.premarital_program_required && (
                  <p><strong>Minimum hours:</strong> Not specified by state statute — confirm with your county clerk</p>
                )}

                {/* Provider types */}
                {acceptedTypes.length > 0 && (
                  <>
                    <h3>Accepted providers</h3>
                    <ul>
                      {acceptedTypes.map(t => <li key={t}>{PROVIDER_LABELS[t] || t}</li>)}
                    </ul>
                    {providerRules.state_registration_required && (
                      <p><strong>Note:</strong> Providers must be registered with {stateName}.</p>
                    )}
                    {providerRules.approved_list_url && (
                      <p>
                        <a href={providerRules.approved_list_url} target="_blank" rel="noopener noreferrer">
                          View official approved provider list
                        </a>
                      </p>
                    )}
                  </>
                )}

                {/* Certificate */}
                <h3>Certificate requirements</h3>
                {stateIssuedForm
                  ? <p>You must use the official {stateName} Certificate of Completion form.</p>
                  : <p>Your counselor may issue their own certificate. It must include both partners' names, completion date, provider name and credentials, and hours completed.</p>
                }
                {certValidDays != null && (
                  <p><strong>Certificate validity:</strong> {certValidDays} days from date of completion</p>
                )}
                {certValidDays == null && (
                  <p><strong>Certificate validity:</strong> No stated expiration — complete counseling close to your wedding date</p>
                )}
                {officialFormUrl && (
                  <a href={officialFormUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ display: 'inline-block', marginTop: 'var(--space-2)' }}>
                    Download {stateName} Certificate Form
                  </a>
                )}

                {/* Submission */}
                {sectionReady(dbRecord, 'submission_process') && (
                  <>
                    <h3>Where to submit</h3>
                    <p><strong>Where:</strong> {submission.where}</p>
                    {submission.how && <p><strong>How:</strong> {submission.how}</p>}
                    {submission.deadline_window && <p><strong>When:</strong> {submission.deadline_window}</p>}
                    {submission.online_submission_allowed === false && (
                      <p><em>Online submission is not accepted — you must appear in person.</em></p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── Static requirements fallback ─────────────────────────── */}
            {!dbRecord && staticConfig?.requirements && (
              <div className="content-section">
                <h2>Requirements</h2>
                <ul>
                  {staticConfig.requirements.map((req, i) => <li key={i}>{req}</li>)}
                </ul>
                {staticConfig.notes && <p>{staticConfig.notes}</p>}
              </div>
            )}

            {/* ── Step-by-step guide (from static config until extractor fills it) ─ */}
            {staticConfig?.steps && (
              <div className="content-section">
                <h2>Step-by-Step Guide</h2>
                <ol>
                  {staticConfig.steps.map((step, i) => (
                    <li key={i} style={{ marginBottom: 'var(--space-3)' }}>{step}</li>
                  ))}
                </ol>
              </div>
            )}

            {/* ── Static certificate download (if DB didn't render it) ─── */}
            {!dbRecord && officialFormUrl && (
              <div style={{ marginTop: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
                <a href={officialFormUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                  Download {stateName} Certificate Form
                </a>
              </div>
            )}

            {/* ── Local counselors ─────────────────────────────────────── */}
            <div className="content-section">
              <h2>Certified Premarital Counselors in {stateName}</h2>
              {loadingProviders ? (
                <p>Loading providers...</p>
              ) : providers.length > 0 ? (
                <>
                  <p>
                    These professionals in {stateName} can provide premarital counseling that
                    qualifies for the marriage license discount.
                  </p>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: 'var(--space-4)',
                    marginTop: 'var(--space-4)',
                    marginBottom: 'var(--space-6)',
                  }}>
                    {providers.map(profile => <ProfileCard key={profile.id} profile={profile} />)}
                  </div>
                  <Link to={`/premarital-counseling/${state}`} className="btn btn-outline">
                    View All {stateName} Counselors
                  </Link>
                </>
              ) : (
                <p>
                  We are still expanding coverage in {stateName}.{' '}
                  <Link to={`/premarital-counseling/${state}`}>Browse all {stateName} counselors</Link> or{' '}
                  <Link to="/premarital-counseling/online">find an online counselor</Link>.
                </p>
              )}
            </div>

            {/* ── FAQ ─────────────────────────────────────────────────── */}
            <div style={{ marginTop: 'var(--space-12)' }}>
              <FAQ
                faqs={faqs}
                title={`${stateName} Marriage License Discount — FAQ`}
                description={`Common questions about the ${stateName} marriage license discount for premarital counseling`}
                showSearch={false}
                showAside={false}
              />
            </div>

            {/* ── Citations block (DB-driven, required for verified pages) */}
            {!dbLoading && (sources.length > 0 || statuteCitation) && (
              <CitationsBlock
                sources={sources}
                statuteCitation={statuteCitation}
                lastVerifiedAt={dbRecord?.last_verified_at}
                verificationStatus={dbRecord?.verification_status}
              />
            )}

            {/* ── Related links ─────────────────────────────────────────── */}
            <div style={{ marginTop: 'var(--space-8)' }}>
              <h3>Related Pages</h3>
              <ul>
                <li><Link to={`/premarital-counseling/${state}`}>Premarital Counseling in {stateName}</Link></li>
                <li><Link to="/premarital-counseling/marriage-license-discount">All States with Marriage License Discounts</Link></li>
                <li><Link to="/premarital-counseling/affordable">Affordable Premarital Counseling</Link></li>
                <li><Link to="/premarital-counseling/online">Online Premarital Counseling</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default MarriageLicenseStatePage
