import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { generateSlug } from '../lib/utils'
import { formatLocation, formatPhoneNumber } from '../lib/utils'
import LeadContactForm from '../components/leads/LeadContactForm'
import Breadcrumbs, { generateBreadcrumbs } from '../components/common/Breadcrumbs'
import SEOHelmet, { generateProfessionalStructuredData } from '../components/analytics/SEOHelmet'
import { trackProfileView } from '../components/analytics/GoogleAnalytics'
import { trackFacebookProfileView } from '../components/analytics/FacebookPixel'
import { STATE_CONFIG } from '../data/locationConfig'

import { profileOperations, clickTrackingOperations } from '../lib/supabaseClient'
import UnclaimedProfileBanner from '../components/profiles/UnclaimedProfileBanner'
import '../assets/css/profile-page-enhanced.css'

// Helper: Convert state abbreviation to slug (OH -> ohio)
const getStateSlugFromAbbr = (abbr) => {
  if (!abbr) return null
  const normalized = String(abbr).toUpperCase()
  const entry = Object.entries(STATE_CONFIG).find(([_, config]) => config.abbr === normalized)
  return entry ? entry[0] : generateSlug(abbr)
}

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

const hasAvailabilityData = (value) => {
  if (value === true || value === false) return true
  if (typeof value === 'number') return value === 0 || value === 1
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return ['true', 'false', '1', '0', 'yes', 'no'].includes(normalized)
  }
  return false
}

const formatSessionTypeLabel = (value) => {
  if (!value) return null
  const normalized = String(value).trim().toLowerCase()
  if (!normalized) return null
  if (normalized === 'online') return 'Online'
  if (normalized === 'hybrid') return 'Hybrid'
  if (normalized === 'in-person' || normalized === 'in person' || normalized === 'inperson') return 'In-Person'
  if (normalized === 'virtual') return 'Virtual'

  return normalized.replace(/\b\w/g, (character) => character.toUpperCase())
}

const getSessionFormatLabel = (sessionTypes = []) => {
  if (!sessionTypes.length) return 'Not listed'
  return sessionTypes
    .map((sessionType) => formatSessionTypeLabel(sessionType))
    .filter(Boolean)
    .join(', ')
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
  return 'Not listed'
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
  if (/\bLPC\b/.test(text)) {
    return String(profile?.state_province || '').toUpperCase() === 'CA' ? 'LPCC' : 'LPC'
  }
  if (/\bLMHC\b/.test(text)) return 'LMHC'
  if (/PSYCHOLOGIST|PSY\.D|PSYD|PHD/.test(text)) return 'Psychologist'
  return null
}

const getAvailabilityLabel = (profile) => {
  if (!profile?.is_claimed) return 'Availability unverified'
  if (!hasAvailabilityData(profile?.accepting_new_clients)) return 'Availability not listed'
  if (toBooleanFlag(profile?.accepting_new_clients)) return 'Accepting new clients'
  return 'Limited availability'
}

