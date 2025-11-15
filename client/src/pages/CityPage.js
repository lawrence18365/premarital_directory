import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ProfileList from '../components/profiles/ProfileList';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import Breadcrumbs, { generateBreadcrumbs } from '../components/common/Breadcrumbs';
import SEOHelmet from '../components/analytics/SEOHelmet';
import { trackLocationPageView } from '../components/analytics/GoogleAnalytics';
import { profileOperations } from '../lib/supabaseClient';
import { STATE_CONFIG, CITY_CONFIG, isAnchorCity } from '../data/locationConfig';
import CityContentGenerator from '../lib/cityContentGenerator';
import LocalContent from '../components/common/LocalContent';
import LeadContactForm from '../components/leads/LeadContactForm';
import FAQ from '../components/common/FAQ';
import '../assets/css/state-page.css';

const CityPage = () => {
  const { state, cityOrSlug } = useParams()
  const city = cityOrSlug
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cityContent, setCityContent] = useState(null)
  const [contentLoading, setContentLoading] = useState(true)

  const stateConfig = STATE_CONFIG[state]
  const cityConfig = CITY_CONFIG[state]?.[city]
  
  // Fallback if city not in config
  const cityName = cityConfig?.name || (city ? city.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ') : 'Unknown City')
  
  const stateName = stateConfig?.name || state

  useEffect(() => {
    loadCityProfiles()
    loadCityContent()
    trackLocationPageView(stateName, cityName)
  }, [state, city])

  const loadCityProfiles = async () => {
    try {
      setLoading(true)
      setError(null)

      // Search for profiles in this city and state
      const { data, error } = await profileOperations.getProfiles({
        state: stateConfig?.abbr || state.toUpperCase(),
        city: cityName
      })

      if (error) {
        setError(error.message)
      } else {
        // Sort profiles by tier: Area Spotlight > Local Featured > Community
        const sortedProfiles = (data || []).sort((a, b) => {
          const tierOrder = {
            'area_spotlight': 1,
            'local_featured': 2,
            'community': 3
          }

          const aTier = tierOrder[a.tier] || 999
          const bTier = tierOrder[b.tier] || 999

          if (aTier !== bTier) {
            return aTier - bTier
          }

          // If same tier, sort by created_at (newest first)
          return new Date(b.created_at) - new Date(a.created_at)
        })

        setProfiles(sortedProfiles)
      }
    } catch (err) {
      setError('Failed to load professionals for this city')
    } finally {
      setLoading(false)
    }
  }

  const loadCityContent = async () => {
    setContentLoading(true)
    
    try {
      const contentGenerator = new CityContentGenerator()
      const content = await contentGenerator.getOrGenerateCityContent(
        state, 
        cityName
      )
      
      setCityContent(content)
    } catch (error) {
      console.error('AI content generation failed:', error)
      setCityContent(null)
    }
    
    setContentLoading(false)
  }

  const breadcrumbData = generateBreadcrumbs.cityPage(stateName, cityName, `/premarital-counseling/${state}`)

  const nearbyStates = Object.entries(STATE_CONFIG)
    .filter(([key]) => key !== state)
    .slice(0, 6)

  // Generate ItemList structured data for provider directory (SEO-critical for rankings)
  const structuredData = profiles.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': `Premarital Counselors in ${cityName}, ${stateName}`,
    'description': `Find qualified premarital counselors in ${cityName}, ${stateName}. ${profiles.length} licensed professionals specializing in pre-marriage preparation and relationship counseling for engaged couples.`,
    'numberOfItems': profiles.length,
    'itemListElement': profiles.slice(0, 20).map((profile, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'item': {
        '@type': 'Person',
        'name': profile.full_name,
        'jobTitle': profile.profession || 'Premarital Counselor',
        'address': {
          '@type': 'PostalAddress',
          'addressLocality': profile.city || cityName,
          'addressRegion': profile.state_province || stateConfig?.abbr
        },
        'url': profile.slug ? `https://www.weddingcounselors.com/premarital-counseling/${state}/${city}/${profile.slug}` : undefined
      }
    }))
  } : null

  // City-specific FAQ data for rich results
  const cityFAQs = [
    {
      question: `How much does premarital counseling cost in ${cityName}?`,
      answer: `Premarital counseling in ${cityName}, ${stateName} typically costs between $100-$200 per session. Many counselors offer package deals for 5-8 sessions. Faith-based options like Pre-Cana may be free or low-cost through churches. Some insurance plans may cover premarital therapy.`
    },
    {
      question: `How many premarital counseling sessions do engaged couples need in ${cityName}?`,
      answer: `Most engaged couples in ${cityName} complete 5-8 premarital counseling sessions over 2-3 months before their wedding. Programs like PREPARE-ENRICH and Gottman Method have structured timelines. Clergy-led programs may require 4-6 sessions.`
    },
    {
      question: `Are there Christian and faith-based premarital counselors in ${cityName}?`,
      answer: `Yes, ${cityName} has Christian premarital counselors, Catholic Pre-Cana programs, and faith-based marriage preparation. Many licensed therapists (LMFT, LPC) integrate Christian values. Local churches also offer clergy-led premarital programs for engaged couples.`
    },
    {
      question: `Can engaged couples do premarital counseling online in ${cityName}?`,
      answer: `Yes, many ${cityName} premarital counselors offer online sessions via telehealth. This is ideal for busy engaged couples with different schedules or if one partner travels. Online premarital counseling is just as effective as in-person for marriage preparation.`
    },
    {
      question: `What topics are covered in premarital counseling in ${cityName}?`,
      answer: `Premarital counseling in ${cityName} covers communication skills, conflict resolution, finances, family planning, intimacy expectations, roles and responsibilities, faith and values, and in-law relationships. Counselors help engaged couples prepare for a strong marriage foundation.`
    }
  ]

  // Determine if page should be noindexed (thin content - fewer than 5 profiles now, was 8)
  // Anchor cities are always indexable to build SEO authority regardless of profile count
  const isAnchor = isAnchorCity(state, city)
  const shouldNoindex = !isAnchor && profiles.length < 5

  return (
    <div className="city-page">
      <SEOHelmet
        title={cityContent?.title || `Premarital Counseling & Marriage Prep in ${cityName}, ${stateConfig?.abbr || stateName} – Therapists & Clergy`}
        description={cityContent?.description || `Find premarital counseling and marriage prep in ${cityName}, ${stateName}. Compare ${profiles.length} licensed therapists (LMFT, LPC, LCSW), Christian counselors, clergy, and online options for engaged couples preparing for marriage. See prices, specialties, and availability.`}
        keywords={`premarital counseling ${cityName}, marriage counseling ${cityName}, marriage prep ${cityName}, premarital therapy ${cityName}, pre marriage counseling ${cityName} ${stateName}, christian premarital counseling ${cityName}, pre cana ${cityName}, clergy premarital counseling ${cityName}, marriage counseling ${cityName} ${stateName}`}
        structuredData={structuredData}
        faqs={cityFAQs}
        noindex={shouldNoindex}
      />

      {/* City Header */}
      <section className="state-header city-header">
        <div className="container">
          <Breadcrumbs items={breadcrumbData} variant="on-hero" />
          <div className="state-header-content">
            <h1>Premarital Counseling in {cityName}, {stateName}</h1>
            <p className="lead">
              Find premarital counselors in {cityName}, {stateName}. Compare {profiles.length} licensed therapists (LMFT, LPC, LCSW), Christian counselors, clergy, and online options for engaged couples. See prices, specialties, availability, and insurance — book intro sessions today.
            </p>

            <p style={{
              marginTop: 'var(--space-4)',
              fontSize: '0.95rem',
              color: 'var(--text-secondary)',
              maxWidth: '800px'
            }}>
              Many people search for "marriage counseling {cityName.toLowerCase()}" when they're engaged or newly married.
              This page focuses on <strong>premarital and early-marriage counseling</strong> — therapists and clergy who help couples
              prepare for marriage, not just address crisis situations. Whether you're looking for a licensed therapist (LMFT, LPC)
              or faith-based clergy guidance, you'll find professionals who specialize in marriage preparation.
            </p>


            {/* City Stats */}
            {profiles.length > 0 && (
              <div className="location-stats">
                <div className="stat">
                  <span className="stat-number">{profiles.length}</span>
                  <span className="stat-label">Licensed Professionals</span>
                </div>
                <div className="stat">
                  <span className="stat-number">{profiles.filter(p => p.profession?.includes('Therapist')).length}</span>
                  <span className="stat-label">Licensed Therapists</span>
                </div>
                <div className="stat">
                  <span className="stat-number">{profiles.filter(p => p.profession?.includes('Coach')).length}</span>
                  <span className="stat-label">Certified Coaches</span>
                </div>
              </div>
            )}

            {/* Quick CTA for Engaged Couples */}
            <div className="state-cta-section" style={{ marginTop: 'var(--space-8)' }}>
              <div className="cta-buttons">
                <button
                  onClick={() => document.getElementById('contact-form').scrollIntoView({ behavior: 'smooth' })}
                  className="btn btn-primary btn-large"
                >
                  <i className="fa fa-heart mr-2"></i>
                  Find Your Premarital Counselor
                </button>
                <Link
                  to="/professional/signup"
                  className="btn btn-secondary btn-large"
                >
                  <i className="fa fa-plus-circle mr-2"></i>
                  List Your Practice
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* City Content */}
      <div className="container">
        <div className="state-content">
          {/* Left Column - Profiles */}
          <div className="state-main">
            {loading ? (
              <div className="loading-section">
                <LoadingSpinner />
                <p>Loading professionals in {cityName}...</p>
              </div>
            ) : error ? (
              <ErrorMessage message={error} />
            ) : profiles.length > 0 ? (
              <>
                <div className="results-header">
                  <h2>Premarital Counselors in {cityName} — Therapists & Clergy</h2>
                  <p>Licensed professionals and faith-based counselors specializing in marriage preparation for engaged couples</p>
                </div>

                {/* Top Picks Section - SEO & UX boost */}
                {profiles.length >= 3 && (
                  <div style={{
                    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                    padding: 'var(--space-8)',
                    borderRadius: 'var(--radius-lg)',
                    marginBottom: 'var(--space-8)',
                    border: '2px solid var(--accent)'
                  }}>
                    <h3 style={{ marginBottom: 'var(--space-4)', color: 'var(--text-primary)' }}>
                      ⭐ Top Premarital Counselors in {cityName}
                    </h3>
                    <p style={{ marginBottom: 'var(--space-6)', color: 'var(--text-secondary)' }}>
                      Highly qualified professionals helping engaged couples in {cityName} prepare for marriage
                    </p>
                    <div style={{
                      display: 'grid',
                      gap: 'var(--space-4)'
                    }}>
                      {profiles.slice(0, 5).map((profile, idx) => (
                        <div key={profile.id} style={{
                          background: 'white',
                          padding: 'var(--space-4)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid #e5e7eb'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div>
                              <h4 style={{ margin: 0, marginBottom: 'var(--space-2)' }}>
                                <Link to={`/premarital-counseling/${state}/${city}/${profile.slug}`} style={{ color: 'var(--color-primary)' }}>
                                  {profile.full_name}
                                </Link>
                              </h4>
                              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                {profile.profession}
                                {profile.specialties && profile.specialties.length > 0 && (
                                  <> • {profile.specialties.slice(0, 2).join(', ')}</>
                                )}
                              </p>
                            </div>
                            <span style={{
                              fontSize: '0.75rem',
                              padding: '4px 8px',
                              background: 'var(--color-primary)',
                              color: 'white',
                              borderRadius: '4px',
                              whiteSpace: 'nowrap'
                            }}>
                              #{idx + 1} in {cityName}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Separate Therapists and Clergy Sections */}
                {(() => {
                  const therapists = profiles.filter(p =>
                    p.profession?.toLowerCase().includes('therapist') ||
                    p.profession?.toLowerCase().includes('lmft') ||
                    p.profession?.toLowerCase().includes('lpc') ||
                    p.profession?.toLowerCase().includes('lcsw') ||
                    p.profession?.toLowerCase().includes('counselor') && !p.profession?.toLowerCase().includes('clergy')
                  )
                  const clergy = profiles.filter(p =>
                    p.profession?.toLowerCase().includes('clergy') ||
                    p.profession?.toLowerCase().includes('pastor') ||
                    p.profession?.toLowerCase().includes('priest') ||
                    p.profession?.toLowerCase().includes('minister') ||
                    p.profession?.toLowerCase().includes('reverend')
                  )
                  const others = profiles.filter(p => !therapists.includes(p) && !clergy.includes(p))

                  return (
                    <>
                      {therapists.length > 0 && (
                        <div style={{ marginBottom: 'var(--space-12)' }}>
                          <h3 style={{
                            fontSize: '1.5rem',
                            marginBottom: 'var(--space-4)',
                            color: 'var(--text-primary)',
                            borderBottom: '2px solid var(--color-primary)',
                            paddingBottom: 'var(--space-2)'
                          }}>
                            Licensed Therapists & Counselors (LMFT, LPC, LCSW)
                          </h3>
                          <p style={{ marginBottom: 'var(--space-6)', color: 'var(--text-secondary)' }}>
                            Licensed mental health professionals offering premarital and early marriage counseling
                          </p>
                          <ProfileList
                            profiles={therapists}
                            loading={false}
                            error={null}
                            showLocation={false}
                          />
                        </div>
                      )}

                      {clergy.length > 0 && (
                        <div style={{ marginBottom: 'var(--space-12)' }}>
                          <h3 style={{
                            fontSize: '1.5rem',
                            marginBottom: 'var(--space-4)',
                            color: 'var(--text-primary)',
                            borderBottom: '2px solid var(--color-primary)',
                            paddingBottom: 'var(--space-2)'
                          }}>
                            Clergy & Faith-Based Marriage Preparation
                          </h3>
                          <p style={{ marginBottom: 'var(--space-6)', color: 'var(--text-secondary)' }}>
                            Religious leaders and clergy offering Christian, Catholic, and faith-based premarital counseling
                          </p>
                          <ProfileList
                            profiles={clergy}
                            loading={false}
                            error={null}
                            showLocation={false}
                          />
                        </div>
                      )}

                      {others.length > 0 && (
                        <div style={{ marginBottom: 'var(--space-12)' }}>
                          <h3 style={{
                            fontSize: '1.5rem',
                            marginBottom: 'var(--space-4)',
                            color: 'var(--text-primary)',
                            borderBottom: '2px solid var(--color-primary)',
                            paddingBottom: 'var(--space-2)'
                          }}>
                            Other Marriage Preparation Professionals
                          </h3>
                          <ProfileList
                            profiles={others}
                            loading={false}
                            error={null}
                            showLocation={false}
                          />
                        </div>
                      )}
                    </>
                  )
                })()}

                {/* Nearby Cities - Critical for internal linking & SEO */}
                {stateConfig?.major_cities && stateConfig.major_cities.length > 1 && (
                  <div style={{
                    marginTop: 'var(--space-12)',
                    padding: 'var(--space-8)',
                    background: 'var(--gray-50)',
                    borderRadius: 'var(--radius-lg)'
                  }}>
                    <h3 style={{ marginBottom: 'var(--space-4)' }}>
                      Premarital Counseling in Other {stateName} Cities
                    </h3>
                    <p style={{ marginBottom: 'var(--space-6)', color: 'var(--text-secondary)' }}>
                      Also serving engaged couples throughout {stateName}
                    </p>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                      gap: 'var(--space-3)'
                    }}>
                      {stateConfig.major_cities
                        .filter(c => c.toLowerCase().replace(/\s+/g, '-') !== city)
                        .slice(0, 8)
                        .map(cityName => {
                          const citySlug = cityName.toLowerCase().replace(/\s+/g, '-')
                          return (
                            <Link
                              key={citySlug}
                              to={`/premarital-counseling/${state}/${citySlug}`}
                              style={{
                                padding: 'var(--space-3)',
                                background: 'white',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid #e5e7eb',
                                textDecoration: 'none',
                                color: 'var(--color-primary)',
                                fontSize: '0.875rem',
                                transition: 'all 0.2s',
                                textAlign: 'center'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)'
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.boxShadow = 'none'
                              }}
                            >
                              {cityName}
                            </Link>
                          )
                        })}
                    </div>
                    <div style={{ marginTop: 'var(--space-6)', textAlign: 'center' }}>
                      <Link
                        to={`/premarital-counseling/${state}`}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.875rem' }}
                      >
                        View All {stateName} Counselors →
                      </Link>
                    </div>
                  </div>
                )}

                {/* City-specific FAQ for rich results */}
                <div style={{ marginTop: 'var(--space-12)' }}>
                  <FAQ
                    faqs={cityFAQs}
                    title={`Premarital Counseling in ${cityName} — Frequently Asked Questions`}
                    description={`Common questions about premarital counseling in ${cityName}, ${stateName} for engaged couples`}
                    showSearch={false}
                    showAside={false}
                  />
                </div>

                <LocalContent locationName={cityName} />
              </>
            ) : (
              <div className="no-profiles">
                <h2>No premarital counselors listed yet in {cityName}</h2>
                <p>Try searching in nearby areas or <Link to={`/premarital-counseling/${state}`}>browse all {stateName} premarital counselors</Link>.</p>
                <Link to="/claim-profile" className="btn btn-primary">
                  Are you a premarital counselor in {cityName}? Join our directory
                </Link>
              </div>
            )}
          </div>

          {/* Right Sidebar - AI Generated Content Only */}
          <aside className="state-sidebar">
            {contentLoading ? (
              <div className="sidebar-loading">
                <LoadingSpinner />
                <p>Generating AI content for {cityName}...</p>
              </div>
            ) : cityContent ? (
              <>
                {/* AI-Generated Intro */}
                <div className="sidebar-section">
                  <h3>Premarital Counseling for Engaged Couples in {cityName}</h3>
                  <p>{cityContent.intro}</p>
                  <small className="content-source">
                    AI-generated local insights
                  </small>
                </div>

                {/* Pricing Information */}
                {cityContent.sections?.pricing && (
                  <div className="sidebar-section">
                    <h3>Session Costs in {cityName}</h3>
                    <div className="pricing-info">
                      <p><strong>{cityContent.sections.pricing.sessionCost || '$120-200 per session'}</strong></p>
                      {cityContent.sections.pricing.packageDeals && (
                        <p>{cityContent.sections.pricing.packageDeals}</p>
                      )}
                      {cityContent.sections.pricing.insurance && (
                        <p><small>{cityContent.sections.pricing.insurance}</small></p>
                      )}
                    </div>
                  </div>
                )}

                {/* Local Venues */}
                {cityContent.sections?.venues && cityContent.sections.venues.length > 0 && (
                  <div className="sidebar-section">
                    <h3>Popular Local Venues</h3>
                    <div className="venues-list">
                      {cityContent.sections.venues.slice(0, 4).map((venue, index) => (
                        <div key={index} className="venue-item">
                          <strong>{venue.name}</strong>
                          {venue.description && <p><small>{venue.description}</small></p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Demographics & Stats */}
                {cityContent.sections?.demographics && (
                  <div className="sidebar-section">
                    <h3>Local Marriage Trends</h3>
                    <div className="demographics">
                      {cityContent.sections.demographics.population && (
                        <p><strong>Population:</strong> {cityContent.sections.demographics.population.toLocaleString()}</p>
                      )}
                      {cityContent.sections.demographics.married && (
                        <p><strong>Married:</strong> {cityContent.sections.demographics.married}</p>
                      )}
                      {cityContent.sections.demographics.medianAge && (
                        <p><strong>Median Age:</strong> {cityContent.sections.demographics.medianAge}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Marriage Statistics */}
                {cityContent.sections?.marriageStats && (
                  <div className="sidebar-section">
                    <h3>💒 Marriage Statistics</h3>
                    <div className="marriage-stats">
                      {cityContent.sections.marriageStats.avgAge && (
                        <p><strong>Average Age:</strong> {cityContent.sections.marriageStats.avgAge}</p>
                      )}
                      {cityContent.sections.marriageStats.annualMarriages && (
                        <p><strong>Annual Marriages:</strong> {cityContent.sections.marriageStats.annualMarriages}</p>
                      )}
                      {cityContent.sections.marriageStats.trends && (
                        <p>{cityContent.sections.marriageStats.trends}</p>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : null}

            {/* Other Cities in State */}
            {stateConfig?.major_cities && (
              <div className="sidebar-section">
                <h3>Other {stateName} Cities</h3>
                <ul className="city-links">
                  {stateConfig.major_cities
                    .filter(c => c.toLowerCase().replace(/\s+/g, '-') !== city)
                    .slice(0, 6)
                    .map(cityName => {
                      const citySlug = cityName.toLowerCase().replace(/\s+/g, '-')
                      return (
                        <li key={citySlug}>
                          <Link to={`/premarital-counseling/${state}/${citySlug}`}>
                            Premarital counseling in {cityName}
                          </Link>
                        </li>
                      )
                    })}
                </ul>
                <Link to={`/premarital-counseling/${state}`} className="view-all-link">
                  View all {stateName} cities →
                </Link>
              </div>
            )}

            {/* Contact Form for Engaged Couples */}
            <div id="contact-form" className="sidebar-section cta-section" style={{ background: 'var(--bg-primary)', padding: 'var(--space-8)', borderRadius: 'var(--radius-md)' }}>
              <h3>Connect With a Premarital Counselor</h3>
              <p>Preparing for marriage? We'll connect you with experienced premarital counselors in {cityName}.</p>
              <LeadContactForm
                profileId={null}
                professionalName={`Counselors in ${cityName}`}
                stateName={stateName}
                isStateMatching={true}
                onSuccess={() => {
                  // Could show success message
                  alert('Thank you! We\'ll connect you with counselors in ' + cityName + '.')
                }}
              />
            </div>

            {/* CTA Section for Professionals */}
            <div className="sidebar-section cta-section">
              <h3>Join Our Directory</h3>
              <p>Are you a counselor, therapist, or coach in {cityName}?</p>
              <Link to="/claim-profile" className="btn btn-outline btn-full">
                List Your Practice
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default CityPage
