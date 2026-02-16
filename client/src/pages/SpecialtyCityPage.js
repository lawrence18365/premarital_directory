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
import { STATE_CONFIG, CITY_CONFIG } from '../data/locationConfig'
import {
  buildCatholicProgramsQuery,
  isCatholicSpecialty,
  MIN_VERIFIED_PROGRAMS_FOR_INDEX,
  normalizeProgramRecord
} from '../lib/programCatalog'
import { supabase } from '../lib/supabaseClient'
import '../assets/css/specialty-page.css'

const SpecialtyCityPage = ({ specialtyOverride, stateOverride, cityOverride }) => {
  // Params: /premarital-counseling/:specialty/:state/:city
  const params = useParams()
  const specialtySlug = specialtyOverride || params.specialty
  const stateSlug = stateOverride || params.state
  const citySlug = cityOverride || params.city

  const [loading, setLoading] = useState(true)
  const [profiles, setProfiles] = useState([])
  const [programs, setPrograms] = useState([])
  const [nearbySpecialtyCities, setNearbySpecialtyCities] = useState([])
  const [showGetMatchedForm, setShowGetMatchedForm] = useState(false)
  const [displayCount, setDisplayCount] = useState(12)

  const specialty = getSpecialtyBySlug(specialtySlug)
  const isCatholic = isCatholicSpecialty(specialty)
  const stateConfig = STATE_CONFIG[stateSlug]
  const stateName = stateConfig?.name || stateSlug.charAt(0).toUpperCase() + stateSlug.slice(1).replace('-', ' ')
  
  // Get city name from config or format slug
  const cityConfig = CITY_CONFIG[stateSlug]?.[citySlug]
  const cityName = cityConfig?.name || citySlug.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')

  useEffect(() => {
    if (specialty && stateSlug && citySlug) {
      loadProfiles()
    } else {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specialtySlug, stateSlug, citySlug])

  const loadProfiles = async () => {
    setLoading(true)

    try {
      if (isCatholic) {
        const { data: cityProgramData, error: cityProgramError } = await buildCatholicProgramsQuery(supabase)
          .eq('state_province', stateConfig?.abbr || stateSlug)
          .eq('city', cityName)
          .order('next_start_date', { ascending: true, nullsFirst: false })
          .limit(120)

        if (cityProgramError) {
          console.error('Error loading catholic city programs:', cityProgramError)
          setPrograms([])
        } else {
          setPrograms((cityProgramData || []).map(normalizeProgramRecord))
        }

        const { data: stateProgramData, error: stateProgramError } = await buildCatholicProgramsQuery(supabase)
          .eq('state_province', stateConfig?.abbr || stateSlug)
          .order('city', { ascending: true })
          .limit(300)

        if (stateProgramError) {
          console.error('Error loading catholic nearby cities:', stateProgramError)
          setNearbySpecialtyCities([])
        } else {
          const cityCounts = {}
          ;(stateProgramData || []).forEach((program) => {
            const profileCity = (program.city || '').trim()
            if (!profileCity) return
            const slug = profileCity.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')
            if (!cityCounts[slug]) {
              cityCounts[slug] = {
                name: profileCity,
                slug,
                count: 0
              }
            }
            cityCounts[slug].count += 1
          })

          const currentCitySlug = cityName.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')
          setNearbySpecialtyCities(
            Object.values(cityCounts)
              .filter((cityItem) => cityItem.slug !== currentCitySlug)
              .sort((a, b) => b.count - a.count)
              .slice(0, 6)
          )
        }
      } else {
        setPrograms([])
      }

      const filterConditions = specialty.filterTerms
        .map(term => `bio.ilike.%${term}%,specialties.cs.{${term}}`)
        .join(',')
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_hidden', false)
        .eq('city', cityName) // Exact city match
        .eq('state_province', stateConfig?.abbr || stateSlug)
        .or(filterConditions)
        .order('sponsored_rank', { ascending: false })
        .order('is_sponsored', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        console.error('Error loading specialty profiles:', error)
        setProfiles([])
        if (!isCatholic) {
          setNearbySpecialtyCities([])
        }
      } else {
        setProfiles(data || [])

        const { data: stateSpecialtyProfiles, error: stateError } = await supabase
          .from('profiles')
          .select('city')
          .eq('is_hidden', false)
          .eq('state_province', stateConfig?.abbr || stateSlug)
          .or(filterConditions)
          .limit(300)

        if (stateError) {
          if (!isCatholic) {
            setNearbySpecialtyCities([])
          }
        } else {
          const canonicalCityBySlug = (stateConfig?.major_cities || []).reduce((acc, name) => {
            const slug = name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')
            acc[slug] = name
            return acc
          }, {})

          const cityCounts = {}
          ;(stateSpecialtyProfiles || []).forEach((profile) => {
            const profileCity = (profile.city || '').trim()
            if (!profileCity) return
            const slug = profileCity.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')
            if (!canonicalCityBySlug[slug]) return

            if (!cityCounts[slug]) {
              cityCounts[slug] = {
                name: canonicalCityBySlug[slug],
                slug,
                count: 0
              }
            }
            cityCounts[slug].count += 1
          })

          const currentCitySlug = cityName.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')
          if (!isCatholic) {
            setNearbySpecialtyCities(
              Object.values(cityCounts)
                .filter((cityItem) => cityItem.slug !== currentCitySlug)
                .sort((a, b) => b.count - a.count)
                .slice(0, 6)
            )
          }
        }
      }
    } catch (err) {
      console.error('Error:', err)
      setProfiles([])
      setPrograms([])
      if (!isCatholic) {
        setNearbySpecialtyCities([])
      }
    }

    setLoading(false)
  }

  // Handle 404
  if (!specialty || !stateSlug || !citySlug) {
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
    { name: stateName, url: `/premarital-counseling/${specialtySlug}/${stateSlug}` },
    { name: cityName, url: null }
  ]

  // SEO Meta
  const metaTitle = `${specialty.name} Premarital Counseling in ${cityName}, ${stateConfig?.abbr || stateName} | Top Counselors`
  const metaDescription = isCatholic
    ? `Find verified Catholic Pre-Cana programs in ${cityName}, ${stateConfig?.abbr || stateName}.`
    : `Find ${specialty.name.toLowerCase()} premarital counselors in ${cityName}, ${stateConfig?.abbr || stateName}. Compare top rated therapists and programs for ${specialty.name} marriage preparation.`
  const isAnchorCity = cityConfig?.is_anchor === true
  const shouldNoindex = isCatholic
    ? programs.length < MIN_VERIFIED_PROGRAMS_FOR_INDEX
    : (profiles.length === 0 || (!isAnchorCity && profiles.length < 2))

  if (loading) return <LoadingSpinner />

  return (
    <>
      <SEOHelmet
        title={metaTitle}
        description={metaDescription}
        url={shouldNoindex
          ? `/premarital-counseling/${stateSlug}/${citySlug}`
          : `/premarital-counseling/${specialtySlug}/${stateSlug}/${citySlug}`}
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
                {isCatholic ? `Catholic Pre-Cana Programs in ${cityName}` : `${specialty.name} Counselors in ${cityName}`}
              </h1>
              <p className="specialty-subtitle">
                {isCatholic
                  ? `Verified Catholic marriage preparation in ${cityName}, ${stateConfig?.abbr || stateName}`
                  : `Top rated ${specialty.name.toLowerCase()} marriage preparation in ${cityName}, ${stateConfig?.abbr || stateName}`}
              </p>

              {/* CTA Buttons */}
              <div className="specialty-cta">
                <button
                  onClick={() => setShowGetMatchedForm(true)}
                  className="btn btn-primary btn-large"
                >
                  <i className="fa fa-heart mr-2"></i>
                  Match Me in {cityName}
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
                citySlug={citySlug}
                specialty={specialty}
              />
            )}

            {/* Dynamic Local Content - Prevents "Thin Content" */}
            <LocalSpecialtyContent 
              specialty={specialty} 
              stateName={stateName}
              cityName={cityName}
            />

            <h2 className="section-title" style={{ marginTop: 'var(--space-8)' }}>
              {isCatholic
                ? (programs.length > 0
                  ? `${programs.length} Verified Catholic Programs in ${cityName}`
                  : `Verified Catholic Programs in ${cityName}`)
                : (profiles.length > 0
                  ? `${profiles.length} ${specialty.name} Counselors in ${cityName}`
                  : `${specialty.name} Counselors in ${cityName}`
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
                    <p>No verified Catholic programs are published in {cityName} yet.</p>
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
                  <p>We're actively growing our {specialty.name.toLowerCase()} counselor network in {cityName}.</p>
                  <button
                    onClick={() => setShowGetMatchedForm(true)}
                    className="btn btn-primary"
                  >
                    Get Matched With a Counselor
                  </button>
                </div>
              )
            )}
            
            {/* Nearby Cities Links */}
            {nearbySpecialtyCities.length > 0 && (
              <div className="states-with-specialty">
                <h3>{isCatholic ? 'Nearby Catholic Programs' : `Nearby ${specialty.name} Counseling`}</h3>
                <div className="state-pills">
                  {nearbySpecialtyCities.map((cityItem) => (
                    <Link
                      key={cityItem.slug}
                      to={`/premarital-counseling/${specialtySlug}/${stateSlug}/${cityItem.slug}`}
                      className="state-pill"
                    >
                      {cityItem.name}
                    </Link>
                  ))}
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
                title={`${specialty.name} Counseling in ${cityName} — FAQ`}
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
              <h3>{isCatholic ? `Find a Catholic Program in ${cityName}` : `Find a ${specialty.name} Counselor in ${cityName}`}</h3>
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
                professionalName={isCatholic ? `Catholic Programs in ${cityName}` : `${specialty.name} Counselors in ${cityName}`}
                isSpecialtyMatching={true}
                specialtyType={specialty.name}
                stateName={stateName}
                cityName={cityName}
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

export default SpecialtyCityPage
