import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { generateSlug } from '../lib/utils'
import { formatLocation, formatPhoneNumber } from '../lib/utils'
import LeadContactForm from '../components/leads/LeadContactForm'
import Breadcrumbs, { generateBreadcrumbs } from '../components/common/Breadcrumbs'
import SEOHelmet, { generateProfessionalStructuredData } from '../components/analytics/SEOHelmet'
import { trackProfileView, trackContactSubmission } from '../components/analytics/GoogleAnalytics'
import { trackFacebookProfileView, trackFacebookLead } from '../components/analytics/FacebookPixel'
import { trackProfessionalContact } from '../components/analytics/GoogleAds'
import { STATE_CONFIG } from '../data/locationConfig'
import { SPECIALTY_CONFIG } from '../data/specialtyConfig'
import { getAttribution } from '../lib/attribution'

import { profileOperations, clickTrackingOperations } from '../lib/supabaseClient'
import UnclaimedProfileBanner from '../components/profiles/UnclaimedProfileBanner'
import NearbyProfessionals from '../components/profiles/NearbyProfessionals'
import ShareButton from '../components/common/ShareButton'
import UpgradeCTA from '../components/monetization/UpgradeCTA'
import '../assets/css/profile-wellness.css'
import '../assets/css/share-button.css'
import '../assets/css/share-button.css'

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

// Build a CTR-optimized meta title for profile pages (target: under 60 chars)
const buildProfileMetaTitle = (profile, { hasOnlineOption, stateName, specialties, treatmentApproaches, slug }) => {
  const city = profile?.city || ''
  const stAbbr = profile?.state_province || ''

  // Detect practice name from slug (e.g. "forest-city-counseling-675" → "Forest City Counseling")
  let displayName = profile?.full_name || 'Professional'
  if (slug) {
    const slugWithoutId = slug.replace(/-\d+$/, '')
    const titleCased = slugWithoutId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    if (/counseling|therapy|center|associates|wellness|services/i.test(titleCased) && titleCased.toLowerCase() !== displayName.toLowerCase()) {
      displayName = titleCased
    }
  }

  // Detect a notable method to surface in the title (Gottman is highest signal)
  const allMethods = [...(specialties || []), ...(treatmentApproaches || [])]
  const gottman = allMethods.some(m => /gottman/i.test(String(m)))
  const eft = allMethods.some(m => /\beft\b|emotionally focused/i.test(String(m)))
  const prepEnrich = allMethods.some(m => /prepare|enrich|foccus|symbis/i.test(String(m)))
  const methodTag = gottman ? 'Gottman' : eft ? 'EFT' : prepEnrich ? 'PREPARE/ENRICH' : null

  // Use em-dash for visual distinction in SERPs
  // Lead with name, add location + method signals, include action word
  let title = city
    ? `${displayName} — Premarital Counselor in ${city}, ${stAbbr}`
    : `${displayName} — Premarital Counselor`

  // Inject method if it fits and adds signal
  if (methodTag && city && `${displayName} (${methodTag}) — Premarital Counselor in ${city}, ${stAbbr}`.length <= 62) {
    title = `${displayName} (${methodTag}) — Premarital Counselor in ${city}, ${stAbbr}`
  }

  // Add CTA suffix for CTR on branded queries
  // "Book Online" for virtual-available profiles; "Contact Today" otherwise
  const ctaSuffix = hasOnlineOption ? 'Book Online' : 'Contact Today'
  if (title.length <= 48) {
    title = `${title} | ${ctaSuffix}`
  }

  return title
}

