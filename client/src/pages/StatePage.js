import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import Breadcrumbs, { generateBreadcrumbs } from '../components/common/Breadcrumbs';
import SEOHelmet from '../components/analytics/SEOHelmet';
import { trackLocationPageView } from '../components/analytics/GoogleAnalytics';
import { STATE_CONFIG } from '../data/locationConfig';
import { SPECIALTY_CONFIG, STATE_DISCOUNT_CONFIG } from '../data/specialtyConfig';
import ProfileCard from '../components/profiles/ProfileCard';
import SpecialtiesList from '../components/common/SpecialtiesList';
import LocationInsights from '../components/common/LocationInsights';
import CityDataSummary from '../components/city/CityDataSummary';
import { enrichPremaritalSignals, computeCityStats } from '../lib/profileAnalytics';

import ConciergeLeadForm from '../components/leads/ConciergeLeadForm';
import FAQ from '../components/common/FAQ';
import { profileOperations } from '../lib/supabaseClient';
import CoupleEmailCapture from '../components/leads/CoupleEmailCapture';
import StateMarriageLawSection from '../components/state/StateMarriageLawSection';
import { getStateCostRange, COUNSELING_STATS, getStateLicenseDiscount } from '../data/counselingMarketData';
import RelatedBlogPosts from '../components/state/RelatedBlogPosts';
import '../assets/css/state-page.css';

