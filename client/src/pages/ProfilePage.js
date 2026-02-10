import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { generateSlug } from '../lib/utils'
import { formatLocation, formatPhoneNumber } from '../lib/utils'
import LeadContactForm from '../components/leads/LeadContactForm'
import Breadcrumbs, { generateBreadcrumbs } from '../components/common/Breadcrumbs'
import SEOHelmet, { generateProfessionalStructuredData } from '../components/analytics/SEOHelmet'
import { trackProfileView } from '../components/analytics/GoogleAnalytics'
import { trackFacebookProfileView } from '../components/analytics/FacebookPixel'

import { profileOperations } from '../lib/supabaseClient'
import UnclaimedProfileBanner from '../components/profiles/UnclaimedProfileBanner'
import '../assets/css/profile-page-enhanced.css'

const asArray = (value) => {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => (typeof item === 'string' ? item.trim() : item))
    .filter(Boolean)
}

const uniqueValues = (values) => {
  const seen = new Set()

  return values.filter((value) => {
    const normalized = String(value).toLowerCase()
    if (seen.has(normalized)) return false
    seen.add(normalized)
    return true
  })
}

const formatFaithTradition = (value) => {
  if (!value) return null
  if (value === 'all-faiths') return 'All faiths welcome'
  if (value === 'secular') return 'Secular / non-religious'
  return value
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

const toBooleanFlag = (value) => {
  if (typeof value === 'boolean') return value
  if (value == null) return false
  if (typeof value === 'number') return value !== 0

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (!normalized) return false
    if (['false', '0', 'no', 'none', 'null', 'n/a'].includes(normalized)) return false
    return true
  }

  return Boolean(value)
}

const getSessionFormatLabel = (sessionTypes = []) => {
  if (!sessionTypes.length) return 'Ask about online and in-person options'
  return sessionTypes.join(', ')
}

const getPricingLabel = (profile) => {
  const minCents = Number(profile?.session_fee_min)
  const maxCents = Number(profile?.session_fee_max)
  const min = minCents > 0 ? Math.round(minCents / 100) : null
  const max = maxCents > 0 ? Math.round(maxCents / 100) : null

  if (profile?.pricing_range) return String(profile.pricing_range)
  if (min && max) return `$${min}-$${max} per session`
  if (min) return `$${min}+ per session`
  if (max) return `Up to $${max} per session`
  return 'Ask about session fees'
}

const getPrimaryLicenseType = (profile, credentials = [], certifications = []) => {
  const text = [
    profile?.profession,
    ...credentials,
    ...certifications
  ]
    .filter(Boolean)
    .join(' ')
    .toUpperCase()

  if (/\bLMFT\b/.test(text)) return 'LMFT'
  if (/\bLPCC\b/.test(text)) return 'LPCC'
  if (/\bLCSW\b/.test(text)) return 'LCSW'
  if (/\bLPC\b/.test(text)) return 'LPC'
  if (/\bLMHC\b/.test(text)) return 'LMHC'
  if (/PSYCHOLOGIST|PSY\.D|PSYD|PHD/.test(text)) return 'Psychologist'
  return null
}

const getAvailabilityLabel = (profile) => {
  if (!profile?.is_claimed) return 'Availability unverified'
  if (profile?.accepting_new_clients) return 'Accepting new clients'
  return 'Limited availability'
}