// Build a CTR-optimized meta description (target: 150-160 chars, action-oriented)
const buildProfileMetaDescription = (profile, {
  pricingLabel,
  insuranceAccepted,
  hasOnlineOption,
  freeConsultationEnabled,
  treatmentApproaches,
  slidingScaleEnabled,
  stateName
}) => {
  const parts = []
  const profession = profile?.profession || 'Premarital Counselor'
  const city = profile?.city || ''
  const stAbbr = profile?.state_province || ''

  // Lead with actionable profession + location
  if (city && stAbbr) {
    parts.push(`${profession} in ${city}, ${stAbbr} specializing in premarital counseling.`)
  } else {
    parts.push(`${profession} specializing in premarital counseling.`)
  }

  // Add top method if available
  const topMethod = treatmentApproaches.find((m) =>
    /gottman|eft|prepare|enrich|foccus|symbis/i.test(String(m))
  )
  if (topMethod) {
    parts.push(`${topMethod}-trained.`)
  }

  // Add pricing signal
  if (pricingLabel && pricingLabel !== 'Not listed') {
    parts.push(`${pricingLabel}.`)
  }

  // Insurance or self-pay signal
  if (insuranceAccepted.length > 0) {
    parts.push('Insurance accepted.')
  } else if (slidingScaleEnabled) {
    parts.push('Sliding scale available.')
  }

  // Free consultation
  if (freeConsultationEnabled) {
    parts.push('Free consultation.')
  }

  // Online
  if (hasOnlineOption) {
    parts.push('Online sessions available.')
  }

  // CTA — action-oriented for higher CTR
  parts.push('View profile and contact directly.')

  // Join and trim to ~160 chars
  let description = parts.join(' ')
  if (description.length > 160) {
    // Remove CTA and trim
    parts.pop()
    description = parts.join(' ')
    if (description.length > 157) {
      description = description.substring(0, 157) + '...'
    }
  }

  return description
}

