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

  // Determine if page should be noindexed (thin content detection)
  const shouldNoindex =
    // State has fewer than 5 cities
    stateConfig.major_cities.length < 5 ||
    // Content contains placeholder text
    (stateContent?.description && (
      stateContent.description.toLowerCase().includes('placeholder') ||
      stateContent.description.toLowerCase().includes('coming soon')
    ))

  // Generate ItemList structured data for cities
  const citiesItemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Cities in ${stateConfig.name}`,
    "description": `Find premarital counselors in ${stateConfig.name} cities`,
    "numberOfItems": stateConfig.major_cities.length,
    "itemListElement": stateConfig.major_cities.map((cityName, index) => {
      const citySlug = cityName.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '')
      return {
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "WebPage",
          "name": `${cityName}, ${stateConfig.abbr}`,
          "url": `https://www.weddingcounselors.com/premarital-counseling/${state}/${citySlug}`,
          "description": `Find premarital counselors in ${cityName}, ${stateConfig.name}`
        }
      }
    })
  }

  return (
    <>
      <SEOHelmet
        title={stateContent?.title || `Premarital Counseling in ${stateConfig.name} — Find Counselors (2025)`}
        description={stateContent?.description || `Find premarital counseling in ${stateConfig.name}. Compare licensed therapists (LMFT, LPC, LCSW), Christian and faith-based counselors, clergy, and online options for engaged couples. See prices, specialties, and availability across ${stateConfig.major_cities.length}+ cities.`}
        url={`/premarital-counseling/${state}`}
        keywords={`premarital counseling ${stateConfig.name}, premarital therapy ${stateConfig.name}, pre marriage counseling ${stateConfig.name}, christian premarital counseling ${stateConfig.name}, pre cana ${stateConfig.name}, clergy premarital counseling, ${stateConfig.major_cities.join(', ')}`}
        breadcrumbs={breadcrumbItems}
        structuredData={citiesItemList}
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
              {stateContent?.h1 || `Premarital Counseling in ${stateConfig.name}`}
            </h1>

            <p className="state-subtitle">
              {stateContent?.description || `Find premarital counseling in ${stateConfig.name}. Compare licensed therapists (LMFT, LPC, LCSW), Christian and faith-based counselors, clergy, and online options for engaged couples across ${stateConfig.major_cities.length}+ cities. See methods (Gottman, PREPARE-ENRICH), pricing, and availability.`}
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
                >
                  <i className="fa fa-plus-circle mr-2"></i>
                  List Your Practice
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cities Grid Section */}
      <div className="state-container state-results">
        <div className="mb-6">
          <h2 className="state-results-title">
            Premarital Counseling in {stateConfig.name}
          </h2>
          <p className="state-results-subtitle">
            Select a city to find premarital counselors helping engaged couples prepare for marriage.
          </p>
        </div>

        <div className="cities-grid">
          {stateConfig.major_cities.map(cityName => {
            const citySlug = cityName.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '')
            return (
              <Link
                key={citySlug}
                to={`/premarital-counseling/${state}/${citySlug}`}
                className="city-card-large"
              >
                <h3>Premarital Counseling in {cityName}</h3>
                <p>Find therapists, Christian counselors, clergy, and online options for engaged couples in {cityName}, {stateConfig.abbr}</p>
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
            <h2 className="state-seo-title">Premarital Counseling for Engaged Couples in {stateConfig.name}</h2>
            <StateAIContent stateName={stateConfig.name} content={stateContent} loading={contentLoading} />
            <LocalContent locationName={stateConfig.name} />
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
