import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import LoadingSpinner from '../components/common/LoadingSpinner'
import SEOHelmet from '../components/analytics/SEOHelmet'
import Breadcrumbs from '../components/common/Breadcrumbs'
import ProfileCard from '../components/profiles/ProfileCard'
import FAQ from '../components/common/FAQ'
import LeadContactForm from '../components/leads/LeadContactForm'
import { getSpecialtyBySlug, getAllSpecialties } from '../data/specialtyConfig'
import { supabase } from '../lib/supabaseClient'
import '../assets/css/specialty-page.css'

const SpecialtyPage = () => {
  // Note: The param is 'state' from the route, but we use it as specialty slug
  const { state: specialtySlug } = useParams()
  const [loading, setLoading] = useState(true)
  const [profiles, setProfiles] = useState([])
  const [showGetMatchedForm, setShowGetMatchedForm] = useState(false)
  const [displayCount, setDisplayCount] = useState(12)

  const specialty = getSpecialtyBySlug(specialtySlug)

  useEffect(() => {
    if (specialty) {
      loadProfiles()
    } else {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specialtySlug])

  const loadProfiles = async () => {
    setLoading(true)

    try {
      // Build OR conditions for filterTerms
      const filterConditions = specialty.filterTerms
        .map(term => `bio.ilike.%${term}%,specialties.cs.{${term}}`)
        .join(',')

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_hidden', false)
        .or(filterConditions)
        .order('sponsored_rank', { ascending: false })
        .order('is_sponsored', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        console.error('Error loading specialty profiles:', error)
        // Fallback: try simpler search
        const fallbackTerms = specialty.filterTerms.slice(0, 3)
        const simpleConditions = fallbackTerms
          .map(term => `bio.ilike.%${term}%`)
          .join(',')

        const { data: fallbackData } = await supabase
          .from('profiles')
          .select('*')
          .eq('is_hidden', false)
          .or(simpleConditions)
          .order('created_at', { ascending: false })
          .limit(100)

        setProfiles(fallbackData || [])
      } else {
        setProfiles(data || [])
      }
    } catch (err) {
      console.error('Error:', err)
      setProfiles([])
    }

    setLoading(false)
  }

  // Handle 404 for unknown specialty
  if (!specialty) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Specialty Not Found</h1>
        <p className="text-gray-600 mb-4">The specialty you're looking for doesn't exist.</p>
        <Link to="/premarital-counseling" className="text-blue-600 hover:underline">
          Browse all premarital counselors
        </Link>
      </div>
    )
  }

  // Generate breadcrumbs
  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'Premarital Counseling', url: '/premarital-counseling' },
    { name: specialty.name, url: null }
  ]

  // Structured data for FAQPage
  const faqStructuredData = specialty.faqs && specialty.faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": specialty.faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  } : null

  // Service structured data
  const serviceStructuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": specialty.title,
    "description": specialty.metaDescription,
    "provider": {
      "@type": "Organization",
      "name": "WeddingCounselors.com"
    },
    "areaServed": {
      "@type": "Country",
      "name": "United States"
    },
    "serviceType": "Premarital Counseling"
  }

  // Group profiles by state for display
  const profilesByState = profiles.reduce((acc, profile) => {
    const state = profile.state_province || 'Other'
    if (!acc[state]) acc[state] = []
    acc[state].push(profile)
    return acc
  }, {})

  const statesWithProfiles = Object.keys(profilesByState).sort()

  if (loading) return <LoadingSpinner />

  return (
    <>
      <SEOHelmet
        title={specialty.metaTitle}
        description={specialty.metaDescription}
        url={`/premarital-counseling/${specialtySlug}`}
        keywords={specialty.keywords.join(', ')}
        breadcrumbs={breadcrumbItems}
        structuredData={[serviceStructuredData, faqStructuredData].filter(Boolean)}
        canonicalUrl={`https://www.weddingcounselors.com/premarital-counseling/${specialtySlug}`}
      />

      <div className="specialty-page">
        {/* Hero Header */}
        <div className="specialty-hero" style={{ '--specialty-color': specialty.color }}>
          <div className="specialty-container">
            <Breadcrumbs items={breadcrumbItems} variant="on-hero" />

            <div className="specialty-hero-content">
              <div className="specialty-icon">
                <i className={`fa ${specialty.icon}`}></i>
              </div>

              <h1 className="specialty-title">{specialty.h1}</h1>
              <p className="specialty-subtitle">{specialty.subtitle}</p>

              <div className="specialty-intro">
                <p>{specialty.intro}</p>
              </div>

              {/* CTA Buttons */}
              <div className="specialty-cta">
                <button
                  onClick={() => setShowGetMatchedForm(true)}
                  className="btn btn-primary btn-large"
                >
                  <i className="fa fa-heart mr-2"></i>
                  Find a {specialty.name} Counselor
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

        {/* Benefits Section */}
        {specialty.benefits && specialty.benefits.length > 0 && (
          <div className="specialty-benefits-section">
            <div className="specialty-container">
              <h2 className="section-title">Why Choose {specialty.name} Counseling?</h2>
              <div className="benefits-grid">
                {specialty.benefits.map((benefit, index) => (
                  <div key={index} className="benefit-card">
                    <i className="fa fa-check-circle"></i>
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Profiles Section */}
        <div className="specialty-profiles-section">
          <div className="specialty-container">
            <h2 className="section-title">
              {profiles.length > 0
                ? `${profiles.length} ${specialty.name} Premarital Counselors`
                : `Find ${specialty.name} Premarital Counselors`
              }
            </h2>
            <p className="section-subtitle">
              {profiles.length > 0
                ? `Connect with premarital counselors specializing in ${specialty.name.toLowerCase()} marriage preparation across the United States.`
                : `We're building our network of ${specialty.name.toLowerCase()} counselors. Submit your preferences and we'll match you with qualified professionals.`
              }
            </p>

            {profiles.length > 0 ? (
              <>
                <div className="profiles-grid">
                  {profiles.slice(0, displayCount).map(profile => (
                    <ProfileCard key={profile.id} profile={profile} />
                  ))}
                </div>

                {profiles.length > displayCount && (
                  <div className="load-more-section">
                    <button
                      onClick={() => setDisplayCount(prev => prev + 12)}
                      className="btn btn-outline"
                    >
                      Load More Counselors ({profiles.length - displayCount} remaining)
                    </button>
                  </div>
                )}

                {/* States with counselors */}
                {statesWithProfiles.length > 0 && (
                  <div className="states-with-specialty">
                    <h3>Browse {specialty.name} Counselors by State</h3>
                    <div className="state-pills">
                      {statesWithProfiles.map(state => (
                        <Link
                          key={state}
                          to={`/premarital-counseling/${state.toLowerCase().replace(/\s+/g, '-')}`}
                          className="state-pill"
                        >
                          {state} ({profilesByState[state].length})
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="no-profiles-cta">
                <p>We're actively growing our {specialty.name.toLowerCase()} counselor network.</p>
                <button
                  onClick={() => setShowGetMatchedForm(true)}
                  className="btn btn-primary"
                >
                  Get Matched With a Counselor
                </button>
              </div>
            )}
          </div>
        </div>

        {/* FAQ Section */}
        {specialty.faqs && specialty.faqs.length > 0 && (
          <div className="specialty-faq-section">
            <div className="specialty-container">
              <FAQ
                faqs={specialty.faqs}
                title={`${specialty.name} Premarital Counseling — Frequently Asked Questions`}
                description={`Common questions about ${specialty.name.toLowerCase()} marriage preparation`}
                showSearch={false}
                showAside={false}
              />
            </div>
          </div>
        )}

        {/* Related Specialties */}
        <div className="specialty-related-section">
          <div className="specialty-container">
            <h2 className="section-title">Explore Other Specialties</h2>
            <div className="related-specialties-grid">
              {getAllSpecialties()
                .filter(s => s.slug !== specialtySlug)
                .slice(0, 6)
                .map(s => (
                  <Link
                    key={s.slug}
                    to={`/premarital-counseling/${s.slug}`}
                    className="related-specialty-card"
                    style={{ '--card-color': s.color }}
                  >
                    <i className={`fa ${s.icon}`}></i>
                    <h3>{s.name}</h3>
                    <p>{s.subtitle}</p>
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
              <h3>Find a {specialty.name} Counselor</h3>
              <button
                onClick={() => setShowGetMatchedForm(false)}
                className="modal-close"
                aria-label="Close"
              >
                <i className="fa fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <p>Looking for {specialty.name.toLowerCase()} marriage preparation? We'll connect you with qualified counselors.</p>
              <LeadContactForm
                profileId={null}
                professionalName={`${specialty.name} Counselors`}
                isSpecialtyMatching={true}
                specialtyType={specialty.name}
                onSuccess={() => {
                  setShowGetMatchedForm(false)
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default SpecialtyPage