const isMissingDescriptor = (value) => {
  if (!value) return true
  const normalized = String(value).trim().toLowerCase()
  return ['not listed', 'not provided', 'availability unverified', 'availability not listed'].includes(normalized)
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
      // Track view in Supabase for professional dashboards
      clickTrackingOperations.logProfileClick({
        profileId: profile.id,
        city: profile.city || 'unknown',
        state: profile.state_province || 'unknown',
        source: 'profile_page'
      }).catch(() => {}) // Silent fail - don't break page for tracking
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
      <>
        <SEOHelmet
          title="Loading Profile | Premarital Counseling"
          canonicalUrl={`https://www.weddingcounselors.com${window.location.pathname.replace(/\/+$/, '') || '/'}`}
          url={window.location.pathname}
          noindex={false}
        />
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </>
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
  // Normalize state slug: convert abbreviations (mn -> minnesota) for breadcrumb URLs
  const normalizedStateSlug = profile?.state_province
    ? getStateSlugFromAbbr(profile.state_province)
    : (state || generateSlug(stateName))
  const breadcrumbItems = stateName && profile
    ? generateBreadcrumbs.profilePage(
      stateName,
      profile.full_name,
      `/premarital-counseling/${normalizedStateSlug}`,
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
  const sessionTypesRaw = uniqueValues(asArray(profile?.session_types))
  const sessionTypes = uniqueValues(
    sessionTypesRaw
      .map((sessionType) => formatSessionTypeLabel(sessionType))
      .filter(Boolean)
  )
  const credentials = uniqueValues(asArray(profile?.credentials))
  const certifications = uniqueValues(asArray(profile?.certifications))
  const education = uniqueValues(asArray(profile?.education))
  const insuranceAccepted = uniqueValues(asArray(profile?.insurance_accepted))
  const paymentMethods = uniqueValues(asArray(profile?.payment_methods))
  const faithTraditionLabel = formatFaithTradition(profile?.faith_tradition)
  const hasOnlineOption = sessionTypesRaw.some((sessionType) => /online|virtual|hybrid/i.test(String(sessionType)))
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
      answer: 'Ask whether this professional offers a specific premarital program or general couples counseling.'
    },
    {
      question: 'What does a typical timeline look like?',
      answer: 'Ask how many sessions they recommend and whether the timeline can be adjusted to your wedding date.'
    },
    {
      question: 'What program methods are used?',
      answer: 'Ask which methods or assessments they personally use and how those are applied in sessions.'
    },
    {
      question: 'What should we clarify before booking?',
      answer: 'Confirm session format, pricing, insurance, and current availability before booking.'
    }
  ]
  const faqItems = providerFaqItems.length > 0 ? providerFaqItems : fallbackFaqItems

  const premaritalMethods = uniqueValues(
    [
      ...treatmentApproaches.filter((item) => /gottman|eft|prepare|enrich|foccus|symbis|pre-cana|faith/i.test(String(item))),
      ...certifications.filter((item) => /gottman|eft|prepare|enrich|foccus|symbis|pre-cana|faith/i.test(String(item)))
    ]
  )

  const explicitPremaritalSpecialty = specialties.find((item) => /premarital|pre[-\s]?marriage|marriage prep/i.test(String(item)))
  const listedClientFocus = clientFocus.length > 0 ? clientFocus.slice(0, 3).join(', ') : null
  const listedTopics = specialties.length > 0 ? specialties.slice(0, 5).join(', ') : null

  const sessionFormatLabel = getSessionFormatLabel(sessionTypes)
  const insuranceLabel = insuranceAccepted.length > 0 ? insuranceAccepted.join(', ') : 'Not listed'
  const pricingLabel = getPricingLabel(profile)
  const licenseType = getPrimaryLicenseType(profile, credentials, certifications)
  const licenseTypeLabel = licenseType ? `${licenseType} (${profile.state_province || stateName || 'State'})` : null
  const licenseLabel = credentials.length > 0 ? credentials.join(', ') : 'Not listed'
  const professionLabel = (() => {
    const profession = profile?.profession || 'Premarital Counselor'
    if (!licenseType) {
      if (/licensed therapist/i.test(profession)) return 'Therapist (license not listed)'
      if (/therapist|counselor|psychologist|social worker/i.test(profession)) {
        return `${profession} (license not listed)`
      }
      return profession
    }
    const generic = /licensed therapist|therapist|counselor/i.test(profession)
    const alreadyIncludes = profession.toUpperCase().includes(licenseType)
    if (generic && !alreadyIncludes) {
      return `${profession} (${licenseType})`
    }
    return profession
  })()
  const availabilityLabel = getAvailabilityLabel(profile)
  const methodsLabel = premaritalMethods.length > 0 ? premaritalMethods.join(', ') : 'Not provided'
  const programStructureLabel = premaritalMethods.length > 0
    ? `Structured sessions using ${methodsLabel}`
    : 'Not provided'

  const logisticsItems = [
    { key: 'specialty', label: 'Listed specialty', value: explicitPremaritalSpecialty, missingLabel: null },
    { key: 'client-focus', label: 'Client focus', value: listedClientFocus, missingLabel: 'client focus' },
    { key: 'methods', label: 'Program methods', value: isMissingDescriptor(methodsLabel) ? null : methodsLabel, missingLabel: 'program methods' },
    { key: 'program-structure', label: 'Program structure', value: isMissingDescriptor(programStructureLabel) ? null : programStructureLabel, missingLabel: 'program structure' },
    { key: 'topics', label: 'Topics covered', value: listedTopics, missingLabel: 'topics covered' },
    { key: 'session-format', label: 'Session format', value: isMissingDescriptor(sessionFormatLabel) ? null : sessionFormatLabel, missingLabel: 'session format' },
    { key: 'pricing', label: 'Pricing', value: isMissingDescriptor(pricingLabel) ? null : pricingLabel, missingLabel: 'session fees' },
    { key: 'insurance', label: 'Insurance', value: isMissingDescriptor(insuranceLabel) ? null : insuranceLabel, missingLabel: 'insurance' },
    { key: 'availability', label: 'Availability', value: isMissingDescriptor(availabilityLabel) ? null : availabilityLabel, missingLabel: 'availability' },
    { key: 'license', label: 'License / credential', value: isMissingDescriptor(licenseLabel) ? null : licenseLabel, missingLabel: 'license' }
  ]

  const providedLogisticsItems = logisticsItems.filter((item) => !isMissingDescriptor(item.value))
  const quickFacts = [
    { label: 'License type', value: licenseTypeLabel },
    { label: 'Session format', value: sessionFormatLabel },
    { label: 'Typical pricing', value: pricingLabel },
    { label: 'Insurance', value: insuranceAccepted.length > 0 ? 'Accepted' : null }
  ].filter((fact) => !isMissingDescriptor(fact.value))

  const sidebarFacts = [
    profile.years_experience ? { label: 'Experience', value: `${profile.years_experience}+ years` } : null,
    !isMissingDescriptor(availabilityLabel) ? { label: 'Status', value: availabilityLabel } : null,
    !isMissingDescriptor(sessionFormatLabel) ? { label: 'Session format', value: sessionFormatLabel } : null,
    !isMissingDescriptor(pricingLabel) ? { label: 'Pricing', value: pricingLabel } : null,
    insuranceAccepted.length > 0 ? { label: 'Insurance', value: 'Accepted plans listed' } : null
  ].filter(Boolean)

  const shouldCollapseLogistics = providedLogisticsItems.length < 3
  const availabilityIsVerified = availabilityLabel === 'Accepting new clients' || availabilityLabel === 'Limited availability'

  const hasPricingSection =
    Boolean(profile?.pricing_range) ||
    insuranceAccepted.length > 0 ||
    paymentMethods.length > 0 ||
    freeConsultationEnabled ||
    slidingScaleEnabled

  // Ensure website has protocol for external links
  const websiteUrl = profile?.website
    ? (profile.website.startsWith('http://') || profile.website.startsWith('https://'))
      ? profile.website
      : `https://${profile.website}`
    : null

  // Build canonical URL with normalized state/city slugs to avoid duplicates
  // Use full state name (ohio) not abbreviation (oh) for canonical
  const canonicalPath = profile?.state_province && profile?.city && profile?.slug
    ? `/premarital-counseling/${getStateSlugFromAbbr(profile.state_province)}/${generateSlug(profile.city)}/${profile.slug}`
    : window.location.pathname

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
        faqs={providerFaqItems.length > 0 ? providerFaqItems : null}
        canonicalUrl={`https://www.weddingcounselors.com${canonicalPath}`}
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
                  {availabilityIsVerified && <span>{availabilityLabel}</span>}
                </div>

                {quickFacts.length > 0 && (
                  <div className="profile-premium-quickfacts">
                    {quickFacts.map((fact) => (
                      <div key={fact.label} className="profile-premium-quickfact">
                        <span>{fact.label}</span>
                        <strong>{fact.value}</strong>
                      </div>
                    ))}
                  </div>
                )}

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
                {websiteUrl && (
                  <a
                    href={websiteUrl}
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
                          {firstName} is listed as a {professionLabel || 'premarital counseling professional'} in {profile.city}, {profile.state_province}. Public profile details are currently limited.
                        </p>
                        <p className="profile-note-inline">
                          This profile has limited public details. If this is your listing,{' '}
                          <Link to={`/claim-profile/${profile.slug || profile.id}`}>claim your profile</Link> to update it.
                        </p>
                      </>
                    )}
                  </div>
                  {(explicitPremaritalSpecialty || premaritalMethods.length > 0) && (
                    <p className="profile-premarital-note">
                      {explicitPremaritalSpecialty
                        ? `Listed specialty: ${explicitPremaritalSpecialty}. `
                        : 'Listed as a couples-focused provider. '}
                      {premaritalMethods.length > 0
                        ? `Methods listed: ${premaritalMethods.join(', ')}.`
                        : 'Program methods are not listed.'}
                    </p>
                  )}
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
                  <p className="profile-data-note">
                    Only details provided on this profile are shown below.
                  </p>
                  {shouldCollapseLogistics ? (
                    <div className="profile-checklist-grid">
                      <div className="profile-checklist-column">
                        <h3>What&apos;s listed</h3>
                        {providedLogisticsItems.length > 0 ? (
                          <ul className="profile-checklist profile-checklist-provided">
                            {providedLogisticsItems.map((item) => (
                              <li key={item.key}>
                                <strong>{item.label}:</strong> {item.value}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="profile-checklist-empty">No structured details listed yet.</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="profile-detail-stack">
                      {providedLogisticsItems.map((item) => (
                        <div key={item.key} className="profile-detail-row">
                          <span>{item.label}</span>
                          <strong>{item.value}</strong>
                        </div>
                      ))}
                    </div>
                  )}
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
                    </div>
                  </section>
                )}
              </main>

              <aside className="profile-premium-side">
                <section className="profile-premium-card profile-premium-card-emphasis">
                  <h2>Work with {firstName}</h2>
                  <div className="profile-kpi-list">
                    {sidebarFacts.map((fact) => (
                      <div key={fact.label} className="profile-kpi-row">
                        <span>{fact.label}</span>
                        <strong>{fact.value}</strong>
                      </div>
                    ))}
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
                </section>

                <section id="contact-section" className="profile-premium-card profile-contact-card">
                  <h2>Send a Message</h2>
                  {!profile.is_claimed && (
                    <p className="profile-contact-note">
                      This provider has not verified profile details yet. Your message is forwarded to the public contact email on file when available, or to directory support for follow-up.
                    </p>
                  )}
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

                      {websiteUrl && (
                        <div className="profile-contact-row">
                          <span>Website</span>
                          <a
                            href={websiteUrl}
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
                        to={`/premarital-counseling/${normalizedStateSlug}/${generateSlug(profile.city)}`}
                        className="profile-link-row"
                      >
                        Premarital counseling in {profile.city}
                      </Link>
                      <Link
                        to={`/premarital-counseling/${normalizedStateSlug}`}
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
                      Claim this profile to verify license, fees, and availability, then manage inquiries in your dashboard.
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