const StatePage = () => {
  const { state } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showGetMatchedForm, setShowGetMatchedForm] = useState(false)
  const [stateData, setStateData] = useState(null)

  const stateConfig = STATE_CONFIG[state]

  useEffect(() => {
    if (stateConfig) {
      setLoading(true)
      loadStateData().finally(() => setLoading(false))
    } else {
      setError('State not found')
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, stateConfig])

  // Track page view
  useEffect(() => {
    if (stateConfig) {
      trackLocationPageView(stateConfig.name)
    }
  }, [stateConfig])

  const loadStateData = async () => {
    try {
      // Get all profiles for this state
      const { data: profiles, error } = await profileOperations.getProfiles({
        state: stateConfig.abbr
      })

      if (error) {
        console.error('Error loading state profiles:', error)
        setStateData({
          stateSlug: state,
          cities: [],
          totalProfiles: 0,
          featuredProfiles: []
        })
        return
      }

      // Count profiles by city
      // For profiles from additional locations, use their additional location city
      const cityCounts = {}
      profiles?.forEach(profile => {
        const city = profile._isAdditionalLocation && profile._additionalLocationCity
          ? profile._additionalLocationCity
          : profile.city
        if (city) {
          const cityNormalized = city.toLowerCase()
          cityCounts[cityNormalized] = (cityCounts[cityNormalized] || 0) + 1
        }
      })

      // Map to major cities
      const cities = stateConfig.major_cities.map(cityName => {
        const citySlug = cityName.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '')
        const cityNameNormalized = cityName.toLowerCase()
        return {
          name: cityName,
          slug: citySlug,
          count: cityCounts[cityNameNormalized] || 0
        }
      })

      // Get featured profiles (top 6 for now)
      const featuredProfiles = profiles ? profiles.slice(0, 6) : []

      setStateData({
        stateSlug: state,
        cities,
        totalProfiles: profiles?.length || 0,
        featuredProfiles,
        allProfiles: profiles || []
      })
    } catch (error) {
      console.error('Error loading state data:', error)
      setStateData({
        stateSlug: state,
        cities: [],
        totalProfiles: 0,
        featuredProfiles: []
      })
    }
  }


  const stateStats = useMemo(() => {
    const allProfiles = stateData?.allProfiles || []
    if (allProfiles.length === 0) return null
    const enriched = allProfiles.map((p) => enrichPremaritalSignals(p))
    return computeCityStats(enriched)
  }, [stateData?.allProfiles])

  if (!stateConfig) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">State Not Found</h1>
        <p className="text-gray-600">The state you're looking for doesn't exist.</p>
        <Link to="/premarital-counseling" className="btn btn-outline" style={{ marginTop: 'var(--space-4)' }}>
          Browse all states
        </Link>
      </div>
    )
  }

  // Generate breadcrumbs
  const breadcrumbItems = generateBreadcrumbs.statePage(stateConfig.name)

  // State-specific FAQ data for rich results (uses real regional cost data)
  const stateCost = getStateCostRange(state)
  const stateDiscount = getStateLicenseDiscount(state)
  const discountSentence = stateDiscount
    ? ` ${stateConfig.name} offers a ${stateDiscount.discount} marriage license discount for couples who complete at least ${stateDiscount.courseHours} hours of premarital education.`
    : ''
  const stateFAQs = stateConfig ? [
    {
      question: `How much does premarital counseling cost in ${stateConfig.name}?`,
      answer: `Licensed therapists in ${stateConfig.name} typically charge ${stateCost.label} per session for premarital counseling. Most couples complete ${COUNSELING_STATS.typicalSessions} sessions, putting the total cost at roughly $${stateCost.min * 5}–$${stateCost.max * 8}. Church-affiliated programs range from ${COUNSELING_STATS.churchCost} per session and may be free for members. Package deals averaging ${COUNSELING_STATS.packageDeal} for a full program are common.${discountSentence}`
    },
    {
      question: `How many sessions do engaged couples need in ${stateConfig.name}?`,
      answer: `The median time couples spend in premarital counseling is ${COUNSELING_STATS.medianHours} hours — usually ${COUNSELING_STATS.typicalSessions} sessions over 2–3 months. Programs like PREPARE/ENRICH (which has a separate $${COUNSELING_STATS.prepareEnrichCost} assessment fee) and the Gottman Method follow structured timelines. Clergy-led programs in ${stateConfig.name} may require 4–6 sessions.`
    },
    {
      question: `Does premarital counseling actually work?`,
      answer: `Yes. A meta-analysis of 20 studies published in the Journal of Family Psychology found that couples who completed premarital counseling had a ${COUNSELING_STATS.divorceReduction} lower chance of divorce. Currently, ${COUNSELING_STATS.participationRate} ${COUNSELING_STATS.participationRateContext}, and ${COUNSELING_STATS.marriageImportance} of Americans rate a happy marriage as one of the most important things in life.`
    },
    {
      question: `Are there Christian and faith-based premarital counselors in ${stateConfig.name}?`,
      answer: `Yes, ${stateConfig.name} has Christian premarital counselors, Catholic Pre-Cana programs, and faith-based marriage preparation options. Many licensed therapists (LMFT, LPC) can integrate faith values into sessions, and local churches often offer clergy-led premarital programs at reduced cost (${COUNSELING_STATS.churchCost} per session or free for members).`
    },
    {
      question: `Can we do premarital counseling online in ${stateConfig.name}?`,
      answer: `Yes, many ${stateConfig.name} premarital counselors offer online sessions via telehealth. This is ideal for busy engaged couples, long-distance relationships, or if one partner travels. Research shows online premarital counseling is as effective as in-person — and it often costs less because therapists save on office overhead.`
    }
  ] : []

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />

  const activeCities = (stateData?.cities || [])
    .filter((cityItem) => cityItem.count > 0)
    .sort((a, b) => b.count - a.count)
  const hasActiveCities = activeCities.length > 0
  const hasStateData = stateData !== null
  const hasStateProfiles = (stateData?.totalProfiles || 0) > 0

  // Noindex states without active counselor inventory
  const shouldNoindex = hasStateData && !hasStateProfiles

  // Generate ItemList structured data for cities
  const citiesItemList = hasActiveCities ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Cities in ${stateConfig.name}`,
    "description": `Find premarital counselors in ${stateConfig.name} cities`,
    "numberOfItems": activeCities.length,
    "itemListElement": activeCities.map((cityItem, index) => {
      return {
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "WebPage",
          "name": `${cityItem.name}, ${stateConfig.abbr}`,
          "url": `https://www.weddingcounselors.com/premarital-counseling/${state}/${cityItem.slug}`,
          "description": `Find premarital counselors in ${cityItem.name}, ${stateConfig.name}`
        }
      }
    })
  } : null

  return (
    <>
      <SEOHelmet
        title={`Premarital Counseling in ${stateConfig.name} — ${stateData?.totalProfiles || 'Top'} Counselors (${new Date().getFullYear()})`}
        description={`Find premarital counseling in ${stateConfig.name}. Compare ${stateData?.totalProfiles || ''} counselors across ${activeCities.length || stateConfig.major_cities.length} cities — licensed therapists, faith-based counselors & coaches with pricing. Browse by city and contact a counselor today.`}
        url={`/premarital-counseling/${state}`}
        keywords={`marriage counseling ${stateConfig.name}, premarital counseling ${stateConfig.name}, marriage therapist ${stateConfig.name}, premarital counseling near me ${stateConfig.name}, pre marriage counseling ${stateConfig.name}, premarital therapy ${stateConfig.name}, christian premarital counseling ${stateConfig.name}, christian marriage counseling ${stateConfig.name}`}
        breadcrumbs={breadcrumbItems}
        structuredData={citiesItemList}
        faqs={stateFAQs}
        canonicalUrl={`https://www.weddingcounselors.com/premarital-counseling/${state}`}
        noindex={shouldNoindex}
      />
      <div className="state-page">
        {/* SEO Optimized Header */}
        <div className="state-page-header">
          <div className="state-container">
            <Breadcrumbs items={breadcrumbItems} variant="on-hero" />
            <div className="state-header-content">

              <h1 className="state-title">
                Premarital Counseling in {stateConfig.name}
              </h1>

              <p className="state-subtitle">
                Find premarital counseling in {stateConfig.name}. Compare licensed therapists (LMFT, LPC, LCSW), Christian and faith-based counselors, clergy, and online options for engaged couples across {activeCities.length || stateConfig.major_cities.length} cities. See methods (Gottman, PREPARE-ENRICH), pricing, and availability.
              </p>

              <p style={{
                fontSize: '0.95rem',
                color: 'var(--slate)',
                maxWidth: '800px',
                margin: 'var(--space-4) auto 0'
              }}>
                Many people search for "marriage counseling {stateConfig.name.toLowerCase()}" when planning a wedding.
                We specialize in <strong>premarital and marriage preparation</strong> — connecting engaged couples with
                licensed therapists and clergy who focus on building a strong foundation, not just crisis intervention.
              </p>

              {/* Dual CTAs */}
              <div className="state-cta-section">
                <div className="cta-buttons">
                  <button
                    onClick={() => setShowGetMatchedForm(true)}
                    className="btn btn-primary btn-large"
                  >
                    Get Matched with a Counselor
                  </button>
                  <Link
                    to="/professional/signup"
                    className="btn btn-secondary btn-large"
                    rel="nofollow"
                  >
                    <i className="fa fa-plus-circle mr-2"></i>
                    List Your Practice
                  </Link>
                </div>
              </div>

              {/* Marriage License Discount Section */}
              {stateConfig.counseling_benefits && (
                <div className="state-benefits-box">
                  <div className="benefit-layout">
                    <div className="benefit-icon">
                      <i className="fa fa-certificate"></i>
                    </div>
                    <div className="benefit-content">
                      <h3>{stateConfig.counseling_benefits.title}</h3>
                      <p>{stateConfig.counseling_benefits.description}</p>

                      {stateConfig.counseling_benefits.requirements && (
                        <ul className="benefit-requirements">
                          {stateConfig.counseling_benefits.requirements.map((req, i) => (
                            <li key={i}>
                              <i className="fa fa-check-circle"></i>
                              {req}
                            </li>
                          ))}
                        </ul>
                      )}

                      <a
                        href={stateConfig.counseling_benefits.certificate_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-download"
                      >
                        <i className="fa fa-download"></i> Download State Certificate Form
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>



        {/* Marriage License Discount Callout */}
        {STATE_DISCOUNT_CONFIG[state] && (
          <div className="discount-callout-banner">
            <div className="discount-callout-inner">
              <div className="discount-callout-icon">
                <i className="fa fa-piggy-bank"></i>
              </div>
              <div className="discount-callout-body">
                <strong>
                  {stateConfig.name} couples save {STATE_DISCOUNT_CONFIG[state].discount} on their marriage license
                  {STATE_DISCOUNT_CONFIG[state].waitingPeriod && STATE_DISCOUNT_CONFIG[state].waitingPeriod !== 'No waiting period impact'
                    ? ` — and the waiting period is waived`
                    : ''}
                </strong>
                {' '}by completing a qualifying premarital counseling program. Any of the counselors below can issue your certificate.
              </div>
              <Link
                to={`/premarital-counseling/marriage-license-discount/${state}`}
                className="discount-callout-link"
              >
                See requirements <i className="fa fa-arrow-right"></i>
              </Link>
            </div>
          </div>
        )}

        {/* Featured Professionals Section - Immediate Results */}
        {stateData && stateData.featuredProfiles && stateData.featuredProfiles.length > 0 && (
          <div className="state-featured-section">
            <div className="state-container">
              {/* Money SERP Insights Box */}
              <LocationInsights stateSlug={state} profiles={stateData?.featuredProfiles || []} />

              <CityDataSummary
                stats={stateStats}
                cityName={stateConfig.name}
                stateName={stateConfig.name}
                stateSlug={state}
              />

              <div className="mb-6">
                <h2 className="state-results-title">
                  Featured Premarital Counselors in {stateConfig.name}
                </h2>
                <p className="state-results-subtitle">
                  Connect with top-rated premarital counselors and marriage coaches serving the entire state of {stateConfig.name}, including online/virtual options.
                </p>
              </div>

              <div className="featured-grid">
                {stateData.featuredProfiles.map(profile => (
                  <ProfileCard key={profile.id} profile={profile} />
                ))}
              </div>

              <div className="featured-footer">
                <p>
                  Not finding what you need? <a href={hasActiveCities ? "#cities-grid" : "#"} onClick={(e) => {
                    e.preventDefault();
                    const el = hasActiveCities ? document.getElementById('cities-grid') : null;
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                    if (!hasActiveCities) setShowGetMatchedForm(true)
                  }}>{hasActiveCities ? 'Browse by city below' : 'Get matched with a counselor'}</a>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Browse by Specialty Section - Interlinking Strategy */}
        <div className="state-container">
          <SpecialtiesList stateSlug={state} />
        </div>

        {/* Cities Grid Section */}
        <div id="cities-grid" className="state-container state-results">
          <div className="mb-6">
            <h2 className="state-results-title">
              {hasActiveCities ? 'Premarital Counseling & Marriage Prep by City' : `Counselor availability in ${stateConfig.name}`}
            </h2>
            <p className="state-results-subtitle">
              {hasActiveCities
                ? `Select a city to find licensed therapists, Christian counselors, and clergy helping engaged couples prepare for marriage across ${stateConfig.name}.`
                : `We are still expanding counselor coverage in ${stateConfig.name}. Share your timeline and we will help match you with the right professional.`}
            </p>
          </div>

          {hasActiveCities ? (
            <div className="cities-grid">
              {activeCities.map((cityItem) => (
                <Link
                  key={cityItem.slug}
                  to={`/premarital-counseling/${state}/${cityItem.slug}`}
                  className="city-card-large"
                >
                  <h3>Premarital Counseling & Marriage Prep in {cityItem.name}</h3>
                  <p>{cityItem.count} counselor{cityItem.count === 1 ? '' : 's'} currently listed in {cityItem.name}, {stateConfig.abbr}</p>
                  <span className="city-arrow">→</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="city-empty">
              <div className="city-empty__card">
                <p className="section-eyebrow">Growing coverage</p>
                <h2>No listed counselors in {stateConfig.name} yet</h2>
                <p className="city-empty__lead">
                  You can still submit your details and we will route your request to available counselors nearby or online.
                </p>
                <div className="city-empty__actions">
                  <button
                    onClick={() => setShowGetMatchedForm(true)}
                    className="city-empty__button city-empty__button--primary"
                  >
                    Get Matched
                  </button>
                  <Link to="/premarital-counseling" className="city-empty__button city-empty__button--ghost">
                    Browse Other States
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FAQ Section for rich results */}
        <div className="state-container" style={{ marginTop: 'var(--space-12)', marginBottom: 'var(--space-12)' }}>
          <FAQ
            faqs={stateFAQs}
            title={`Premarital Counseling in ${stateConfig.name} — Frequently Asked Questions`}
            description={`Common questions about premarital counseling in ${stateConfig.name} for engaged couples`}
            showSearch={false}
            showAside={false}
          />
        </div>

        {/* Research-Backed Topical Authority Section */}
        <div className="state-container" style={{ marginBottom: 'var(--space-12)' }}>
          <div style={{
            padding: 'var(--space-8)',
            background: 'var(--white)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid rgba(14, 94, 94, 0.1)',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.4rem',
              color: 'var(--primary-dark)',
              marginBottom: 'var(--space-4)',
            }}>
              Why Premarital Counseling Matters in {stateConfig.name}
            </h2>
            <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.95rem' }}>
              <p style={{ marginBottom: 'var(--space-4)' }}>
                Research consistently supports the value of premarital counseling. A meta-analysis of 20 studies published in the <em>Journal of Family Psychology</em> found that couples who completed premarital counseling had a <strong>{COUNSELING_STATS.divorceReduction} lower chance of divorce</strong> compared to those who did not.
              </p>
              <p style={{ marginBottom: 'var(--space-4)' }}>
                Currently, {COUNSELING_STATS.participationRate} {COUNSELING_STATS.participationRateContext}. The median program lasts {COUNSELING_STATS.medianHours} hours — typically {COUNSELING_STATS.typicalSessions} sessions over 2–3 months.
                {stateDiscount ? ` ${stateConfig.name} incentivizes participation with a ${stateDiscount.discount} marriage license discount for couples who complete at least ${stateDiscount.courseHours} hours of premarital education.` : ''}
              </p>
              <p>
                In {stateConfig.name}, licensed therapists typically charge {stateCost.label} per session, while church-affiliated programs range from {COUNSELING_STATS.churchCost}. {COUNSELING_STATS.weddingCostContext} — a small investment that research shows pays dividends for decades.
              </p>
            </div>
          </div>
        </div>

        {/* State Marriage Law Section */}
        <StateMarriageLawSection stateSlug={state} stateName={stateConfig.name} />

        {/* Related Blog Posts */}
        <RelatedBlogPosts stateSlug={state} stateName={stateConfig.name} />

        <div className="state-container" style={{ marginBottom: 'var(--space-8)' }}>
          <CoupleEmailCapture sourcePage={`state/${state}`} defaultState={stateConfig?.abbr || ''} />
        </div>

        {/* Specialty Cross-Links */}
        <div className="state-container" style={{ marginBottom: 'var(--space-12)' }}>
          <div style={{
            padding: 'var(--space-8)',
            background: 'var(--gray-50)',
            borderRadius: 'var(--radius-lg)'
          }}>
            <h3 style={{ marginBottom: 'var(--space-4)' }}>
              Browse by Specialty in {stateConfig.name}
            </h3>
            <p style={{ marginBottom: 'var(--space-6)', color: 'var(--text-secondary)' }}>
              Find premarital counselors in {stateConfig.name} by method or focus area
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 'var(--space-3)'
            }}>
              {Object.entries(SPECIALTY_CONFIG).slice(0, 8).map(([slug, config]) => (
                <Link
                  key={slug}
                  to={`/premarital-counseling/${slug}/${state}`}
                  style={{
                    padding: 'var(--space-3)',
                    background: 'white',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #e5e7eb',
                    textDecoration: 'none',
                    color: 'var(--color-primary)',
                    fontSize: '0.875rem',
                    textAlign: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  {config.name} in {stateConfig.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Sticky mobile CTA */}
      {hasStateProfiles && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 90,
            background: '#fff',
            borderTop: '1px solid #e5e7eb',
            padding: '10px 16px',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            boxShadow: '0 -2px 8px rgba(0,0,0,0.08)'
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', lineHeight: 1.2 }}>
              {stateData.totalProfiles} counselors in {stateConfig.name}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              Free to contact — no fees
            </div>
          </div>
          <button
            onClick={() => setShowGetMatchedForm(true)}
            className="btn btn-primary"
            style={{ whiteSpace: 'nowrap', padding: '8px 16px', fontSize: '0.85rem' }}
          >
            Get Matched Free
          </button>
        </div>
      )}

      {/* Get Matched Modal */}
      <ConciergeLeadForm
        isOpen={showGetMatchedForm}
        onClose={() => setShowGetMatchedForm(false)}
        defaultLocation={stateConfig.name}
      />
    </>
  )
}

export default StatePage
