import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import LoadingSpinner from '../components/common/LoadingSpinner'
import SEOHelmet from '../components/analytics/SEOHelmet'
import Breadcrumbs from '../components/common/Breadcrumbs'
import ProfileCard from '../components/profiles/ProfileCard'
import ProgramCard from '../components/programs/ProgramCard'
import FAQ from '../components/common/FAQ'
import LeadContactForm from '../components/leads/LeadContactForm'
import LocalSpecialtyContent from '../components/common/LocalSpecialtyContent'
import LocationInsights from '../components/common/LocationInsights'
import { getSpecialtyBySlug } from '../data/specialtyConfig'
import { STATE_CONFIG } from '../data/locationConfig'
import {
  buildCatholicProgramsQuery,
  isCatholicSpecialty,
  MIN_VERIFIED_PROGRAMS_FOR_INDEX,
  normalizeProgramRecord
} from '../lib/programCatalog'
import { supabase } from '../lib/supabaseClient'
import '../assets/css/specialty-page.css'

const SpecialtyStatePage = ({ specialtyOverride, stateOverride }) => {
  // Params: /premarital-counseling/:specialty/:state
  const params = useParams()
  const specialtySlug = specialtyOverride || params.specialty
  const stateSlug = stateOverride || params.state
  
  const [loading, setLoading] = useState(true)
  const [profiles, setProfiles] = useState([])
  const [programs, setPrograms] = useState([])
  const [availableCities, setAvailableCities] = useState([])
  const [showGetMatchedForm, setShowGetMatchedForm] = useState(false)
  const [displayCount, setDisplayCount] = useState(12)

  const specialty = getSpecialtyBySlug(specialtySlug)
  const isCatholic = isCatholicSpecialty(specialty)
  const stateConfig = STATE_CONFIG[stateSlug]
  const stateName = stateConfig?.name || stateSlug.charAt(0).toUpperCase() + stateSlug.slice(1).replace('-', ' ')

  useEffect(() => {
    if (specialty && stateSlug) {
      loadProfiles()
    } else {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specialtySlug, stateSlug])

  const loadProfiles = async () => {
    setLoading(true)

    try {
      if (isCatholic) {
        const { data: programData, error: programError } = await buildCatholicProgramsQuery(supabase)
          .eq('state_province', stateConfig?.abbr || stateSlug)
          .order('next_start_date', { ascending: true, nullsFirst: false })
          .order('city', { ascending: true })
          .limit(200)

        if (programError) {
          console.error('Error loading catholic programs by state:', programError)
          setPrograms([])
          setAvailableCities([])
        } else {
          const catholicPrograms = (programData || []).map(normalizeProgramRecord)
          setPrograms(catholicPrograms)

          const cityCounts = {}
          catholicPrograms.forEach((program) => {
            const cityName = (program?.church?.city || '').trim()
            if (!cityName) return
            const citySlug = cityName.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')
            if (!cityCounts[citySlug]) {
              cityCounts[citySlug] = {
                name: cityName,
                slug: citySlug,
                count: 0
              }
            }
            cityCounts[citySlug].count += 1
          })

          setAvailableCities(
            Object.values(cityCounts).sort((a, b) => b.count - a.count)
          )
        }
      } else {
        setPrograms([])
      }

      // Build OR conditions for filterTerms
      // AND filter by state
      const filterConditions = specialty.filterTerms
        .map(term => `bio.ilike.%${term}%,specialties.cs.{${term}}`)
        .join(',')

      // Supabase doesn't easily support (A OR B) AND C in one simple query string builder
      // But we can chain .eq('state_province', stateConfig.abbr) 
      // However, .or() applies to the whole query usually unless scoped.
      // Actually, .or() takes a filter string.
      // .eq('state_province', 'TX').or('bio.ilike.%Christian%') -> WHERE state='TX' AND (bio like ... OR ...)
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_hidden', false)
        .eq('state_province', stateConfig?.abbr || stateSlug) // Use abbreviation if available
        .or(filterConditions)
        .order('sponsored_rank', { ascending: false })
        .order('is_sponsored', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        console.error('Error loading specialty profiles:', error)
        setProfiles([])
        if (!isCatholic) {
          setAvailableCities([])
        }
      } else {
        const specialtyProfiles = data || []
        setProfiles(specialtyProfiles)

        const cityCounts = {}
        const stateCities = stateConfig?.major_cities || []
        const canonicalCityBySlug = stateCities.reduce((acc, cityName) => {
          const slug = cityName.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')
          acc[slug] = cityName
          return acc
        }, {})

        specialtyProfiles.forEach((profile) => {
          const cityName = (profile.city || '').trim()
          if (!cityName) return
          const citySlug = cityName.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')
          if (!canonicalCityBySlug[citySlug]) return

          if (!cityCounts[citySlug]) {
            cityCounts[citySlug] = {
              name: canonicalCityBySlug[citySlug],
              slug: citySlug,
              count: 0
            }
          }
          cityCounts[citySlug].count += 1
        })

        if (!isCatholic) {
          setAvailableCities(
            Object.values(cityCounts).sort((a, b) => b.count - a.count)
          )
        }
      }
    } catch (err) {
      console.error('Error:', err)
      setProfiles([])
      setPrograms([])
      if (!isCatholic) {
        setAvailableCities([])
      }
    }

    setLoading(false)
  }

  // Handle 404
  if (!specialty || !stateSlug) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h1>
        <Link to="/premarital-counseling" className="btn btn-outline">
          Browse all premarital counselors
        </Link>
      </div>
    )
  }

  // Generate breadcrumbs
  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'Premarital Counseling', url: '/premarital-counseling' },
    { name: specialty.name, url: `/premarital-counseling/${specialtySlug}` },
    { name: stateName, url: null }
  ]

  // SEO Meta
  const metaTitle = specialty.stateMetaTitle
    ? specialty.stateMetaTitle(stateName)
    : `${specialty.name} Premarital Counseling in ${stateName} (${new Date().getFullYear()})`
  const profileCountText = profiles.length > 0 ? profiles.length : 'qualified'
  const metaDescription = isCatholic
    ? `Find verified Catholic Pre-Cana programs in ${stateName}. Browse parish and diocesan marriage preparation options.`
    : specialty.stateMetaDescription
      ? specialty.stateMetaDescription(stateName, profiles.length)
      : `Compare ${profileCountText} ${specialty.name.toLowerCase()} premarital counselors in ${stateName}. Browse profiles, see pricing & availability. Contact a therapist directly.`
  const shouldNoindex = isCatholic
    ? programs.length < MIN_VERIFIED_PROGRAMS_FOR_INDEX
    : profiles.length < 3

  // Get major cities from config
  const majorCities = availableCities

  if (loading) return <LoadingSpinner />

  return (
    <>
      <SEOHelmet
        title={metaTitle}
        description={metaDescription}
        url={shouldNoindex
          ? `/premarital-counseling/${stateSlug}`
          : `/premarital-counseling/${specialtySlug}/${stateSlug}`}
        breadcrumbs={breadcrumbItems}
        noindex={shouldNoindex}
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

              <h1 className="specialty-title">
                {isCatholic ? `Catholic Pre-Cana Programs in ${stateName}` : `${specialty.name} Premarital Counseling in ${stateName}`}
              </h1>
              <p className="specialty-subtitle">
                {isCatholic ? `Browse verified Catholic marriage preparation options across ${stateName}` : `Find ${specialty.name.toLowerCase()} marriage preparation across ${stateName}`}
              </p>

              <LocalSpecialtyContent specialty={specialty} stateName={stateName} />

              {/* CTA Buttons */}
              <div className="specialty-cta">
                <button
                  onClick={() => setShowGetMatchedForm(true)}
                  className="btn btn-primary btn-large"
                >
                  <i className="fa fa-heart mr-2"></i>
                  Match Me in {stateName}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Profiles Section */}
        <div className="specialty-profiles-section">
          <div className="specialty-container">
            {/* Money SERP Insights Box */}
            {!isCatholic && (
              <LocationInsights
                stateSlug={stateSlug}
                specialty={specialty}
              />
            )}

            {/* Dynamic Local Content - Prevents "Thin Content" */}
            <LocalSpecialtyContent 
              specialty={specialty} 
              stateName={stateName} 
            />
            
            <h2 className="section-title" style={{ marginTop: 'var(--space-8)' }}>
              {isCatholic
                ? (programs.length > 0
                  ? `${programs.length} Verified Catholic Programs in ${stateName}`
                  : `Verified Catholic Programs in ${stateName}`)
                : (profiles.length > 0
                  ? `${profiles.length} ${specialty.name} Counselors in ${stateName}`
                  : `${specialty.name} Counselors in ${stateName}`
                )}
            </h2>

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
                    <p>No verified Catholic programs are published in {stateName} yet.</p>
                    <a href="mailto:hello@weddingcounselors.com?subject=Claim%20Our%20Catholic%20Program" className="btn btn-primary">
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
                      Load More Programs
                    </button>
                  </div>
                )}

                {profiles.length > 0 && (
                  <div className="states-with-specialty">
                    <h3>Catholic-Friendly Therapists (Secondary)</h3>
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
                        Load More Counselors
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="no-profiles-cta">
                  <p>We're actively growing our {specialty.name.toLowerCase()} counselor network in {stateName}.</p>
                  <button
                    onClick={() => setShowGetMatchedForm(true)}
                    className="btn btn-primary"
                  >
                    Get Matched With a Counselor
                  </button>
                </div>
              )
            )}
            
            {/* Cities Section - Link to SpecialtyCityPages */}
            {majorCities.length > 0 && (
              <div className="states-with-specialty">
                <h3>{isCatholic ? 'Find Catholic Programs by City' : `Find ${specialty.name} Counseling by City`}</h3>
                <div className="state-pills">
                  {majorCities.map(city => {
                     return (
                        <Link
                          key={city.slug}
                          to={`/premarital-counseling/${specialtySlug}/${stateSlug}/${city.slug}`}
                          className="state-pill"
                        >
                          {city.name}
                        </Link>
                     )
                  })}
                </div>
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
                title={`${specialty.name} Counseling in ${stateName} — FAQ`}
                showSearch={false}
                showAside={false}
              />
            </div>
          </div>
        )}
      </div>

      {/* Get Matched Modal */}
      {showGetMatchedForm && (
        <div className="modal-overlay" onClick={() => setShowGetMatchedForm(false)}>
          <div className="modal-content get-matched-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{isCatholic ? `Find a Catholic Program in ${stateName}` : `Find a ${specialty.name} Counselor in ${stateName}`}</h3>
              <button
                onClick={() => setShowGetMatchedForm(false)}
                className="modal-close"
                aria-label="Close"
              >
                <i className="fa fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <LeadContactForm
                profileId={null}
                professionalName={isCatholic ? `Catholic Programs in ${stateName}` : `${specialty.name} Counselors in ${stateName}`}
                isSpecialtyMatching={true}
                specialtyType={specialty.name}
                stateName={stateName}
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

export default SpecialtyStatePage