const ProfilePage = ({ stateOverride, cityOverride, profileSlugOverride }) => {
  const params = useParams()
  const state = stateOverride || params.state
  const city = cityOverride || params.city
  const profileSlug = profileSlugOverride || params.profileSlug
  const slugOrId = params.slugOrId

  const currentSlug = profileSlug || slugOrId
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [phoneRevealed, setPhoneRevealed] = useState(false)
  const [emailRevealed, setEmailRevealed] = useState(false)
  const [imageError, setImageError] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const canShowDirectContact = profile?.tier === 'local_featured' || profile?.tier === 'area_spotlight'
  const claimQueryParam = new URLSearchParams(location.search).get('claim')
  const shouldShowClaimPrompts = ['1', 'true', 'yes'].includes(String(claimQueryParam || '').toLowerCase()) || Boolean(location.state?.showClaimCta)

  useEffect(() => {
    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSlug])

  useEffect(() => {
    if (profile) {
      document.title = `${profile.full_name} - ${profile.profession} | Premarital Counseling Directory`
    }
  }, [profile])

  useEffect(() => {
    if (profile && !state) {
      const stateSlug = profile.state_province ? generateSlug(profile.state_province) : null
      const citySlug = profile.city ? generateSlug(profile.city) : null
      const normalizedProfileSlug = profile.slug || generateSlug(profile.full_name)

      if (stateSlug && citySlug && normalizedProfileSlug) {
        navigate(`/premarital-counseling/${stateSlug}/${citySlug}/${normalizedProfileSlug}`, { replace: true })
      } else if (stateSlug && normalizedProfileSlug) {
        navigate(`/premarital-counseling/${stateSlug}/${normalizedProfileSlug}`, { replace: true })
      }
    }
  }, [profile, state, city, navigate])

  useEffect(() => {
    if (profile) {
      trackProfileView(profile.full_name, profile.city, profile.state_province)
      trackFacebookProfileView(profile.full_name)
    }
  }, [profile])

  const loadProfile = async () => {
    try {
      setLoading(true)
      setError(null)

      let { data, error: getProfileError } = await profileOperations.getProfile(currentSlug)

      if (getProfileError || !data) {
        const searchTerm = currentSlug.replace(/-/g, ' ')
        const searchResult = await profileOperations.searchProfiles(searchTerm)

        if (searchResult.data && searchResult.data.length > 0) {
          data = searchResult.data[0]
          getProfileError = null
        }
      }

      if (getProfileError) {
        setError(getProfileError.message)
      } else if (!data) {
        setError('Profile not found')
      } else {
        setProfile(data)
      }
    } catch (err) {
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleLeadSuccess = (leadData) => {
    console.log('Lead submitted successfully:', leadData)
  }

  const handleRevealContact = async (type) => {
    try {
      await profileOperations.logContactReveal({
        profile_id: profile.id,
        reveal_type: type,
        ip_address: null,
        user_agent: navigator.userAgent,
        session_id: sessionStorage.getItem('session_id') || null,
        city: profile.city || city || null,
        state_province: profile.state_province || state || null,
        page_url: window.location.href,
        referrer: document.referrer || null
      })

      if (type === 'phone') setPhoneRevealed(true)
      if (type === 'email') setEmailRevealed(true)
    } catch (err) {
      console.error('Failed to log reveal:', err)
      if (type === 'phone') setPhoneRevealed(true)
      if (type === 'email') setEmailRevealed(true)
    }
  }

  const scrollToContact = () => {
    document.getElementById('contact-section')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container" style={{ padding: 'var(--space-20) 0', textAlign: 'center' }}>
        <h2>Profile Not Found</h2>
        <p className="text-secondary mb-8">
          {error === 'Profile not found'
            ? 'The profile you\'re looking for doesn\'t exist or may have been removed.'
            : 'We encountered an error while loading this profile.'}
        </p>
        <Link to="/" className="btn btn-primary">
          Browse All Professionals
        </Link>
      </div>
    )
  }

  const stateName = profile?.state_province || (state ? state.replace(/-/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase()) : null)
  const breadcrumbItems = stateName && profile
    ? generateBreadcrumbs.profilePage(
      stateName,
      profile.full_name,
      `/premarital-counseling/${state || generateSlug(stateName)}`,
      null
    )
    : generateBreadcrumbs.profilePage(
      'All Locations',
      profile?.full_name || 'Profile',
      '/premarital-counseling',
      null
    )

  const firstName = profile?.full_name?.split(' ')[0] || 'Professional'
  const specialties = uniqueValues(asArray(profile?.specialties))
  const treatmentApproaches = uniqueValues(asArray(profile?.treatment_approaches))
  const clientFocus = uniqueValues(asArray(profile?.client_focus))
  const languages = uniqueValues(asArray(profile?.languages))
  const sessionTypes = uniqueValues(asArray(profile?.session_types))
  const credentials = uniqueValues(asArray(profile?.credentials))
  const certifications = uniqueValues(asArray(profile?.certifications))
  const education = uniqueValues(asArray(profile?.education))
  const insuranceAccepted = uniqueValues(asArray(profile?.insurance_accepted))
  const paymentMethods = uniqueValues(asArray(profile?.payment_methods))
  const faithTraditionLabel = formatFaithTradition(profile?.faith_tradition)
  const hasOnlineOption = sessionTypes.some((sessionType) => /online|virtual|hybrid/i.test(sessionType))
  const slidingScaleEnabled = toBooleanFlag(profile?.sliding_scale)
  const freeConsultationEnabled = toBooleanFlag(profile?.offers_free_consultation)

  const focusGroups = [
    { label: 'Specialties', items: specialties },
    { label: 'Approach', items: treatmentApproaches },
    { label: 'Client Focus', items: clientFocus },
    { label: 'Languages', items: languages },
    { label: 'Session Format', items: sessionTypes },
    { label: 'Faith', items: faithTraditionLabel ? [faithTraditionLabel] : [] }
  ].filter((group) => group.items.length > 0)

  const credentialGroups = [
    { label: 'Credentials', items: credentials },
    { label: 'Certifications', items: certifications },
    { label: 'Education', items: education }
  ].filter((group) => group.items.length > 0)

  const providerFaqItems = Array.isArray(profile?.faqs)
    ? profile.faqs
      .filter((faq) => faq?.question && faq?.answer)
      .map((faq) => ({
        question: String(faq.question).trim(),
        answer: String(faq.answer).trim()
      }))
      .filter((faq) => faq.question && faq.answer)
    : []

  const fallbackFaqItems = [
    {
      question: `How premarital-focused is ${firstName}'s work?`,
      answer: 'Ask whether your sessions will follow a structured premarital curriculum with clear goals before the wedding.'
    },
    {
      question: 'What does a typical timeline look like?',
      answer: 'Most couples complete 5-8 sessions over 2-3 months, but timeline should match your wedding date and scheduling needs.'
    },
    {
      question: 'What program methods are used?',
      answer: 'Ask about assessments and methods (for example Gottman, PREPARE/ENRICH, EFT, or faith-based frameworks) and how those tools are applied.'
    },
    {
      question: 'What should we clarify before booking?',
      answer: 'Confirm session format, pricing, availability, and whether this professional is currently accepting new premarital clients.'
    }
  ]
  const faqItems = providerFaqItems.length > 0 ? providerFaqItems : fallbackFaqItems

  const premaritalMethods = uniqueValues(
    [
      ...treatmentApproaches.filter((item) => /gottman|eft|prepare|enrich|foccus|symbis|pre-cana|faith/i.test(String(item))),
      ...certifications.filter((item) => /gottman|eft|prepare|enrich|foccus|symbis|pre-cana|faith/i.test(String(item)))
    ]
  )

  const programFitAudience = clientFocus.length > 0
    ? clientFocus.slice(0, 3).join(', ')
    : 'Engaged couples preparing for marriage'

  const programTopics = specialties.length > 0
    ? specialties.slice(0, 5).join(', ')
    : 'Communication, conflict resolution, finances, values, and relationship expectations'

  const sessionFormatLabel = getSessionFormatLabel(sessionTypes)
  const insuranceLabel = insuranceAccepted.length > 0 ? insuranceAccepted.join(', ') : 'Ask about accepted plans'
  const pricingLabel = getPricingLabel(profile)
  const licenseType = getPrimaryLicenseType(profile, credentials, certifications)
  const licenseTypeLabel = licenseType ? `${licenseType} (${profile.state_province || stateName || 'State'})` : null
  const licenseLabel = credentials.length > 0 ? credentials.join(', ') : 'License details available on request'
  const professionLabel = (() => {
    const profession = profile?.profession || 'Premarital Counselor'
    if (!licenseType) return profession
    const generic = /licensed therapist|therapist|counselor/i.test(profession)
    const alreadyIncludes = profession.toUpperCase().includes(licenseType)
    if (generic && !alreadyIncludes) {
      return `${profession} (${licenseType})`
    }
    return profession
  })()
  const availabilityLabel = getAvailabilityLabel(profile)
  const methodsLabel = premaritalMethods.length > 0 ? premaritalMethods.join(', ') : 'Customized framework based on your goals'
  const hasExplicitPremaritalSpecialty = specialties.some((item) => /premarital|pre[-\s]?marriage|marriage prep/i.test(String(item)))
  const programStructureLabel = premaritalMethods.length > 0
    ? `Structured sessions using ${methodsLabel}`
    : 'Customized premarital sessions with timeline and goals set in your first visit'

  const premaritalFitSignals = [
    hasExplicitPremaritalSpecialty ? 'Lists premarital counseling as a specialty' : null,
    premaritalMethods.length > 0 ? `Uses evidence-based methods (${methodsLabel})` : null,
    hasOnlineOption ? 'Online sessions available for easier scheduling' : null,
    availabilityLabel === 'Accepting new clients' ? 'Currently accepting new premarital clients' : null,
    profile.years_experience ? `${profile.years_experience}+ years of experience` : null
  ].filter(Boolean)

  if (premaritalFitSignals.length === 0) {
    premaritalFitSignals.push('Focuses on communication, conflict tools, and marriage preparation goals')
  }

  const quickFacts = [
    { label: 'Session format', value: sessionFormatLabel },
    { label: 'Typical pricing', value: pricingLabel },
    { label: 'Insurance', value: insuranceAccepted.length > 0 ? 'Accepted' : 'Not listed' },
    { label: 'License type', value: licenseTypeLabel || 'Not listed' }
  ]

  const hasPricingSection =
    Boolean(profile?.pricing_range) ||
    insuranceAccepted.length > 0 ||
    paymentMethods.length > 0 ||
    freeConsultationEnabled ||
    slidingScaleEnabled

  return (
    <>
      <SEOHelmet
        title={`${profile?.full_name} - ${profile?.profession}${profile?.city && stateName ? ` in ${profile.city}, ${stateName}` : ''} | Premarital Counseling`}
        description={`Connect with ${profile?.full_name}, a qualified ${profile?.profession}${profile?.city && stateName ? ` in ${profile.city}, ${stateName}` : ''}. ${profile?.bio ? `${profile.bio.substring(0, 150)}...` : 'Specializing in premarital counseling for engaged couples.'}`}
        url={window.location.pathname}
        type="profile"
        structuredData={profile ? generateProfessionalStructuredData(profile) : null}
        professional={profile}
        keywords={`${profile?.profession}, premarital counseling, ${profile?.city}, ${profile?.state_province}, ${specialties.join(', ')}`}
        breadcrumbs={breadcrumbItems}
        canonicalUrl={`https://www.weddingcounselors.com${window.location.pathname}`}
        noindex={false}
      />

      <div className="profile-page profile-premium">
        {profile && !profile.is_claimed && shouldShowClaimPrompts && (
          <UnclaimedProfileBanner
            profile={profile}
            viewCount={null}
          />
        )}

        <section className="profile-premium-shell">
          <div className="container">
            <Breadcrumbs items={breadcrumbItems} className="profile-premium-breadcrumbs" />

            <header className="profile-premium-hero">
              <div className="profile-premium-photo-wrap">
                {profile.photo_url && !imageError ? (
                  <img
                    src={profile.photo_url}
                    alt={profile.full_name}
                    className="profile-premium-photo"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="profile-premium-photo profile-premium-photo-placeholder">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                )}
                {(profile.tier === 'local_featured' || profile.tier === 'area_spotlight') && (
                  <span className="profile-premium-badge">
                    {profile.tier === 'area_spotlight' ? 'Area Spotlight' : `Featured in ${profile.city}`}
                  </span>
                )}
              </div>

              <div className="profile-premium-identity">
                <p className="profile-premium-eyebrow">Professional Profile</p>
                <h1>{profile.full_name}</h1>
                <p className="profile-premium-role">
                  {professionLabel}
                  {profile.pronouns ? ` (${profile.pronouns})` : ''}
                </p>

                <div className="profile-premium-meta">
                  <span>{formatLocation(profile)}</span>
                  {profile.years_experience && <span>{profile.years_experience}+ years experience</span>}
                  <span>{availabilityLabel}</span>
                </div>

                <div className="profile-premium-quickfacts">
                  {quickFacts.map((fact) => (
                    <div key={fact.label} className="profile-premium-quickfact">
                      <span>{fact.label}</span>
                      <strong>{fact.value}</strong>
                    </div>
                  ))}
                </div>

                {specialties.length > 0 && (
                  <div className="profile-premium-top-tags">
                    {specialties.slice(0, 6).map((specialty) => (
                      <span key={specialty} className="profile-chip">
                        {specialty}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="profile-premium-hero-actions">
                <button onClick={scrollToContact} className="btn btn-primary">
                  Send Message
                </button>
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    className="btn btn-outline"
                  >
                    External Website
                  </a>
                )}
              </div>
            </header>

            <div className="profile-premium-grid">
              <main className="profile-premium-main">
                <section className="profile-premium-card">
                  <h2>About {firstName}</h2>
                  <div className="profile-prose">
                    {profile.bio ? (
                      profile.bio
                        .split('\n')
                        .map((paragraph) => paragraph.trim())
                        .filter(Boolean)
                        .map((paragraph, index) => (
                          <p key={index}>{paragraph}</p>
                        ))
                    ) : (
                      <>
                        <p>
                          {firstName} is a {professionLabel || 'premarital counseling professional'} serving couples in {profile.city}, {profile.state_province}.
                          {profile.years_experience ? ` With ${profile.years_experience} years of experience, ` : ' '}
                          the focus is practical preparation for long-term relationship health.
                        </p>
                        <p className="profile-note-inline">
                          This profile has limited public details. If this is your listing,{' '}
                          <Link to={`/claim-profile/${profile.slug || profile.id}`}>claim your profile</Link> to update it.
                        </p>
                      </>
                    )}
                  </div>
                </section>

                {profile.approach && (
                  <section className="profile-premium-card">
                    <h2>Approach</h2>
                    <div className="profile-prose">
                      {profile.approach
                        .split('\n')
                        .map((paragraph) => paragraph.trim())
                        .filter(Boolean)
                        .map((paragraph, index) => (
                          <p key={index}>{paragraph}</p>
                        ))}
                    </div>
                  </section>
                )}

                <section className="profile-premium-card">
                  <h2>Premarital Fit & Logistics</h2>
                  <div className="profile-detail-stack">
                    <div className="profile-detail-row">
                      <span>Best fit for</span>
                      <strong>{programFitAudience}</strong>
                    </div>
                    <div className="profile-detail-row">
                      <span>Session format</span>
                      <strong>{sessionFormatLabel}</strong>
                    </div>
                    <div className="profile-detail-row">
                      <span>Program methods</span>
                      <strong>{methodsLabel}</strong>
                    </div>
                    <div className="profile-detail-row">
                      <span>Program structure</span>
                      <strong>{programStructureLabel}</strong>
                    </div>
                    <div className="profile-detail-row">
                      <span>Topics covered</span>
                      <strong>{programTopics}</strong>
                    </div>
                    <div className="profile-detail-row">
                      <span>Pricing</span>
                      <strong>{pricingLabel}</strong>
                    </div>
                    <div className="profile-detail-row">
                      <span>Insurance</span>
                      <strong>{insuranceLabel}</strong>
                    </div>
                    <div className="profile-detail-row">
                      <span>Availability</span>
                      <strong>{availabilityLabel}</strong>
                    </div>
                    <div className="profile-detail-row">
                      <span>License / credential</span>
                      <strong>{licenseLabel}</strong>
                    </div>
                  </div>
                  <ul className="profile-fit-signal-list">
                    {premaritalFitSignals.slice(0, 4).map((signal) => (
                      <li key={signal}>{signal}</li>
                    ))}
                  </ul>
                </section>

                {focusGroups.length > 0 && (
                  <section className="profile-premium-card">
                    <h2>Practice Focus</h2>
                    <div className="profile-group-stack">
                      {focusGroups.map((group) => (
                        <div key={group.label} className="profile-group-row">
                          <h3>{group.label}</h3>
                          <div className="profile-chip-list">
                            {group.items.map((item) => (
                              <span key={`${group.label}-${item}`} className="profile-chip profile-chip-soft">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {credentialGroups.length > 0 && (
                  <section className="profile-premium-card">
                    <h2>Credentials</h2>
                    <div className="profile-group-stack">
                      {credentialGroups.map((group) => (
                        <div key={group.label} className="profile-group-row">
                          <h3>{group.label}</h3>
                          <ul className="profile-list-clean">
                            {group.items.map((item) => (
                              <li key={`${group.label}-${item}`}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {hasPricingSection && (
                  <section className="profile-premium-card">
                    <h2>Pricing & Availability</h2>
                    <div className="profile-detail-stack">
                      {profile.pricing_range && (
                        <div className="profile-detail-row">
                          <span>Session Fees</span>
                          <strong>{profile.pricing_range}</strong>
                        </div>
                      )}
                      {insuranceAccepted.length > 0 && (
                        <div className="profile-detail-row profile-detail-row-wrap">
                          <span>Insurance</span>
                          <div className="profile-chip-list">
                            {insuranceAccepted.map((insurance) => (
                              <span key={insurance} className="profile-chip profile-chip-soft">
                                {insurance}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {paymentMethods.length > 0 && (
                        <div className="profile-detail-row profile-detail-row-wrap">
                          <span>Payment Methods</span>
                          <div className="profile-chip-list">
                            {paymentMethods.map((method) => (
                              <span key={method} className="profile-chip profile-chip-soft">
                                {method}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {(freeConsultationEnabled || slidingScaleEnabled) && (
                      <div className="profile-status-row">
                        {freeConsultationEnabled && (
                          <span className="profile-status-pill">Free consultation</span>
                        )}
                        {slidingScaleEnabled && (
                          <span className="profile-status-pill">Sliding scale available</span>
                        )}
                      </div>
                    )}
                  </section>
                )}

                <section className="profile-premium-card">
                  <h2>{providerFaqItems.length > 0 ? 'Frequently Asked Questions' : 'Questions to Ask Before Booking'}</h2>
                  <div className="profile-faq-list">
                    {faqItems.map((faq) => (
                      <article key={faq.question} className="profile-faq-item">
                        <h3>{faq.question}</h3>
                        <p>{faq.answer}</p>
                      </article>
                    ))}
                  </div>
                </section>

                {profile.city && profile.state_province && (
                  <section className="profile-premium-card profile-premium-card-muted">
                    <h2>Premarital Counseling in {profile.city}, {profile.state_province}</h2>
                    <div className="profile-prose">
                      <p>
                        {firstName} serves couples in {profile.city} and nearby communities.
                        {hasOnlineOption ? ' Online sessions are available.' : ''}
                      </p>
                      <p>
                        Finding a strong fit matters. This profile highlights experience, focus areas, and logistics so couples can choose confidently.
                      </p>
                    </div>
                  </section>
                )}
              </main>

              <aside className="profile-premium-side">
                <section className="profile-premium-card profile-premium-card-emphasis">
                  <h2>Work with {firstName}</h2>
                  <div className="profile-kpi-list">
                    {profile.years_experience && (
                      <div className="profile-kpi-row">
                        <span>Experience</span>
                        <strong>{profile.years_experience}+ years</strong>
                      </div>
                    )}
                    <div className="profile-kpi-row">
                      <span>Status</span>
                      <strong>{availabilityLabel}</strong>
                    </div>
                    <div className="profile-kpi-row">
                      <span>Session format</span>
                      <strong>{sessionFormatLabel}</strong>
                    </div>
                    <div className="profile-kpi-row">
                      <span>Pricing</span>
                      <strong>{pricingLabel}</strong>
                    </div>
                    <div className="profile-kpi-row">
                      <span>Insurance</span>
                      <strong>{insuranceAccepted.length > 0 ? 'Accepted plans listed' : 'Ask for coverage details'}</strong>
                    </div>
                  </div>

                  {profile.booking_url ? (
                    <a
                      href={profile.booking_url}
                      target="_blank"
                      rel="nofollow noopener noreferrer"
                      className="btn btn-primary btn-full"
                    >
                      Book Consultation
                    </a>
                  ) : (
                    <button onClick={scrollToContact} className="btn btn-primary btn-full">
                      Send Message
                    </button>
                  )}
                  <p className="profile-response-note">
                    Most professionals reply within 1-2 business days.
                  </p>
                </section>

                <section id="contact-section" className="profile-premium-card profile-contact-card">
                  <h2>Send a Message</h2>
                  <LeadContactForm
                    profileId={profile.id}
                    professionalName={profile.full_name}
                    profile={profile}
                    isProfileClaimed={profile.is_claimed}
                    onSuccess={handleLeadSuccess}
                  />
                </section>

                {canShowDirectContact && (
                  <section className="profile-premium-card">
                    <h2>Direct Contact</h2>
                    <div className="profile-contact-list">
                      {profile.phone && (
                        <div className="profile-contact-row">
                          <span>Phone</span>
                          {phoneRevealed ? (
                            <a href={`tel:${profile.phone}`} className="profile-contact-link">
                              {formatPhoneNumber(profile.phone)}
                            </a>
                          ) : (
                            <button onClick={() => handleRevealContact('phone')} className="profile-reveal-btn">
                              Show phone
                            </button>
                          )}
                        </div>
                      )}

                      {profile.email && (
                        <div className="profile-contact-row">
                          <span>Email</span>
                          {emailRevealed ? (
                            <a href={`mailto:${profile.email}`} className="profile-contact-link">
                              {profile.email}
                            </a>
                          ) : (
                            <button onClick={() => handleRevealContact('email')} className="profile-reveal-btn">
                              Show email
                            </button>
                          )}
                        </div>
                      )}

                      {profile.website && (
                        <div className="profile-contact-row">
                          <span>Website</span>
                          <a
                            href={profile.website}
                            target="_blank"
                            rel="nofollow noopener noreferrer"
                            className="profile-contact-link"
                            onClick={() => handleRevealContact('website')}
                          >
                            Visit website
                          </a>
                        </div>
                      )}

                      {profile.address_line1 && (
                        <div className="profile-contact-row profile-contact-row-stack">
                          <span>Address</span>
                          <p>
                            {profile.address_line1}
                            <br />
                            {formatLocation(profile)} {profile.postal_code}
                          </p>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {profile.city && profile.state_province && (
                  <section className="profile-premium-card">
                    <h2>Explore More</h2>
                    <div className="profile-link-list">
                      <Link
                        to={`/premarital-counseling/${state || generateSlug(profile.state_province)}/${generateSlug(profile.city)}`}
                        className="profile-link-row"
                      >
                        Premarital counseling in {profile.city}
                      </Link>
                      <Link
                        to={`/premarital-counseling/${state || generateSlug(profile.state_province)}`}
                        className="profile-link-row"
                      >
                        Browse all {profile.state_province} counselors
                      </Link>
                    </div>
                  </section>
                )}

                {!profile.is_claimed && shouldShowClaimPrompts && (
                  <section className="profile-premium-card profile-premium-card-claim">
                    <h2>Is this your profile?</h2>
                    <p>
                      Claim this listing to update details, manage inquiries, and receive lead notifications.
                    </p>
                    <Link
                      to={`/claim-profile/${profile.slug || profile.id}`}
                      className="btn btn-primary btn-full"
                      onClick={() => {
                        if (window.gtag) {
                          window.gtag('event', 'click', {
                            event_category: 'Claim Profile',
                            event_label: 'Sidebar CTA',
                            value: profile.id
                          })
                        }
                      }}
                    >
                      Claim This Profile
                    </Link>
                    <small>Free to claim. No credit card required.</small>
                  </section>
                )}
              </aside>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

export default ProfilePage