const ProfilePage = ({ stateOverride, cityOverride, profileSlugOverride }) => {
  const { user } = useAuth()
  const params = useParams()
  const state = stateOverride || params.state
  const city = cityOverride || params.city
  const profileSlug = profileSlugOverride || params.profileSlug
  const slugOrId = params.slugOrId

  const currentSlug = profileSlug || slugOrId
  const [profile, setProfile] = useState(null)
  const [additionalLocations, setAdditionalLocations] = useState([])
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
  const isProfileOwner = Boolean(user?.id && profile?.user_id && user.id === profile.user_id)

  useEffect(() => {
    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSlug])

  // document.title is managed by SEOHelmet — no override here

  useEffect(() => {
    if (profile && !state) {
      const stateSlug = profile.state_province ? getStateSlugFromAbbr(profile.state_province) : null
      const citySlug = profile.city ? generateSlug(profile.city) : null
      const normalizedProfileSlug = profile.slug || generateSlug(profile.full_name)

      if (stateSlug && citySlug && normalizedProfileSlug) {
        navigate(`/premarital-counseling/${stateSlug}/${citySlug}/${normalizedProfileSlug}`, { replace: true })
      } else if (stateSlug && normalizedProfileSlug) {
        navigate(`/premarital-counseling/${stateSlug}/${normalizedProfileSlug}`, { replace: true })
      }
    }
  }, [profile, state, city, navigate])

  // Redirect 2-letter state abbreviation to full state name slug
  useEffect(() => {
    if (state && state.length === 2) {
      const fullStateSlug = getStateSlugFromAbbr(state)
      if (fullStateSlug && fullStateSlug !== state) {
        const newPath = city
          ? `/premarital-counseling/${fullStateSlug}/${city}/${currentSlug}`
          : `/premarital-counseling/${fullStateSlug}/${currentSlug}`
        navigate(newPath, { replace: true })
      }
    }
  }, [state, city, currentSlug, navigate])

  useEffect(() => {
    if (profile) {
      // Prevent the build process (ReactSnap prerendering) from logging ghost clicks
      const isPrerendering = navigator.userAgent === 'ReactSnap'

      if (!isPrerendering) {
        trackProfileView(profile.full_name, profile.city, profile.state_province)
        trackFacebookProfileView(profile.full_name)
        // Track view in Supabase for professional dashboards
        const attr = getAttribution()
        clickTrackingOperations.logProfileClick({
          profileId: profile.id,
          city: profile.city || 'unknown',
          state: profile.state_province || 'unknown',
          source: 'profile_page',
          partner_ref: attr.ref || null,
          utm_source: attr.utm_source || null,
          utm_medium: attr.utm_medium || null,
          utm_campaign: attr.utm_campaign || null
        }).catch(() => { }) // Silent fail - don't break page for tracking
      }
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
        // Load additional locations
        profileOperations.getAdditionalLocations(data.id).then(({ data: locs }) => {
          setAdditionalLocations(locs || [])
        }).catch((err) => console.warn('Failed to load additional locations:', err))
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

      // Fire conversion tracking for contact reveals
      trackContactSubmission(profile.full_name, type)
      trackFacebookLead(profile.full_name)
      trackProfessionalContact(profile.full_name)

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

  // noindex legacy /profile/ and /professionals/ URLs even while loading
  const isLegacyLoadingRoute = Boolean(slugOrId) || window.location.pathname.startsWith('/professionals/')

  if (loading) {
    return (
      <>
        <SEOHelmet
          title="Loading Profile | Premarital Counseling"
          canonicalUrl={`https://www.weddingcounselors.com${window.location.pathname.replace(/\/+$/, '') || '/'}`}
          url={window.location.pathname}
          noindex={isLegacyLoadingRoute}
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
      <>
        <SEOHelmet
          title="Profile Not Found"
          description="The profile you're looking for doesn't exist or may have been removed."
          noindex={true}
        />
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
      </>
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
  const isClergy = /pastor|priest|rabbi|chaplain|pre-cana|minister|reverend|deacon/i.test(profile?.profession || '')
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
    { label: isClergy ? 'Ordination & Credentials' : 'Credentials', items: credentials },
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
  const licenseLabel = credentials.length > 0 ? credentials.join(', ') : 'Not listed'
  const professionLabel = (() => {
    const profession = profile?.profession || 'Premarital Counselor'
    // Clergy don't hold licenses — never append "(license not listed)"
    if (isClergy) return profession
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
    // Clergy don't accept insurance — omit the insurance row for them
    ...(!isClergy ? [{ key: 'insurance', label: 'Insurance', value: isMissingDescriptor(insuranceLabel) ? null : insuranceLabel, missingLabel: 'insurance' }] : []),
    { key: 'availability', label: 'Availability', value: isMissingDescriptor(availabilityLabel) ? null : availabilityLabel, missingLabel: 'availability' },
    { key: 'license', label: isClergy ? 'Ordination / credential' : 'License / credential', value: isMissingDescriptor(licenseLabel) ? null : licenseLabel, missingLabel: isClergy ? 'ordination' : 'license' }
  ]

  const providedLogisticsItems = logisticsItems.filter((item) => !isMissingDescriptor(item.value))
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

  // noindex legacy /profile/ and /professionals/ URLs to prevent duplicate indexing
  // The canonical URL always points to /premarital-counseling/state/city/slug
  const isLegacyRoute = Boolean(slugOrId) || window.location.pathname.startsWith('/professionals/')

  return (
    <>
      <SEOHelmet
        title={buildProfileMetaTitle(profile, { hasOnlineOption, stateName, specialties, treatmentApproaches, slug: currentSlug })}
        description={buildProfileMetaDescription(profile, { pricingLabel, insuranceAccepted, hasOnlineOption, freeConsultationEnabled, treatmentApproaches, slidingScaleEnabled, stateName })}
        url={window.location.pathname}
        type="profile"
        structuredData={profile ? generateProfessionalStructuredData(profile) : null}
        professional={profile}
        keywords={`${profile?.profession}, premarital counseling, ${profile?.city}, ${profile?.state_province}, ${specialties.join(', ')}`}
        breadcrumbs={breadcrumbItems}
        faqs={providerFaqItems.length > 0 ? providerFaqItems : null}
        canonicalUrl={`https://www.weddingcounselors.com${canonicalPath}`}
        noindex={isLegacyRoute}
      />

      <div className="profile-page profile-wellness">
        {profile && !profile.is_claimed && shouldShowClaimPrompts && (
          <UnclaimedProfileBanner
            profile={profile}
            viewCount={null}
          />
        )}

        {/* Cleaned up shell */}
        <section className="wellness-shell" style={{ width: '100%', position: 'relative' }}>
          
          <div className="wellness-container">
            {/* Header / Breadcrumbs */}
            <div className="wellness-header" style={{ marginBottom: '2rem', marginTop: '1.5rem', zIndex: 10, position: 'relative' }}>
              <Breadcrumbs items={breadcrumbItems} className="wellness-breadcrumbs" />

              {isProfileOwner && (
                <UpgradeCTA
                  profile={profile}
                  surface="owner_public_profile"
                  variant="banner"
                />
              )}
            </div>

            {/* HERO SECTION */}
              <div className="wellness-hero wellness-glass">
                <div className="wellness-avatar-wrapper">
                  {profile.photo_url && !imageError ? (
                    <img
                      src={profile.photo_url}
                      alt={profile.full_name}
                      className="wellness-avatar"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="wellness-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ width: '40%', opacity: 0.3 }}>
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path>
                      </svg>
                    </div>
                  )}
                </div>
                
                <div className="wellness-hero-content">
                  <h1>{profile.full_name}</h1>
                  <p className="role">
                    {profile.is_officiant && profile.clergy_title ? `${professionLabel} & ${profile.clergy_title}` : professionLabel}
                    {profile.pronouns ? ` (${profile.pronouns})` : ''}
                  </p>
                  
                  <div className="wellness-meta">
                    <span>{formatLocation(profile)}</span>
                    {profile.years_experience && <span>{profile.years_experience}+ years exp</span>}
                    {availabilityIsVerified && <span>{availabilityLabel}</span>}
                  </div>

                  {additionalLocations.length > 0 && (
                    <p className="wellness-also-serving">
                      Also serving:{' '}
                      {additionalLocations.map((loc, i) => {
                        const stateSlug = getStateSlugFromAbbr(loc.state_province)
                        const citySlug = generateSlug(loc.city)
                        return (
                          <span key={loc.id}>
                            {i > 0 && ' | '}
                            <Link to={`/premarital-counseling/${stateSlug}/${citySlug}`}>
                              {loc.city}, {loc.state_province}
                            </Link>
                          </span>
                        )
                      })}
                    </p>
                  )}

                  {specialties.length > 0 && (
                    <div className="wellness-chips">
                      {specialties.slice(0, 4).map((specialty) => (
                        <span key={specialty} className="wellness-chip">
                          {specialty}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="wellness-hero-actions">
                    {websiteUrl && (
                      <a
                        href={websiteUrl}
                        target="_blank"
                        rel="nofollow noopener noreferrer"
                        className="wellness-btn-outline"
                      >
                        Visit Website
                      </a>
                    )}
                    <ShareButton
                      url={canonicalPath}
                      title={`${profile.full_name} — Premarital Counselor in ${profile.city}, ${profile.state_province}`}
                      text={`Check out ${profile.full_name}, a premarital counselor in ${profile.city}`}
                      variant="icon"
                    />
                  </div>
                </div>
              </div>

              {/* QUANTITATIVE METRICS DASHBOARD */}
              <div className="wellness-metrics delay-1">
                {profile.years_experience && (
                  <div className="wellness-metric-box">
                    <div className="wellness-metric-value">{profile.years_experience}+</div>
                    <div className="wellness-metric-label">Years Experience</div>
                  </div>
                )}
                {pricingLabel && !isMissingDescriptor(pricingLabel) && (
                  <div className="wellness-metric-box">
                    <div className="wellness-metric-value">
                      {pricingLabel.replace('Per session: ', '').replace(' / session', '').trim()}
                    </div>
                    <div className="wellness-metric-label">Per Session</div>
                  </div>
                )}
                {specialties && specialties.length > 0 && (
                  <div className="wellness-metric-box">
                    <div className="wellness-metric-value">{specialties.length}</div>
                    <div className="wellness-metric-label">Specialties</div>
                  </div>
                )}
                <div className="wellness-metric-box">
                  <div className="wellness-metric-value" style={{ fontSize: '1.8rem', paddingTop: '0.2rem', paddingBottom: '0.2rem' }}>
                    {profile.is_claimed ? '✓' : '—'}
                  </div>
                  <div className="wellness-metric-label">{profile.is_claimed ? 'Verified' : 'Unclaimed'}</div>
                </div>
              </div>

              {/* ABOUT SECTION */}
              <section className="wellness-section wellness-glass delay-1">
                <h2>About {firstName}</h2>
                <div className="wellness-prose">
                  {profile.bio ? (
                    profile.bio
                      .split('\n')
                      .map((paragraph) => paragraph.trim())
                      .filter(Boolean)
                      .map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))
                  ) : (
                    <p>
                      {firstName} is listed as a {professionLabel || 'premarital counseling professional'} in {profile.city}, {profile.state_province}.
                    </p>
                  )}
                </div>
              </section>

              {/* APPROACH SECTION */}
              {profile.approach && (
                <section className="wellness-section wellness-glass delay-2">
                  <h2>Approach</h2>
                  <div className="wellness-prose">
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

              {/* LOGISTICS & FOCUS */}
              <section className="wellness-section wellness-glass delay-3">
                <h2>Details & Logistics</h2>
                
                {providedLogisticsItems.length > 0 && (
                  <div className="wellness-data-group">
                    {providedLogisticsItems.map((item) => (
                      <div key={item.key} className="wellness-data-row">
                        <span className="wellness-data-label">{item.label}</span>
                        <strong className="wellness-data-value">{item.value}</strong>
                      </div>
                    ))}
                  </div>
                )}

                {focusGroups.length > 0 && (
                  <div className="wellness-data-group">
                    {focusGroups.map((group) => (
                      <div key={group.label} className="wellness-data-row">
                        <span className="wellness-data-label">{group.label}</span>
                        <strong className="wellness-data-value">{group.items.join(', ')}</strong>
                      </div>
                    ))}
                  </div>
                )}

                {credentialGroups.length > 0 && (
                  <div className="wellness-data-group">
                    {credentialGroups.map((group) => (
                      <div key={group.label} className="wellness-data-row">
                        <span className="wellness-data-label">{group.label}</span>
                        <strong className="wellness-data-value">{group.items.join(', ')}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* PRICING & INSURANCE */}
              {hasPricingSection && (
                <section className="wellness-section wellness-glass delay-3">
                  <h2>{isClergy ? 'Fees & Availability' : 'Pricing & Insurance'}</h2>

                  <div className="wellness-data-group">
                    {profile.pricing_range && (
                      <div className="wellness-data-row">
                        <span className="wellness-data-label">{isClergy ? 'Fees' : 'Session Fees'}</span>
                        <strong className="wellness-data-value">{profile.pricing_range}</strong>
                      </div>
                    )}
                    {insuranceAccepted.length > 0 && (
                      <div className="wellness-data-row">
                        <span className="wellness-data-label">Insurance</span>
                        <div className="wellness-data-value">
                          <div className="wellness-chips wellness-chips-left">
                            {insuranceAccepted.map((insurance) => (
                              <span key={insurance} className="wellness-chip">{insurance}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    {paymentMethods.length > 0 && (
                      <div className="wellness-data-row">
                        <span className="wellness-data-label">Payment Methods</span>
                        <div className="wellness-data-value">
                          <div className="wellness-chips wellness-chips-left">
                            {paymentMethods.map((method) => (
                              <span key={method} className="wellness-chip">{method}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {(freeConsultationEnabled || slidingScaleEnabled) && (
                    <div className="wellness-chips wellness-chips-left">
                      {freeConsultationEnabled && (
                        <span className="wellness-chip">Free consultation</span>
                      )}
                      {slidingScaleEnabled && (
                        <span className="wellness-chip">Sliding scale available</span>
                      )}
                    </div>
                  )}
                </section>
              )}

              {/* DIRECT CONTACT — paid tier reveal */}
              {canShowDirectContact && (profile.phone || profile.email || websiteUrl || profile.address_line1) && (
                <section className="wellness-section wellness-glass delay-4">
                  <h2>Direct Contact</h2>
                  <div className="wellness-data-group">
                    {profile.phone && (
                      <div className="wellness-data-row">
                        <span className="wellness-data-label">Phone</span>
                        <div className="wellness-data-value">
                          {phoneRevealed ? (
                            <a href={`tel:${profile.phone}`} className="wellness-contact-link">
                              {formatPhoneNumber(profile.phone)}
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRevealContact('phone')}
                              className="wellness-reveal-btn"
                            >
                              Show phone
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {profile.email && (
                      <div className="wellness-data-row">
                        <span className="wellness-data-label">Email</span>
                        <div className="wellness-data-value">
                          {emailRevealed ? (
                            <a href={`mailto:${profile.email}`} className="wellness-contact-link">
                              {profile.email}
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRevealContact('email')}
                              className="wellness-reveal-btn"
                            >
                              Show email
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {websiteUrl && (
                      <div className="wellness-data-row">
                        <span className="wellness-data-label">Website</span>
                        <div className="wellness-data-value">
                          <a
                            href={websiteUrl}
                            target="_blank"
                            rel="nofollow noopener noreferrer"
                            className="wellness-contact-link"
                            onClick={() => handleRevealContact('website')}
                          >
                            Visit website
                          </a>
                        </div>
                      </div>
                    )}

                    {profile.address_line1 && (
                      <div className="wellness-data-row">
                        <span className="wellness-data-label">Address</span>
                        <div className="wellness-data-value">
                          {profile.address_line1}
                          <br />
                          {formatLocation(profile)} {profile.postal_code}
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* CONTACT FORM SECTION */}
              <section id="contact-section" className="wellness-section wellness-glass wellness-contact delay-4">
                <h2>Request an Introduction</h2>
                {!profile.is_claimed && (
                  <p className="wellness-prose" style={{ fontSize: '0.95rem' }}>
                    This provider has not verified profile details yet. Messages are forwarded to the public email on file when available.
                  </p>
                )}
                
                {profile.booking_url ? (
                  <div style={{ marginTop: '2rem' }}>
                    <a href={profile.booking_url} target="_blank" rel="nofollow noopener noreferrer" className="wellness-btn" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
                      Book Consultation
                    </a>
                  </div>
                ) : (
                  <LeadContactForm
                    profileId={profile.id}
                    professionalName={profile.full_name}
                    profile={profile}
                    isProfileClaimed={profile.is_claimed}
                    onSuccess={handleLeadSuccess}
                    theme="wellness"
                    hideHeader={true}
                  />
                )}
              </section>

              {/* FAQ SECTION */}
              <section className="wellness-section wellness-glass delay-4">
                <h2>{providerFaqItems.length > 0 ? 'Frequently Asked Questions' : 'Questions to Ask Before Booking'}</h2>
                <div className="wellness-faq-list">
                  {faqItems.map((faq) => (
                    <details key={faq.question} className="wellness-faq-item">
                      <summary>{faq.question}</summary>
                      <p>{faq.answer}</p>
                    </details>
                  ))}
                </div>
              </section>

              {/* EXPLORE MORE LINKS */}
              {profile.city && profile.state_province && (
                <section className="wellness-section wellness-glass delay-4" style={{ marginBottom: '4rem' }}>
                  <h2>Explore More</h2>
                  <div className="wellness-explore-grid">
                    <Link to={`/premarital-counseling/${normalizedStateSlug}/${generateSlug(profile.city)}`} className="wellness-btn-outline">
                      Counseling in {profile.city}
                    </Link>
                    <Link to={`/premarital-counseling/${normalizedStateSlug}`} className="wellness-btn-outline">
                      Browse all {profile.state_province}
                    </Link>
                    {(() => {
                      const profileText = [
                        ...treatmentApproaches,
                        ...certifications,
                        ...specialties,
                        profile.faith_tradition || ''
                      ].join(' ').toLowerCase()
                      const matchedSpecialties = Object.entries(SPECIALTY_CONFIG)
                        .filter(([slug, config]) =>
                          config.filterTerms.some((term) => profileText.includes(term.toLowerCase()))
                        )
                        .slice(0, 2)
                      return matchedSpecialties.map(([slug, config]) => (
                        <Link
                          key={slug}
                          to={`/premarital-counseling/${slug}/${normalizedStateSlug}`}
                          className="wellness-btn-outline"
                        >
                          {config.name} counseling in {stateName}
                        </Link>
                      ))
                    })()}
                  </div>
                </section>
              )}
              
              {/* Internal Linking Mesh: Nearby Counselors */}
              {profile && <NearbyProfessionals currentProfile={profile} />}
            </div>
        </section>
      </div>

      {/* Sticky mobile CTA — visible on tablet/mobile only via CSS */}
      <div className="profile-sticky-cta" style={{ display: 'none' }}>
        <div className="profile-sticky-cta-info">
          <div className="profile-sticky-cta-name">{profile.full_name}</div>
        </div>
        <button onClick={scrollToContact} className="wellness-btn">
          Inquire
        </button>
      </div>
    </>
  )
}

export default ProfilePage
