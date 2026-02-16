import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import SEOHelmet from '../components/analytics/SEOHelmet'
import Breadcrumbs from '../components/common/Breadcrumbs'
import FAQ from '../components/common/FAQ'
import ProfileCard from '../components/profiles/ProfileCard'
import { STATE_DISCOUNT_CONFIG } from '../data/specialtyConfig'
import { STATE_CONFIG } from '../data/locationConfig'
import { profileOperations } from '../lib/supabaseClient'
import '../assets/css/discount-page.css'

const MarriageLicenseStatePage = () => {
  const { state } = useParams()
  const discountConfig = STATE_DISCOUNT_CONFIG[state]
  const stateConfig = STATE_CONFIG[state]
  const [providers, setProviders] = useState([])
  const [loadingProviders, setLoadingProviders] = useState(true)

  useEffect(() => {
    if (stateConfig) {
      loadProviders()
    }
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

  if (!discountConfig || !stateConfig) {
    return (
      <div className="container" style={{ padding: 'var(--space-20) 0', textAlign: 'center' }}>
        <h2>State Not Found</h2>
        <p className="text-secondary mb-8">
          This state does not offer a marriage license discount for premarital counseling, or the page does not exist.
        </p>
        <Link to="/premarital-counseling/marriage-license-discount" className="btn btn-primary">
          View All State Discounts
        </Link>
      </div>
    )
  }

  const stateName = discountConfig.name || stateConfig.name
  const stAbbr = discountConfig.abbr || stateConfig.abbr

  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'Premarital Counseling', url: '/premarital-counseling' },
    { name: 'Marriage License Discounts', url: '/premarital-counseling/marriage-license-discount' },
    { name: stateName, url: null }
  ]

  // Combine state-specific FAQs with general ones
  const faqs = [
    ...(discountConfig.faqs || []),
    {
      question: `How much does a marriage license cost in ${stateName} with the discount?`,
      answer: `With the premarital counseling discount, the ${stateName} marriage license costs ${discountConfig.discountedFee} instead of the standard ${discountConfig.originalFee}. That is a savings of ${discountConfig.discount}.`
    },
    {
      question: `Who can provide qualifying premarital counseling in ${stateName}?`,
      answer: `${stateName} accepts premarital counseling from licensed professionals (LMFT, LPC, LCSW, psychologists) and ordained clergy. Check the specific state requirements for details.`
    },
    {
      question: `Can we do premarital counseling online and still get the ${stateName} discount?`,
      answer: `Requirements vary. Contact your county clerk in ${stateName} to confirm whether online premarital counseling certificates are accepted for the marriage license discount.`
    }
  ]

  // HowTo structured data
  const howToStructuredData = discountConfig.steps ? {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    'name': `How to Get the ${stateName} Marriage License Discount`,
    'description': `Step-by-step guide to saving ${discountConfig.discount} on your ${stateName} marriage license through premarital counseling.`,
    'totalTime': 'P1D',
    'step': discountConfig.steps.map((step, index) => ({
      '@type': 'HowToStep',
      'position': index + 1,
      'text': step
    }))
  } : null

  return (
    <>
      <SEOHelmet
        title={`${stateName} Marriage License Discount — Save ${discountConfig.discount} with Premarital Counseling`}
        description={`Save ${discountConfig.discount} on your ${stateName} marriage license by completing premarital counseling. ${discountConfig.waitingPeriod}. Step-by-step guide and certified providers in ${stAbbr}.`}
        url={`/premarital-counseling/marriage-license-discount/${state}`}
        canonicalUrl={`https://www.weddingcounselors.com/premarital-counseling/marriage-license-discount/${state}`}
        breadcrumbs={breadcrumbItems}
        structuredData={howToStructuredData}
        faqs={faqs}
      />

      <div className="page-container discount-page">
        <div className="container">
          <Breadcrumbs items={breadcrumbItems} />

          <div className="container-narrow">
            <div className="page-header">
              <h1>{stateName} Marriage License Discount</h1>
              <p className="lead">
                Save {discountConfig.discount} on your marriage license by completing premarital counseling in {stateName}
              </p>
            </div>

            <div className="content-section">
              {/* Discount Summary */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 'var(--space-4)',
                marginBottom: 'var(--space-8)',
                padding: 'var(--space-6)',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--gray-200)'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>Standard Fee</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: '700', textDecoration: 'line-through', color: 'var(--text-secondary)' }}>
                    {discountConfig.originalFee}
                  </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>You Save</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-primary)' }}>
                    {discountConfig.discount}
                  </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>Discounted Fee</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {discountConfig.discountedFee}
                  </p>
                </div>
                {discountConfig.waitingPeriod !== 'No waiting period impact' && (
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>Bonus</p>
                    <p style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--color-primary)' }}>
                      {discountConfig.waitingPeriod}
                    </p>
                  </div>
                )}
              </div>

              <p>{discountConfig.notes}</p>

              {/* Requirements */}
              <h2>Requirements</h2>
              <ul>
                {discountConfig.requirements.map((req, i) => (
                  <li key={i}>{req}</li>
                ))}
              </ul>

              {/* Step-by-Step */}
              {discountConfig.steps && (
                <>
                  <h2>Step-by-Step Guide</h2>
                  <ol>
                    {discountConfig.steps.map((step, i) => (
                      <li key={i} style={{ marginBottom: 'var(--space-3)' }}>{step}</li>
                    ))}
                  </ol>
                </>
              )}

              {/* Certificate download */}
              {discountConfig.certificateUrl && (
                <div style={{ marginTop: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
                  <a
                    href={discountConfig.certificateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                  >
                    Download {stateName} Certificate Form
                  </a>
                </div>
              )}

              {/* Providers in this state */}
              <h2>Certified Premarital Counselors in {stateName}</h2>
              {loadingProviders ? (
                <p>Loading providers...</p>
              ) : providers.length > 0 ? (
                <>
                  <p>
                    These professionals in {stateName} can provide premarital counseling that qualifies for the marriage license discount.
                  </p>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: 'var(--space-4)',
                    marginTop: 'var(--space-4)',
                    marginBottom: 'var(--space-6)'
                  }}>
                    {providers.map((profile) => (
                      <ProfileCard key={profile.id} profile={profile} />
                    ))}
                  </div>
                  <Link
                    to={`/premarital-counseling/${state}`}
                    className="btn btn-outline"
                  >
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

              {/* FAQ */}
              <div style={{ marginTop: 'var(--space-12)' }}>
                <FAQ
                  faqs={faqs}
                  title={`${stateName} Marriage License Discount — FAQ`}
                  description={`Common questions about the ${stateName} marriage license discount for premarital counseling`}
                  showSearch={false}
                  showAside={false}
                />
              </div>

              {/* Cross-links */}
              <div style={{ marginTop: 'var(--space-8)' }}>
                <h3>Related Pages</h3>
                <ul>
                  <li>
                    <Link to={`/premarital-counseling/${state}`}>
                      Premarital Counseling in {stateName}
                    </Link>
                  </li>
                  <li>
                    <Link to="/premarital-counseling/marriage-license-discount">
                      All States with Marriage License Discounts
                    </Link>
                  </li>
                  <li>
                    <Link to="/premarital-counseling/affordable">
                      Affordable Premarital Counseling
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default MarriageLicenseStatePage
