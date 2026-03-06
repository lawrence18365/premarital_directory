import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import LoadingSpinner from '../components/common/LoadingSpinner'
import SEOHelmet from '../components/analytics/SEOHelmet'
import Breadcrumbs from '../components/common/Breadcrumbs'
import ProfileCard from '../components/profiles/ProfileCard'
import ProgramCard from '../components/programs/ProgramCard'
import FAQ from '../components/common/FAQ'
import ConciergeLeadForm from '../components/leads/ConciergeLeadForm'
import { getSpecialtyBySlug, getAllSpecialties } from '../data/specialtyConfig'
import { STATE_CONFIG } from '../data/locationConfig'
import { buildCatholicProgramsQuery, isCatholicSpecialty, normalizeProgramRecord } from '../lib/programCatalog'
import { supabase, rankProfilesForCouples } from '../lib/supabaseClient'
import CoupleEmailCapture from '../components/leads/CoupleEmailCapture'
import SpecialtyBlogLinks from '../components/state/SpecialtyBlogLinks'
import '../assets/css/specialty-page.css'

const SpecialtyPage = () => {
  // Note: The param is 'state' from the route, but we use it as specialty slug
  const { state: specialtySlug } = useParams()
  const [loading, setLoading] = useState(true)
  const [profiles, setProfiles] = useState([])
  const [programs, setPrograms] = useState([])
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
      if (isCatholicSpecialty(specialty)) {
        const { data: programData, error: programError } = await buildCatholicProgramsQuery(supabase)
          .order('next_start_date', { ascending: true, nullsFirst: false })
          .order('church_name', { ascending: true })
          .limit(200)

        if (programError) {
          console.error('Error loading catholic programs:', programError)
          setPrograms([])
        } else {
          setPrograms((programData || []).map(normalizeProgramRecord))
        }
      } else {
        setPrograms([])
      }

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

        setProfiles(rankProfilesForCouples(fallbackData || []))
      } else {
        setProfiles(rankProfilesForCouples(data || []))
      }
    } catch (err) {
      console.error('Error:', err)
      setProfiles([])
      setPrograms([])
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
  const isCatholic = isCatholicSpecialty(specialty)
  const programsByState = programs.reduce((acc, program) => {
    const stateValue = program?.church?.stateProvince
    if (!stateValue) return acc
    if (!acc[stateValue]) acc[stateValue] = []
    acc[stateValue].push(program)
    return acc
  }, {})
  const statesWithPrograms = Object.keys(programsByState).sort((a, b) => programsByState[b].length - programsByState[a].length)

  const toStateSlug = (stateValue) => {
    const normalized = String(stateValue || '').trim().toLowerCase()
    const byAbbr = Object.entries(STATE_CONFIG).find(([, config]) => config.abbr?.toLowerCase() === normalized)
    if (byAbbr) return byAbbr[0]
    return normalized.replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')
  }

  if (loading) return <LoadingSpinner />

  return (
    <>
      <SEOHelmet
        title={`${specialty.metaTitle} (${new Date().getFullYear()})`}
        description={specialty.metaDescription}
        url={`/premarital-counseling/${specialtySlug}`}
        keywords={specialty.keywords.join(', ')}
        breadcrumbs={breadcrumbItems}
        structuredData={[serviceStructuredData, faqStructuredData].filter(Boolean)}
        canonicalUrl={`https://www.weddingcounselors.com/premarital-counseling/${specialtySlug}`}
      />

      <div className="specialty-page">
        {/* Hero Header */}
        <header className="specialty-hero" style={{ '--specialty-color': specialty.color }}>
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
                  className="btn btn-primary"
                >
                  <i className="fa fa-heart mr-2"></i>
                  {isCatholic ? 'Find a Catholic Program' : `Find a ${specialty.name} Counselor`}
                </button>
                <Link
                  to="/professional/signup"
                  className="btn btn-secondary"
                  rel="nofollow"
                >
                  <i className="fa fa-plus-circle mr-2"></i>
                  {isCatholic ? 'List Your Program' : 'List Your Practice'}
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Benefits Section */}
        {specialty.benefits && specialty.benefits.length > 0 && (
          <section className="specialty-benefits-section">
            <div className="specialty-container">
              <h2 className="section-title">Experience the Benefits of {specialty.name} Preparation</h2>
              <div className="benefits-grid">
                {specialty.benefits.map((benefit, index) => (
                  <div key={index} className="benefit-card">
                    <i className="fa fa-check"></i>
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Profiles Section */}
        <section className="specialty-profiles-section">
          <div className="specialty-container">
            <h2 className="section-title">
              {isCatholic
                ? (programs.length > 0
                  ? `${programs.length} Verified Catholic Pre-Cana Programs`
                  : 'Verified Catholic Pre-Cana Programs')
                : (profiles.length > 0
                  ? `${profiles.length} Featured ${specialty.name} Counselors`
                  : `Find ${specialty.name} Premarital Counselors`
                )}
            </h2>
            <p className="section-subtitle">
              {isCatholic
                ? (programs.length > 0
                  ? 'Browse verified parish and diocesan marriage preparation programs first. Catholic-friendly therapists are listed below as secondary options.'
                  : 'No verified programs are published yet in this specialty. Claim your parish program to be listed.')
                : (profiles.length > 0
                  ? `Connect with qualified professionals specializing in ${specialty.name.toLowerCase()} marriage preparation across the United States.`
                  : `We're building our network of ${specialty.name.toLowerCase()} counselors. Submit your preferences and we'll match you with qualified professionals.`
                )}
            </p>

            {isCatholic ? (
              <>
                {programs.length > 0 ? (
                  <div className="programs-grid">
                    {programs.slice(0, displayCount).map((program) => (
                      <ProgramCard key={program.id} program={program} />
                    ))}
                  </div>
                ) : (
                  <div className="no-profiles-cta">
                    <p>No verified Catholic programs are listed yet. If you run Pre-Cana in your parish, claim your listing to publish it.</p>
                    <a href="mailto:hello@weddingcounselors.com?subject=Claim%20Our%20Parish%20Program" className="btn btn-primary">
                      Claim Your Program
                    </a>
                  </div>
                )}

                {programs.length > displayCount && (
                  <div className="load-more-section">
                    <button
                      onClick={() => setDisplayCount(prev => prev + 12)}
                      className="btn btn-outline"
                    >
                      Load More Programs ({programs.length - displayCount} remaining)
                    </button>
                  </div>
                )}

                {statesWithPrograms.length > 0 && (
                  <div className="states-with-specialty">
                    <h3>Browse Catholic Programs by State</h3>
                    <div className="state-pills">
                      {statesWithPrograms.map((state) => {
                        const stateSlug = toStateSlug(state)
                        return (
                          <Link
                            key={state}
                            to={`/premarital-counseling/catholic/${stateSlug}`}
                            className="state-pill"
                          >
                            {state} ({programsByState[state].length})
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}

                {profiles.length > 0 && (
                  <div className="states-with-specialty" style={{ marginTop: 'var(--space-12)' }}>
                    <h3 style={{ marginBottom: 'var(--space-8)' }}>Catholic-Friendly Therapists</h3>
                    <div className="profiles-grid">
                      {profiles.slice(0, 6).map((profile) => (
                        <ProfileCard key={profile.id} profile={profile} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              profiles.length > 0 ? (
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
              )
            )}
          </div>
        </section>

        {/* Body Content Section */}
        {specialty.bodyContent && specialty.bodyContent.length > 0 && (
          <section className="specialty-body-section">
            <div className="specialty-container">
              {specialty.bodyContent.map((section, index) => (
                <article key={index} className="specialty-body-block">
                  {section.heading && <h2 className="specialty-body-heading">{section.heading}</h2>}
                  {section.paragraphs && section.paragraphs.map((para, pIndex) => (
                    <p key={pIndex} className="specialty-body-para">{para}</p>
                  ))}
                </article>
              ))}
            </div>
          </section>
        )}

        {/* FAQ Section */}
        {specialty.faqs && specialty.faqs.length > 0 && (
          <section className="specialty-faq-section">
            <div className="specialty-container">
              <FAQ
                faqs={specialty.faqs}
                title={`${specialty.name} Premarital Counseling FAQ`}
                description={`Common questions about ${specialty.name.toLowerCase()} marriage preparation`}
                showSearch={false}
                showAside={false}
              />
            </div>
          </section>
        )}

        <section className="specialty-container" style={{ marginTop: 'var(--space-12)' }}>
          <SpecialtyBlogLinks specialtySlug={specialtySlug} specialtyName={specialty?.name} />
        </section>

        <section className="specialty-container" style={{ marginTop: 'var(--space-12)' }}>
          <CoupleEmailCapture sourcePage={`specialty/${specialtySlug}`} />
        </section>

        {/* Marriage License Discount Cross-Link */}
        <section className="specialty-container" style={{ padding: 'var(--space-12) 0' }}>
          <Link
            to="/premarital-counseling/marriage-license-discount"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-6)',
              padding: 'var(--space-8) var(--space-10)',
              background: 'var(--white)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-2xl)',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'all 0.2s ease',
              boxShadow: 'var(--shadow-sm)'
            }}
            className="hover-shadow"
          >
            <div style={{
              width: '64px',
              height: '64px',
              background: 'rgba(79, 70, 229, 0.1)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <i className="fa fa-piggy-bank" style={{ fontSize: '1.75rem', color: 'var(--primary)' }}></i>
            </div>
            <div>
              <strong style={{ display: 'block', marginBottom: '4px', fontSize: '1.2rem', color: 'var(--text-primary)' }}>Save on your marriage license</strong>
              <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                8 states offer $25–$75 off when you complete premarital counseling. See if yours qualifies and save money on your wedding day.
              </span>
            </div>
          </Link>
        </section>

        {/* Related Specialties */}
        <section className="specialty-related-section">
          <div className="specialty-container">
            <h2 className="section-title">Explore Other Specialties</h2>
            <div className="related-specialties-grid">
              {(specialty.relatedSpecialties
                ? specialty.relatedSpecialties.map(slug => getAllSpecialties().find(s => s.slug === slug)).filter(Boolean)
                : getAllSpecialties().filter(s => s.slug !== specialtySlug).slice(0, 6)
              ).map(s => (
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
        </section>
      </div>

      {/* Sticky mobile CTA */}
      {(profiles.length > 0 || programs.length > 0) && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 90,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderTop: '1px solid var(--border)',
            padding: 'var(--space-3) var(--space-5)',
            display: 'flex',
            gap: 'var(--space-3)',
            alignItems: 'center',
            boxShadow: '0 -4px 12px rgba(0,0,0,0.05)'
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {isCatholic
                ? `${programs.length} Catholic programs`
                : `${profiles.length} ${specialty.name.toLowerCase()} counselors`}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Free to contact • No fees
            </div>
          </div>
          <button
            onClick={() => setShowGetMatchedForm(true)}
            className="btn btn-primary"
            style={{ 
              whiteSpace: 'nowrap', 
              padding: 'var(--space-2) var(--space-5)', 
              fontSize: '0.875rem',
              borderRadius: 'var(--radius-full)',
              minWidth: 'auto'
            }}
          >
            Get Matched Free
          </button>
        </div>
      )}

      {/* Get Matched Modal */}
      <ConciergeLeadForm
        isOpen={showGetMatchedForm}
        onClose={() => setShowGetMatchedForm(false)}
      />
    </>
  )
}

export default SpecialtyPage
