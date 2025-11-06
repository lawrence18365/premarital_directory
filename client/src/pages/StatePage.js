import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import Breadcrumbs, { generateBreadcrumbs } from '../components/common/Breadcrumbs';
import SEOHelmet from '../components/analytics/SEOHelmet';
import { trackLocationPageView } from '../components/analytics/GoogleAnalytics';
import { STATE_CONFIG } from '../data/locationConfig';
import StateContentGenerator from '../lib/stateContentGenerator';
import StateAIContent from '../components/state/StateAIContent';
import LeadContactForm from '../components/leads/LeadContactForm';
import LocalContent from '../components/common/LocalContent';
import '../assets/css/state-page.css';

const StatePage = () => {
  const { state } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stateContent, setStateContent] = useState(null)
  const [contentLoading, setContentLoading] = useState(true)
  const [showGetMatchedForm, setShowGetMatchedForm] = useState(false)
  
  const stateConfig = STATE_CONFIG[state]
  
  useEffect(() => {
    if (stateConfig) {
      setLoading(false)
      loadStateContent()
    } else {
      setError('State not found')
      setLoading(false)
    }
  }, [state, stateConfig])

  // Track page view
  useEffect(() => {
    if (stateConfig) {
      trackLocationPageView(stateConfig.name)
    }
  }, [stateConfig])

  const loadStateContent = async () => {
    setContentLoading(true)
    
    try {
      const contentGenerator = new StateContentGenerator()
      const content = await contentGenerator.getOrGenerateStateContent(
        state, 
        stateConfig
      )
      
      setStateContent(content)
    } catch (error) {
      console.error('AI state content generation failed:', error)
      setStateContent(null)
    }
    
    setContentLoading(false)
  }


  if (!stateConfig) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">State Not Found</h1>
        <p className="text-gray-600">The state you're looking for doesn't exist.</p>
        <Link to="/states" className="text-blue-600 hover:underline">
          Browse all states
        </Link>
      </div>
    )
  }

  // Generate breadcrumbs
  const breadcrumbItems = generateBreadcrumbs.statePage(stateConfig.name)

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />

  return (
    <>
      <SEOHelmet 
        title={stateContent?.title || `Premarital Counselors in ${stateConfig.name}`}
        description={stateContent?.description || `Find qualified premarital counselors and marriage therapists in ${stateConfig.name}. Browse licensed professionals specializing in couples therapy and relationship preparation.`}
        url={`/professionals/${state}`}
        keywords={`premarital counseling ${stateConfig.name}, marriage counselors ${stateConfig.name}, couples therapy ${stateConfig.name}, ${stateConfig.major_cities.join(', ')}`}
        breadcrumbs={breadcrumbItems}
        canonicalUrl={`https://www.weddingcounselors.com/professionals/${state}`}
      />
      <div className="state-page">
        {/* SEO Optimized Header */}
        <div className="state-page-header">
          <div className="state-container">
            <Breadcrumbs items={breadcrumbItems} variant="on-hero" />
            <div className="state-header-content">
            
            <h1 className="state-title">
              {stateContent?.h1 || `Premarital Counselors in ${stateConfig.name}`}
            </h1>
            
            <p className="state-subtitle">
              {stateContent?.description || `Find qualified premarital counselors and couples therapists in ${stateConfig.name}. Get relationship counseling from licensed professionals specializing in marriage preparation.`}
            </p>

            {/* Dual CTAs */}
            <div className="state-cta-section">
              <div className="cta-buttons">
                <button 
                  onClick={() => setShowGetMatchedForm(true)}
                  className="btn btn-primary btn-large"
                >
                  <i className="fa fa-heart mr-2"></i>
                  Get Matched With A Counselor
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

            <div className="popular-cities">
              <h2 className="popular-cities-title">
                Popular Cities in {stateConfig.name}
              </h2>
              <div className="popular-cities-chips">
                {stateConfig.major_cities.map(city => (
                  <Link
                    key={city}
                    to={`/professionals/${state}/${city.toLowerCase().replace(/\s+/g, '-')}`}
                    className="city-chip"
                  >
                    {city}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cities Grid Section */}
      <div className="state-container state-results">
        <div className="mb-6">
          <h2 className="state-results-title">
            Cities in {stateConfig.name}
          </h2>
          <p className="state-results-subtitle">
            Select a city to find premarital counselors and couples therapists in your area.
          </p>
        </div>

        <div className="cities-grid">
          {stateConfig.major_cities.map(cityName => {
            const citySlug = cityName.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '')
            return (
              <Link 
                key={citySlug}
                to={`/professionals/${state}/${citySlug}`}
                className="city-card-large"
              >
                <h3>{cityName}</h3>
                <p>Find counselors in {cityName}, {stateConfig.abbr}</p>
                <span className="city-arrow">→</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* AI-Generated SEO Content Section */}
      <div className="state-seo-section">
        <div className="state-container">
          <div className="state-seo-inner">
            <h2 className="state-seo-title">About Premarital Counseling in {stateConfig.name}</h2>
            <StateAIContent stateName={stateConfig.name} content={stateContent} loading={contentLoading} />
            <LocalContent locationName={stateConfig.name} />

            {/* Major Cities Section */}
            {stateConfig.major_cities && stateConfig.major_cities.length > 0 && (
              <div className="major-cities-section">
                <h3>Major Cities in {stateConfig.name}</h3>
                <p>Find premarital counselors in these {stateConfig.name} cities:</p>
                <div className="major-cities-grid">
                  {stateConfig.major_cities.map(cityName => {
                    const citySlug = cityName.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '')
                    return (
                      <Link 
                        key={citySlug}
                        to={`/professionals/${state}/${citySlug}`}
                        className="city-card"
                      >
                        <h4>{cityName}</h4>
                        <p>Find counselors in {cityName}, {stateConfig.abbr}</p>
                        <span className="city-arrow">→</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Get Matched Modal */}
      {showGetMatchedForm && (
        <div className="modal-overlay" onClick={() => setShowGetMatchedForm(false)}>
          <div className="modal-content get-matched-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Get Matched With A Counselor in {stateConfig.name}</h3>
              <button 
                onClick={() => setShowGetMatchedForm(false)}
                className="modal-close"
                aria-label="Close"
              >
                <i className="fa fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <p>Tell us about your needs and we'll connect you with qualified counselors in {stateConfig.name}.</p>
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
