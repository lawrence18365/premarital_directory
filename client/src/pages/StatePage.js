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

import LeadContactForm from '../components/leads/LeadContactForm';
import FAQ from '../components/common/FAQ';
import { profileOperations } from '../lib/supabaseClient';
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
      const cityCounts = {}
      profiles?.forEach(profile => {
        if (profile.city) {
          const cityNormalized = profile.city.toLowerCase()
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

  // State-specific FAQ data for rich results
  const stateFAQs = stateConfig ? [
    {
      question: `How much does premarital counseling cost in ${stateConfig.name}?`,
      answer: `Premarital counseling in ${stateConfig.name} typically costs between $100-$200 per session. Many counselors offer package deals for 5-8 sessions. Faith-based options like Pre-Cana may be free or low-cost through churches. Some insurance plans may cover premarital therapy.`
    },
    {
      question: `How many sessions do engaged couples need in ${stateConfig.name}?`,
      answer: `Most engaged couples in ${stateConfig.name} complete 5-8 premarital counseling sessions over 2-3 months. Programs like PREPARE-ENRICH and Gottman Method have structured timelines. Clergy-led programs may require 4-6 sessions before your wedding.`
    },
    {
      question: `Are there Christian and faith-based premarital counselors in ${stateConfig.name}?`,
      answer: `Yes, ${stateConfig.name} has many Christian premarital counselors, Catholic Pre-Cana programs, and faith-based marriage preparation options. Many licensed therapists (LMFT, LPC) integrate Christian values, and local churches offer clergy-led premarital programs.`
    },
    {
      question: `Can we do premarital counseling online in ${stateConfig.name}?`,
      answer: `Yes, many ${stateConfig.name} premarital counselors offer online sessions via telehealth. This is ideal for busy engaged couples with different schedules. Online premarital counseling is just as effective as in-person for marriage preparation.`
    },
    {
      question: `What should engaged couples look for in a premarital counselor in ${stateConfig.name}?`,
      answer: `Look for licensed professionals (LMFT, LPC, LCSW) with premarital counseling experience. Consider their approach (Gottman, PREPARE-ENRICH, faith-based), availability, cost, and whether they accept insurance. Many ${stateConfig.name} counselors offer free consultations.`
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
        title={`Premarital Counseling ${stateConfig.name} — ${stateData?.totalProfiles || 'Top'} Therapists`}
        description={`Find ${stateData?.totalProfiles || 'top'} marriage & premarital counselors in ${stateConfig.name}. Compare licensed therapists (LMFT, LPC), Christian counselors & couples therapy across ${activeCities.length || stateConfig.major_cities.length} cities. Contact directly.`}
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
                    <i className="fa fa-heart mr-2"></i>
                    Find a Premarital Counselor
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

      {/* Get Matched Modal */}
      {showGetMatchedForm && (
        <div className="modal-overlay" onClick={() => setShowGetMatchedForm(false)}>
          <div className="modal-content get-matched-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Find a Premarital Counselor in {stateConfig.name}</h3>
              <button
                onClick={() => setShowGetMatchedForm(false)}
                className="modal-close"
                aria-label="Close"
              >
                <i className="fa fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <p>Preparing for marriage? We'll connect you with qualified premarital counselors in {stateConfig.name}.</p>
              <LeadContactForm
                profileId={null} // Unassigned lead
                professionalName={`Counselors in ${stateConfig.name}`}
                stateName={stateConfig.name}
                isStateMatching={true}
                onSuccess={() => {
                  setShowGetMatchedForm(false)
                  // Could show a success message here
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default StatePage
