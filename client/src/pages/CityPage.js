import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ProfileList from '../components/profiles/ProfileList';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import Breadcrumbs, { generateBreadcrumbs } from '../components/common/Breadcrumbs';
import SEOHelmet from '../components/analytics/SEOHelmet';
import { trackLocationPageView } from '../components/analytics/GoogleAnalytics';
import { profileOperations } from '../lib/supabaseClient';
import { STATE_CONFIG, CITY_CONFIG } from '../data/locationConfig';
import CityContentGenerator from '../lib/cityContentGenerator';
import LocalContent from '../components/common/LocalContent';
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
        setProfiles(data || [])
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

  const breadcrumbData = generateBreadcrumbs.cityPage(stateName, cityName, `/professionals/${state}`)

  const nearbyStates = Object.entries(STATE_CONFIG)
    .filter(([key]) => key !== state)
    .slice(0, 6)

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    'name': `Premarital Counseling in ${cityName}, ${stateName}`,
    'description': `Find qualified premarital counselors, therapists, and coaches in ${cityName}, ${stateName}. Licensed professionals specializing in marriage preparation and relationship counseling.`,
    'areaServed': {
      '@type': 'City',
      'name': cityName,
      'containedInPlace': {
        '@type': 'State',
        'name': stateName
      }
    },
    'serviceArea': {
      '@type': 'GeoCircle',
      'geoMidpoint': {
        '@type': 'GeoCoordinates',
        'addressLocality': cityName,
        'addressRegion': stateConfig?.abbr
      }
    }
  }

  return (
    <div className="city-page">
      <SEOHelmet 
        title={cityContent?.title || `Premarital Counseling in ${cityName}, ${stateName} | Wedding Counselors`}
        description={cityContent?.description || `Find the best premarital counselors in ${cityName}, ${stateName}. ${profiles.length}+ licensed therapists, coaches, and clergy specializing in marriage preparation and relationship counseling.`}
        keywords={`premarital counseling ${cityName}, marriage counseling ${cityName} ${stateName}, couples therapy ${cityName}, wedding counselors ${cityName}, relationship therapy ${cityName}`}
        structuredData={structuredData}
        noindex={true}
      />

      {/* City Header */}
      <section className="state-header city-header">
        <div className="container">
          <Breadcrumbs items={breadcrumbData} variant="on-hero" />
          <div className="state-header-content">
            <h1>Premarital Counseling in {cityName}, {stateName}</h1>
            <p className="lead">
              Connect with qualified therapists, coaches, and clergy in {cityName} who specialize in marriage preparation and relationship counseling.
            </p>
            
            {/* City Stats */}
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
                  <h2>Top Premarital Counselors in {cityName}</h2>
                  <p>All professionals are licensed and specialize in marriage preparation</p>
                </div>
                <ProfileList 
                  profiles={profiles}
                  loading={false}
                  error={null}
                  showLocation={false}
                />
                <LocalContent locationName={cityName} />
              </>
            ) : (
              <div className="no-profiles">
                <h2>No professionals found in {cityName}</h2>
                <p>Try searching in nearby areas or <Link to={`/professionals/${state}`}>browse all {stateName} professionals</Link>.</p>
                <Link to="/claim-profile" className="btn btn-primary">
                  Are you a counselor in {cityName}? Join our directory
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
                  <h3>About Premarital Counseling in {cityName}</h3>
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
                          <Link to={`/professionals/${state}/${citySlug}`}>
                            {cityName}
                          </Link>
                        </li>
                      )
                    })}
                </ul>
                <Link to={`/professionals/${state}`} className="view-all-link">
                  View all {stateName} professionals →
                </Link>
              </div>
            )}

            {/* CTA Section */}
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
