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
import ProfileCard from '../components/profiles/ProfileCard';

import LeadContactForm from '../components/leads/LeadContactForm';
import LocalContent from '../components/common/LocalContent';
import FAQ from '../components/common/FAQ';
import { profileOperations } from '../lib/supabaseClient';
import '../assets/css/state-page.css';

const StatePage = () => {
  const { state } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stateContent, setStateContent] = useState(null)
  const [contentLoading, setContentLoading] = useState(true)
  const [showGetMatchedForm, setShowGetMatchedForm] = useState(false)
  const [stateData, setStateData] = useState(null)

  const stateConfig = STATE_CONFIG[state]
  
  useEffect(() => {
    if (stateConfig) {
      setLoading(false)
      loadStateContent()
      loadStateData()
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

  const loadStateData = async () => {
    try {
      // Get all profiles for this state
      const { data: profiles, error } = await profileOperations.getProfiles({
        state: stateConfig.abbr
      })

      if (error) {
        console.error('Error loading state profiles:', error)
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
        featuredProfiles
      })
    } catch (error) {
      console.error('Error loading state data:', error)
    }
  }


  if (!stateConfig) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">State Not Found</h1>
        <p className="text-gray-600">The state you're looking for doesn't exist.</p>
        <Link to="/premarital-counseling" className="text-blue-600 hover:underline">
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

  // Determine if page should be noindexed (thin content detection)
  const shouldNoindex =
    // State has fewer than 3 cities OR no profiles at all
    (stateConfig.major_cities.length < 3 || (stateData && stateData.totalProfiles === 0)) &&
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
        title={stateContent?.title || `Premarital Counseling in ${stateConfig.name} | ${stateData?.totalProfiles || 'Find'} Marriage Counselors (2025)`}
        description={stateContent?.description || `Find the best premarital counseling in ${stateConfig.name}. Compare ${stateData?.totalProfiles || 'local'} licensed therapists, Christian counselors & marriage prep programs in ${stateConfig.major_cities.length}+ cities. Prices, reviews & direct contact.`}
        url={`/premarital-counseling/${state}`}
        keywords={`premarital counseling ${stateConfig.name}, marriage counseling ${stateConfig.name}, premarital counseling near me ${stateConfig.name}, pre marriage counseling ${stateConfig.name}, premarital therapy ${stateConfig.name}, christian premarital counseling ${stateConfig.name}, marriage therapist ${stateConfig.name}`}
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
              {stateContent?.h1 || `Premarital Counseling in ${stateConfig.name}`}
            </h1>

            <p className="state-subtitle">
              {stateContent?.description || `Find premarital counseling in ${stateConfig.name}. Compare licensed therapists (LMFT, LPC, LCSW), Christian and faith-based counselors, clergy, and online options for engaged couples across ${stateConfig.major_cities.length}+ cities. See methods (Gottman, PREPARE-ENRICH), pricing, and availability.`}
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



      {/* Featured Professionals Section - Immediate Results */}
      {stateData && stateData.featuredProfiles && stateData.featuredProfiles.length > 0 && (
        <div className="state-featured-section">
          <div className="state-container">
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
                Not finding what you need? <a href="#cities-grid" onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById('cities-grid');
                  if(el) el.scrollIntoView({ behavior: 'smooth' });
                }}>Browse by city below</a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cities Grid Section */}
      <div id="cities-grid" className="state-container state-results">
        <div className="mb-6">
          <h2 className="state-results-title">
            Premarital Counseling & Marriage Prep by City
          </h2>
          <p className="state-results-subtitle">
            Select a city to find licensed therapists, Christian counselors, and clergy helping engaged couples prepare for marriage across {stateConfig.name}.
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
                <h3>Premarital Counseling & Marriage Prep in {cityName}</h3>
                <p>Licensed therapists (LMFT, LPC), Christian counselors, clergy, and online options for engaged couples in {cityName}, {stateConfig.abbr}</p>
                <span className="city-arrow">→</span>
              </Link>
            )
          })}
        </div>
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

      {/* AI-Generated SEO Content Section */}
      <div className="state-seo-section">
        <div className="state-container">
          <div className="state-seo-inner">
            <h2 className="state-seo-title">Premarital Counseling & Marriage Preparation in {stateConfig.name}</h2>
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
