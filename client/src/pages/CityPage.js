import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import ProfileList from '../components/profiles/ProfileList';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import Breadcrumbs, { generateBreadcrumbs } from '../components/common/Breadcrumbs';
import SEOHelmet from '../components/analytics/SEOHelmet';
import { trackLocationPageView, trackSearch } from '../components/analytics/GoogleAnalytics';
import { trackFacebookSearch } from '../components/analytics/FacebookPixel';
import { profileOperations } from '../lib/supabaseClient';
import { STATE_CONFIG, CITY_CONFIG, isAnchorCity } from '../data/locationConfig';
import { STATE_DISCOUNT_CONFIG } from '../data/specialtyConfig';
import SpecialtiesList from '../components/common/SpecialtiesList';
import LocationInsights from '../components/common/LocationInsights';
import FAQ from '../components/common/FAQ';
import HowToChooseSection from '../components/city/HowToChooseSection';
import MultiProviderInquiryForm from '../components/city/MultiProviderInquiryForm';
import CityDataSummary from '../components/city/CityDataSummary';
import ConciergeLeadForm from '../components/leads/ConciergeLeadForm';
import {
  enrichPremaritalSignals,
  groupProfilesByRole,
  getProfileRole,
  getDirectoryPriceInsights,
  getSessionTypes,
  getPriceMidpoint,
  hasInsurance,
  isSelfPayOnly,
  getTierPriority,
  formatFaithTradition,
  formatTypeList,
  METHOD_FILTERS,
  computeCityStats
} from '../lib/profileAnalytics';
import '../assets/css/state-page.css';

const CityPage = ({ stateOverride, cityOverride }) => {
  const params = useParams()
  const state = stateOverride || params.state
  const city = cityOverride || params.cityOrSlug
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortBy, setSortBy] = useState('best-premarital')
  const [directoryFilters, setDirectoryFilters] = useState({
    providerType: 'all',
    faith: 'all',
    sessionType: 'all',
    price: 'all',
    insurance: 'all',
    verified: 'all',
    method: 'all',
    premarital: 'all',
    programStyle: 'all',
    lgbtq: 'all',
    schedule: 'all',
    neighborhood: 'all',
    availability: 'all'
  })

  const [isConciergeOpen, setIsConciergeOpen] = useState(false)

  const stateConfig = STATE_CONFIG[state]
  const cityConfig = CITY_CONFIG[state]?.[city]

  // Fallback if city not in config
  const cityName = cityConfig?.name || (city ? city.split('-').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ') : 'Unknown City')

  const stateName = stateConfig?.name || state
  const hasProfiles = profiles.length > 0
  const showEmptyState = !loading && !error && !hasProfiles
  const nearbyCities = (stateConfig?.major_cities || [])
    .filter((c) => c.toLowerCase().replace(/\s+/g, '-') !== city)
    .slice(0, 6)

  const profilesWithSignals = useMemo(
    () => profiles.map((profile) => enrichPremaritalSignals(profile)),
    [profiles]
  )

  const groupedProfiles = useMemo(() => groupProfilesByRole(profilesWithSignals), [profilesWithSignals])
  const directoryPriceInsights = useMemo(
    () => getDirectoryPriceInsights(profilesWithSignals),
    [profilesWithSignals]
  )
  const hasFaithIntegratedProviders = useMemo(
    () => profilesWithSignals.some((profile) =>
      profile.methodTags.includes('faith-based') ||
      (profile.faith_tradition && profile.faith_tradition !== 'secular')
    ),
    [profilesWithSignals]
  )
  const providerTypeLabels = useMemo(() => {
    const labels = []
    if (groupedProfiles.therapist.length > 0) labels.push('therapists')
    if (groupedProfiles.clergy.length > 0) labels.push('clergy')
    if (groupedProfiles.coach.length > 0) labels.push('coaches')
    if (groupedProfiles.other.length > 0 || labels.length === 0) labels.push('premarital counselors')
    return labels
  }, [groupedProfiles])
  const cityStats = useMemo(() => computeCityStats(profilesWithSignals), [profilesWithSignals])
  const locationStats = useMemo(() => {
    const cards = [
      { label: 'Professionals', value: profilesWithSignals.length, alwaysShow: true },
      { label: 'Licensed therapists', value: groupedProfiles.therapist.length },
      { label: 'Clergy', value: groupedProfiles.clergy.length },
      { label: 'Coaches', value: groupedProfiles.coach.length }
    ]
    return cards.filter((card) => card.alwaysShow || card.value > 0)
  }, [profilesWithSignals, groupedProfiles])

  const neighborhoodOptions = useMemo(() => {
    return Array.from(
      new Set(
        profilesWithSignals
          .map((profile) => String(profile?.postal_code || '').trim())
          .filter(Boolean)
      )
    ).sort()
  }, [profilesWithSignals])

  const faithOptions = useMemo(() => {
    return Array.from(
      new Set(
        profilesWithSignals
          .map((profile) => String(profile?.faith_tradition || '').trim())
          .filter(Boolean)
      )
    ).sort()
  }, [profilesWithSignals])

  const methodOptions = useMemo(() => {
    return METHOD_FILTERS.filter((method) =>
      profilesWithSignals.some((profile) => profile.methodTags.includes(method.value))
    )
  }, [profilesWithSignals])

  const filteredProfiles = useMemo(() => {
    return profilesWithSignals.filter((profile) => {
      if (directoryFilters.providerType !== 'all' && getProfileRole(profile) !== directoryFilters.providerType) {
        return false
      }

      if (directoryFilters.faith !== 'all' && profile.faith_tradition !== directoryFilters.faith) {
        return false
      }

      if (directoryFilters.sessionType !== 'all') {
        const sessionTypes = getSessionTypes(profile)
        if (!sessionTypes.has(directoryFilters.sessionType)) return false
      }

      if (directoryFilters.price !== 'all') {
        const isDonationBased = profile?.pricing_range === 'Free / Donation-based'
        const priceMidpoint = getPriceMidpoint(profile)
        if (directoryFilters.price === 'free' && !isDonationBased) return false
        if (directoryFilters.price !== 'free') {
          if (!priceMidpoint && !isDonationBased && directoryFilters.price !== 'unknown') return false
          if (isDonationBased && directoryFilters.price !== 'unknown') return false
          if (directoryFilters.price === 'under150' && !(priceMidpoint < 150)) return false
          if (directoryFilters.price === '150to250' && !(priceMidpoint >= 150 && priceMidpoint <= 250)) return false
          if (directoryFilters.price === '250plus' && !(priceMidpoint > 250)) return false
          if (directoryFilters.price === 'unknown' && (priceMidpoint || isDonationBased)) return false
        }
      }

      if (directoryFilters.insurance === 'accepts' && !hasInsurance(profile)) {
        return false
      }

      if (directoryFilters.insurance === 'selfpay' && !isSelfPayOnly(profile)) {
        return false
      }

      if (directoryFilters.verified === 'details' && !profile.detailsVerified) {
        return false
      }

      if (directoryFilters.method !== 'all' && !profile.methodTags.includes(directoryFilters.method)) {
        return false
      }

      if (directoryFilters.premarital === 'focused' && !profile.premaritalFocused) {
        return false
      }

      if (directoryFilters.programStyle === 'structured' && !profile.structuredProgram) {
        return false
      }

      if (directoryFilters.programStyle === 'flexible' && profile.structuredProgram) {
        return false
      }

      if (directoryFilters.lgbtq === 'affirming' && !profile.lgbtqAffirming) {
        return false
      }

      if (directoryFilters.schedule === 'evenings-weekends' && !profile.eveningWeekend) {
        return false
      }

      if (directoryFilters.neighborhood !== 'all' && String(profile?.postal_code || '').trim() !== directoryFilters.neighborhood) {
        return false
      }

      if (directoryFilters.availability === 'accepting' && !(profile.availabilityState?.known && profile.availabilityState?.isAccepting)) {
        return false
      }

      if (directoryFilters.availability === 'limited' && !(profile.availabilityState?.known && !profile.availabilityState?.isAccepting)) {
        return false
      }

      return true
    })
  }, [profilesWithSignals, directoryFilters])

  const sortedProfiles = useMemo(() => {
    const sorted = [...filteredProfiles]

    sorted.sort((a, b) => {
      if (sortBy === 'best-premarital') {
        if (b.premaritalFitScore !== a.premaritalFitScore) return b.premaritalFitScore - a.premaritalFitScore
      } else if (sortBy === 'verified-details') {
        if (a.detailsVerified !== b.detailsVerified) return Number(b.detailsVerified) - Number(a.detailsVerified)
        if ((b.fitReasonLabels?.length || 0) !== (a.fitReasonLabels?.length || 0)) {
          return (b.fitReasonLabels?.length || 0) - (a.fitReasonLabels?.length || 0)
        }
        if (b.premaritalFitScore !== a.premaritalFitScore) return b.premaritalFitScore - a.premaritalFitScore
      } else if (sortBy === 'price-low') {
        const aPrice = getPriceMidpoint(a)
        const bPrice = getPriceMidpoint(b)
        const aSort = aPrice ?? Number.POSITIVE_INFINITY
        const bSort = bPrice ?? Number.POSITIVE_INFINITY
        if (aSort !== bSort) return aSort - bSort
      } else if (sortBy === 'faith-based') {
        const aFaith = a.faith_tradition && a.faith_tradition !== 'secular'
        const bFaith = b.faith_tradition && b.faith_tradition !== 'secular'
        if (aFaith !== bFaith) return Number(bFaith) - Number(aFaith)
        if (b.premaritalFitScore !== a.premaritalFitScore) return b.premaritalFitScore - a.premaritalFitScore
      } else if (sortBy === 'online') {
        const aOnline = getSessionTypes(a).has('online') || getSessionTypes(a).has('hybrid')
        const bOnline = getSessionTypes(b).has('online') || getSessionTypes(b).has('hybrid')
        if (aOnline !== bOnline) return Number(bOnline) - Number(aOnline)
        if (b.premaritalFitScore !== a.premaritalFitScore) return b.premaritalFitScore - a.premaritalFitScore
      }

      if (getTierPriority(a) !== getTierPriority(b)) return getTierPriority(a) - getTierPriority(b)

      // Verified providers get a significant boost within their tier
      const aVerified = Boolean(a.badge_verified)
      const bVerified = Boolean(b.badge_verified)
      if (aVerified !== bVerified) return Number(bVerified) - Number(aVerified)

      // Composite quality score: completeness (0-100) + engagement + recency
      const qualityScore = (p) => {
        const completeness = p.profile_completeness_score || 0
        const verified = p.badge_verified ? 40 : 0 // verified profiles get 40pt bonus
        const engagement = Math.min((p.contact_reveals_count || 0) * 5, 30) // cap at 30pts
        const daysSinceCreated = (Date.now() - new Date(p.created_at).getTime()) / 86400000
        const recency = Math.max(0, 20 - daysSinceCreated * 0.5) // 20pts decaying over 40 days
        return completeness + verified + engagement + recency
      }
      return qualityScore(b) - qualityScore(a)
    })

    return sorted
  }, [filteredProfiles, sortBy])

  const groupedFilteredProfiles = useMemo(() => groupProfilesByRole(sortedProfiles), [sortedProfiles])

  const clearDirectoryFilters = () => {
    setDirectoryFilters({
      providerType: 'all',
      faith: 'all',
      sessionType: 'all',
      price: 'all',
      insurance: 'all',
      verified: 'all',
      method: 'all',
      premarital: 'all',
      programStyle: 'all',
      lgbtq: 'all',
      schedule: 'all',
      neighborhood: 'all',
      availability: 'all'
    })
  }

  // Track filter usage (debounced to avoid spamming on rapid changes)
  useEffect(() => {
    const activeFilters = Object.entries(directoryFilters)
      .filter(([, v]) => v !== 'all')
      .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {})
    if (Object.keys(activeFilters).length > 0) {
      const timer = setTimeout(() => {
        trackSearch(`${cityName}, ${stateName}`, activeFilters)
        trackFacebookSearch(`${cityName} ${Object.values(activeFilters).join(' ')}`)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [directoryFilters, cityName, stateName])

  useEffect(() => {
    loadCityProfiles()
    trackLocationPageView(stateName, cityName)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, city])

  const loadCityProfiles = async () => {
    try {
      setLoading(true)
      setError(null)

      // Search for profiles in this city and state
      const { data, error } = await profileOperations.getProfiles({
        state: stateConfig?.abbr || state.toUpperCase(),
        city: cityName
      })

      if (error) {
        setError(error.message)
      } else {
        // Sort profiles by tier: Area Spotlight > Local Featured > Community
        const tierSortedProfiles = (data || []).sort((a, b) => {
          const tierOrder = {
            'area_spotlight': 1,
            'local_featured': 2,
            'community': 3
          }

          const aTier = tierOrder[a.tier] || 999
          const bTier = tierOrder[b.tier] || 999

          if (aTier !== bTier) {
            return aTier - bTier
          }

          // If same tier, sort by created_at (newest first)
          return new Date(b.created_at) - new Date(a.created_at)
        })

        setProfiles(tierSortedProfiles)
      }
    } catch (err) {
      setError('Failed to load professionals for this city')
    } finally {
      setLoading(false)
    }
  }

  const breadcrumbData = generateBreadcrumbs.cityPage(stateName, cityName, `/premarital-counseling/${state}`)

  const inventoryDescriptor = formatTypeList(providerTypeLabels)
  const seoInventoryCopy = groupedProfiles.clergy.length > 0
    ? 'therapists, coaches, and clergy'
    : groupedProfiles.coach.length > 0
      ? 'therapists and coaches'
      : 'licensed therapists'

  // Generate ItemList structured data for provider directory (SEO-critical for rankings)
  const structuredData = profiles.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': `Premarital Counselors in ${cityName}, ${stateName}`,
    'description': `Find qualified premarital counselors in ${cityName}, ${stateName}. ${profiles.length} professionals including ${seoInventoryCopy} for engaged couples.`,
    'numberOfItems': profiles.length,
    'itemListElement': profiles.slice(0, 20).map((profile, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'item': {
        '@type': 'Person',
        'name': profile.full_name,
        'jobTitle': profile.profession || 'Premarital Counselor',
        'address': {
          '@type': 'PostalAddress',
          'addressLocality': profile.city || cityName,
          'addressRegion': profile.state_province || stateConfig?.abbr
        },
        ...(profile.slug ? { 'url': `https://www.weddingcounselors.com/premarital-counseling/${state}/${city}/${profile.slug}` } : {})
      }
    }))
  } : null

  const sessionCostDisplayRange = directoryPriceInsights.label
  const sessionCostForCopy = `${sessionCostDisplayRange} per session`
  const costStartingAt = String(directoryPriceInsights.min || 150)
  const costSourceSentence = directoryPriceInsights.source === 'directory'
    ? `This range is based on ${directoryPriceInsights.count} listed profile${directoryPriceInsights.count === 1 ? '' : 's'} with published pricing.`
    : 'This is a market estimate for the area; exact rates vary by provider.'
  const costFaithSentence = groupedProfiles.clergy.length > 0
    ? 'Some clergy-led programs may be free or low-cost through local churches.'
    : hasFaithIntegratedProviders
      ? 'Some therapists can integrate faith values when requested.'
      : 'Most listings are therapist-led and focused on practical relationship preparation.'
  const listedMethodNames = methodOptions
    .filter((option) => option.value !== 'faith-based')
    .slice(0, 2)
    .map((option) => option.label)
  const timelineMethodSentence = listedMethodNames.length > 0
    ? `Listed methods in this city include ${listedMethodNames.join(' and ')}.`
    : 'Method details are shown only when each provider supplies them.'
  const timelineFaithSentence = groupedProfiles.clergy.length > 0
    ? 'Clergy-led programs may require 4-6 sessions.'
    : 'Many couples choose a structured 5-8 session process.'

  const faithFaq = groupedProfiles.clergy.length > 0
    ? {
      question: `Are there clergy-led and faith-based premarital options in ${cityName}?`,
      answer: `Yes. ${cityName} currently includes clergy-led options plus counselors who integrate faith values into premarital work.`
    }
    : hasFaithIntegratedProviders
      ? {
        question: `Can couples request faith-integrated premarital counseling in ${cityName}?`,
        answer: `Yes. Most listings are therapist-led, and some professionals can integrate faith values when requested during intake.`
      }
      : {
        question: `Are there faith-based premarital options in ${cityName}?`,
        answer: `${cityName} currently has mostly therapist-led listings. Faith-integrated and clergy-led options are limited right now.`
      }

  // City-specific FAQ data for rich results
  const cityFAQs = [
    {
      question: `How much does premarital counseling cost in ${cityName}?`,
      answer: `Premarital counseling in ${cityName}, ${stateName} typically costs ${sessionCostForCopy}. ${costSourceSentence} Many counselors offer package deals for 5-8 sessions. ${costFaithSentence} Some insurance plans may cover premarital therapy.`
    },
    {
      question: `How many premarital counseling sessions do engaged couples need in ${cityName}?`,
      answer: `Most engaged couples in ${cityName} complete 5-8 premarital counseling sessions over 2-3 months before their wedding. ${timelineMethodSentence} ${timelineFaithSentence}`
    },
    faithFaq,
    {
      question: `Can engaged couples do premarital counseling online in ${cityName}?`,
      answer: `Yes, many ${cityName} premarital counselors offer online sessions via telehealth. This is ideal for busy engaged couples with different schedules or if one partner travels. Online premarital counseling is just as effective as in-person for marriage preparation.`
    },
    {
      question: `What topics are covered in premarital counseling in ${cityName}?`,
      answer: `Premarital counseling in ${cityName} covers communication skills, conflict resolution, finances, family planning, intimacy expectations, roles and responsibilities, faith and values, and in-law relationships. Counselors help engaged couples prepare for a strong marriage foundation.`
    }
  ]

  const heroHighlights = [
    {
      label: 'Professionals listed',
      detail: profilesWithSignals.length > 0 ? `${profilesWithSignals.length} active profiles` : 'Growing local coverage'
    },
    groupedProfiles.clergy.length > 0
      ? { label: 'Faith-based options', detail: `${groupedProfiles.clergy.length} clergy and faith-integrated providers` }
      : hasFaithIntegratedProviders
        ? { label: 'Faith-integrated care', detail: 'Available with select therapist-led programs' }
        : methodOptions.length > 0
          ? { label: 'Methods listed', detail: `${methodOptions.length} method tags shown from provider profiles` }
          : { label: 'Methods listed', detail: 'Methods are shown only when provided by each profile' },
    { label: 'Session formats', detail: 'Online and in-person availability' }
  ]

  const keywordBlocks = [
    `premarital counseling ${cityName}`,
    `marriage counseling ${cityName}`,
    `premarital counseling ${cityName} ${stateName}`,
    `marriage therapist ${cityName}`,
    `pre marriage counseling ${cityName}`,
    `premarital therapy ${cityName} ${stateConfig?.abbr || ''}`
  ]
  if (hasFaithIntegratedProviders || groupedProfiles.clergy.length > 0) {
    keywordBlocks.push(
      `christian premarital counseling ${cityName}`,
      `faith-based premarital counseling ${cityName}`
    )
  }
  if (groupedProfiles.clergy.length > 0) {
    keywordBlocks.push(`pre cana ${cityName}`)
  }
  const seoKeywords = keywordBlocks.join(', ')

  // Determine if page should be noindexed (thin content detection)
  // With dynamic stats blocks added, we can index pages with fewer profiles
  // Anchor cities are always indexable to build SEO authority regardless of profile count
  const isAnchor = isAnchorCity(state, city)
  const shouldNoindex = profiles.length === 0 || (!isAnchor && profiles.length < 3)

  return (
    <div className="city-page">
      <SEOHelmet
        title={`Premarital Counseling in ${cityName}, ${stateConfig?.abbr || stateName} — ${profiles.length > 0 ? profiles.length : 'Top'} Counselors (${new Date().getFullYear()})`}
        description={`Find premarital counseling in ${cityName}, ${stateName}. Compare ${profiles.length || 'top'} ${inventoryDescriptor} — prices from $${costStartingAt}/session. Read profiles, filter by method & faith, and message a counselor today.`}
        keywords={seoKeywords}
        structuredData={structuredData}
        faqs={cityFAQs}
        noindex={shouldNoindex}
        canonicalUrl={`/premarital-counseling/${state}/${city}`}
      />

      {/* City Header - Short & Focused on Conversion */}
      <section className="state-header city-header">
        <div className="container">
          <Breadcrumbs items={breadcrumbData} variant="on-hero" />
          <div className="state-header-content">
            <h1>Premarital Counseling in {cityName}, {stateName}</h1>
            <p className="lead city-hero-subtitle">
              Compare {profiles.length > 0 ? profiles.length : 'qualified'} {formatTypeList(providerTypeLabels)} in {cityName}. Browse profiles, filter by method and price, and contact a counselor today.
            </p>

            <div className="city-hero-highlights">
              {heroHighlights.map((item) => (
                <div className="city-hero-highlight" key={item.label}>
                  <span className="city-hero-highlight__label">{item.label}</span>
                  <span className="city-hero-highlight__detail">{item.detail}</span>
                </div>
              ))}
            </div>

            {/* City Stats */}
            {profiles.length > 0 && (
              <div className="location-stats">
                {locationStats.map((stat) => (
                  <div className="stat" key={stat.label}>
                    <span className="stat-number">{stat.value}</span>
                    <span className="stat-label">{stat.label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Quick CTA for Engaged Couples */}
            <div className="state-cta-section" style={{ marginTop: 'var(--space-8)' }}>
              <div className="cta-buttons">
                {showEmptyState ? (
                  <>
                    <button onClick={() => setIsConciergeOpen(true)} className="btn btn-primary btn-large">
                      Get Matched Free
                    </button>
                    <Link to={`/premarital-counseling/${state}`} className="btn btn-outline btn-large">
                      Browse {stateName} Counselors
                    </Link>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsConciergeOpen(true)}
                      className="btn btn-primary btn-large"
                      style={{ boxShadow: '0 4px 6px rgba(14, 94, 94, 0.2)' }}
                    >
                      Get Matched Free
                    </button>
                    <button
                      onClick={() => document.getElementById('providers-list').scrollIntoView({ behavior: 'smooth' })}
                      className="btn btn-outline btn-large"
                    >
                      Browse {profiles.length} Counselors Below
                    </button>
                  </>
                )}
              {profiles.length > 0 && (
                <p className="city-hero-microcopy" style={{ marginTop: 'var(--space-4)', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                  Most counselors respond within 1-2 business days
                </p>
              )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marriage License Discount Callout */}
      {STATE_DISCOUNT_CONFIG[state] && (
        <div className="discount-callout-banner">
          <div className="discount-callout-inner">
            <div className="discount-callout-icon">
              <i className="fa fa-piggy-bank"></i>
            </div>
            <div className="discount-callout-body">
              <strong>
                {stateConfig?.name} couples save {STATE_DISCOUNT_CONFIG[state].discount} on their marriage license
                {STATE_DISCOUNT_CONFIG[state].waitingPeriod && STATE_DISCOUNT_CONFIG[state].waitingPeriod !== 'No waiting period impact'
                  ? ` — and the waiting period is waived`
                  : ''}
              </strong>
              {' '}when they complete premarital counseling with a licensed professional. Any counselor below can issue your certificate.
            </div>
            <Link
              to={`/premarital-counseling/marriage-license-discount/${state}`}
              className="discount-callout-link"
            >
              See requirements <i className="fa fa-arrow-right"></i>
            </Link>
          </div>
        </div>
      )}

      {/* City Content */}
      <div className="container">
        {/* Money SERP Insights Box */}
        <LocationInsights
          stateSlug={state}
          citySlug={city}
          profiles={profilesWithSignals}
          costEstimateOverride={sessionCostDisplayRange}
        />

        <CityDataSummary
          stats={cityStats}
          cityName={cityName}
          stateName={stateName}
          stateSlug={state}
        />

        <div id="providers-list" className={`state-content ${showEmptyState ? 'state-content--empty' : ''}`}>
          {/* Left Column - Profiles */}
          <div className={`state-main ${showEmptyState ? 'state-main--empty' : ''}`}>
            {loading ? (
              <div className="loading-section">
                <LoadingSpinner />
                <p>Loading professionals in {cityName}...</p>
              </div>
            ) : error ? (
              <ErrorMessage message={error} />
            ) : hasProfiles ? (
              <>
                <div className="results-header">
                  <h2>Premarital Counselors in {cityName}</h2>
                  <p>Sorted for premarital fit first so couples can scan options faster and contact one counselor directly.</p>
                </div>

                <section className="city-filters">
                  <div className="city-filters__toolbar">
                    <label className="city-filters__field city-filters__field--sort">
                      <span>Sort by</span>
                      <select
                        value={sortBy}
                        onChange={(event) => setSortBy(event.target.value)}
                      >
                        <option value="best-premarital">Best for premarital</option>
                        <option value="verified-details">Most complete profiles</option>
                        <option value="price-low">Lowest price</option>
                        <option value="faith-based">Faith-based first</option>
                        <option value="online">Online first</option>
                      </select>
                    </label>
                    <p className="city-filters__hint">
                      Ranking uses explicit profile signals like premarital focus, methods listed, and detail completeness.
                    </p>
                  </div>

                  <div className="city-filters__grid">
                    <label className="city-filters__field">
                      <span>Premarital focus</span>
                      <select
                        value={directoryFilters.premarital}
                        onChange={(event) => setDirectoryFilters((prev) => ({ ...prev, premarital: event.target.value }))}
                      >
                        <option value="all">All couples counselors</option>
                        <option value="focused">Premarital-focused only</option>
                      </select>
                    </label>

                    <label className="city-filters__field">
                      <span>Method / program</span>
                      <select
                        value={directoryFilters.method}
                        onChange={(event) => setDirectoryFilters((prev) => ({ ...prev, method: event.target.value }))}
                      >
                        <option value="all">Any method</option>
                        {methodOptions.map((method) => (
                          <option key={method.value} value={method.value}>
                            {method.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="city-filters__field">
                      <span>Provider type</span>
                      <select
                        value={directoryFilters.providerType}
                        onChange={(event) => setDirectoryFilters((prev) => ({ ...prev, providerType: event.target.value }))}
                      >
                        <option value="all">Any type</option>
                        <option value="clergy">Clergy &amp; Faith-Based</option>
                        <option value="therapist">Licensed Therapists</option>
                        <option value="coach">Coaches &amp; Facilitators</option>
                      </select>
                    </label>

                    <label className="city-filters__field">
                      <span>Faith</span>
                      <select
                        value={directoryFilters.faith}
                        onChange={(event) => setDirectoryFilters((prev) => ({ ...prev, faith: event.target.value }))}
                      >
                        <option value="all">Any faith</option>
                        {faithOptions.map((faithValue) => (
                          <option key={faithValue} value={faithValue}>
                            {formatFaithTradition(faithValue)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="city-filters__field">
                      <span>Program style</span>
                      <select
                        value={directoryFilters.programStyle}
                        onChange={(event) => setDirectoryFilters((prev) => ({ ...prev, programStyle: event.target.value }))}
                      >
                        <option value="all">Any format</option>
                        <option value="structured">Structured premarital program</option>
                        <option value="flexible">Flexible counseling format</option>
                      </select>
                    </label>

                    <label className="city-filters__field">
                      <span>Session type</span>
                      <select
                        value={directoryFilters.sessionType}
                        onChange={(event) => setDirectoryFilters((prev) => ({ ...prev, sessionType: event.target.value }))}
                      >
                        <option value="all">Online or in-person</option>
                        <option value="online">Online</option>
                        <option value="in-person">In-person</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </label>

                    <label className="city-filters__field">
                      <span>LGBTQ+</span>
                      <select
                        value={directoryFilters.lgbtq}
                        onChange={(event) => setDirectoryFilters((prev) => ({ ...prev, lgbtq: event.target.value }))}
                      >
                        <option value="all">Any</option>
                        <option value="affirming">Affirming only</option>
                      </select>
                    </label>

                    <label className="city-filters__field">
                      <span>Price</span>
                      <select
                        value={directoryFilters.price}
                        onChange={(event) => setDirectoryFilters((prev) => ({ ...prev, price: event.target.value }))}
                      >
                        <option value="all">Any price</option>
                        <option value="free">Free / Donation-based</option>
                        <option value="under150">Under $150</option>
                        <option value="150to250">$150-$250</option>
                        <option value="250plus">$250+</option>
                        <option value="unknown">Not listed</option>
                      </select>
                    </label>

                    <label className="city-filters__field">
                      <span>Insurance</span>
                      <select
                        value={directoryFilters.insurance}
                        onChange={(event) => setDirectoryFilters((prev) => ({ ...prev, insurance: event.target.value }))}
                      >
                        <option value="all">Any</option>
                        <option value="accepts">Accepts insurance</option>
                        <option value="selfpay">Self-pay only</option>
                      </select>
                    </label>

                    <label className="city-filters__field">
                      <span>Verified details</span>
                      <select
                        value={directoryFilters.verified}
                        onChange={(event) => setDirectoryFilters((prev) => ({ ...prev, verified: event.target.value }))}
                      >
                        <option value="all">All profiles</option>
                        <option value="details">License + format + price listed</option>
                      </select>
                    </label>

                    <label className="city-filters__field">
                      <span>Schedule</span>
                      <select
                        value={directoryFilters.schedule}
                        onChange={(event) => setDirectoryFilters((prev) => ({ ...prev, schedule: event.target.value }))}
                      >
                        <option value="all">Any schedule</option>
                        <option value="evenings-weekends">Evenings / weekends</option>
                      </select>
                    </label>

                    {neighborhoodOptions.length > 0 && (
                      <label className="city-filters__field">
                        <span>Neighborhood / ZIP</span>
                        <select
                          value={directoryFilters.neighborhood}
                          onChange={(event) => setDirectoryFilters((prev) => ({ ...prev, neighborhood: event.target.value }))}
                        >
                          <option value="all">Any area</option>
                          {neighborhoodOptions.map((zip) => (
                            <option key={zip} value={zip}>
                              {zip}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}

                    <label className="city-filters__field">
                      <span>Availability</span>
                      <select
                        value={directoryFilters.availability}
                        onChange={(event) => setDirectoryFilters((prev) => ({ ...prev, availability: event.target.value }))}
                      >
                        <option value="all">Any availability status</option>
                        <option value="accepting">Accepting (claimed profiles)</option>
                        <option value="limited">Limited (claimed profiles)</option>
                      </select>
                    </label>
                  </div>
                  <div className="city-filters__footer">
                    <p>
                      Showing <strong>{sortedProfiles.length}</strong> of <strong>{profiles.length}</strong> counselors
                    </p>
                    <button
                      type="button"
                      className="btn btn-outline city-filters__clear"
                      onClick={clearDirectoryFilters}
                    >
                      Reset filters
                    </button>
                  </div>
                </section>

                {sortedProfiles.length === 0 ? (
                  <div className="city-filter-empty">
                    <h3>No counselors match these filters yet</h3>
                    <p>Try broadening your filters to see more options in {cityName}.</p>
                  </div>
                ) : (
                  <>
                    {groupedFilteredProfiles.therapist.length > 0 && (
                      <div className="city-role-group" style={{ marginBottom: '3rem' }}>
                        <h3 className="city-role-heading" style={{
                          fontSize: '1.35rem',
                          fontWeight: 600,
                          marginBottom: '1rem',
                          color: '#1a1a2e',
                          borderBottom: '2px solid #0e5e5e',
                          paddingBottom: '0.5rem',
                          letterSpacing: '-0.01em'
                        }}>
                          Licensed Therapists & Counselors
                          <span style={{ fontSize: '0.85rem', fontWeight: 400, color: '#6b7280', marginLeft: '8px' }}>
                            ({groupedFilteredProfiles.therapist.length})
                          </span>
                        </h3>
                        <ProfileList
                          profiles={groupedFilteredProfiles.therapist}
                          loading={false}
                          error={null}
                        />
                      </div>
                    )}

                    {groupedFilteredProfiles.clergy.length > 0 && (
                      <div className="city-role-group" style={{ marginBottom: '3rem' }}>
                        <h3 className="city-role-heading" style={{
                          fontSize: '1.35rem',
                          fontWeight: 600,
                          marginBottom: '1rem',
                          color: '#1a1a2e',
                          borderBottom: '2px solid #0e5e5e',
                          paddingBottom: '0.5rem',
                          letterSpacing: '-0.01em'
                        }}>
                          Clergy & Faith-Based Marriage Preparation
                          <span style={{ fontSize: '0.85rem', fontWeight: 400, color: '#6b7280', marginLeft: '8px' }}>
                            ({groupedFilteredProfiles.clergy.length})
                          </span>
                        </h3>
                        <ProfileList
                          profiles={groupedFilteredProfiles.clergy}
                          loading={false}
                          error={null}
                        />
                      </div>
                    )}

                    {groupedFilteredProfiles.coach.length > 0 && (
                      <div className="city-role-group" style={{ marginBottom: '3rem' }}>
                        <h3 className="city-role-heading" style={{
                          fontSize: '1.35rem',
                          fontWeight: 600,
                          marginBottom: '1rem',
                          color: '#1a1a2e',
                          borderBottom: '2px solid #0e5e5e',
                          paddingBottom: '0.5rem',
                          letterSpacing: '-0.01em'
                        }}>
                          Relationship Coaches
                          <span style={{ fontSize: '0.85rem', fontWeight: 400, color: '#6b7280', marginLeft: '8px' }}>
                            ({groupedFilteredProfiles.coach.length})
                          </span>
                        </h3>
                        <ProfileList
                          profiles={groupedFilteredProfiles.coach}
                          loading={false}
                          error={null}
                        />
                      </div>
                    )}

                    {groupedFilteredProfiles.other.length > 0 && (
                      <div className="city-role-group" style={{ marginBottom: '3rem' }}>
                        <h3 className="city-role-heading" style={{
                          fontSize: '1.35rem',
                          fontWeight: 600,
                          marginBottom: '1rem',
                          color: '#1a1a2e',
                          borderBottom: '2px solid #0e5e5e',
                          paddingBottom: '0.5rem',
                          letterSpacing: '-0.01em'
                        }}>
                          Other Marriage Preparation Professionals
                          <span style={{ fontSize: '0.85rem', fontWeight: 400, color: '#6b7280', marginLeft: '8px' }}>
                            ({groupedFilteredProfiles.other.length})
                          </span>
                        </h3>
                        <ProfileList
                          profiles={groupedFilteredProfiles.other}
                          loading={false}
                          error={null}
                        />
                      </div>
                    )}

                    {sortedProfiles.length >= 3 && (
                      <details className="city-secondary-inquiry">
                        <summary>Optional: pick up to 5 counselors to contact at once</summary>
                        <MultiProviderInquiryForm
                          cityName={cityName}
                          stateName={stateName}
                          stateSlug={state}
                          citySlug={city}
                          providers={sortedProfiles}
                        />
                      </details>
                    )}
                  </>
                )}

                {/* Browse by Specialty Section - Interlinking Strategy */}
                <SpecialtiesList stateSlug={state} citySlug={city} />

                {/* Nearby Cities - Critical for internal linking & SEO */}
                {stateConfig?.major_cities && stateConfig.major_cities.length > 1 && (
                  <div style={{
                    marginTop: 'var(--space-12)',
                    padding: 'var(--space-8)',
                    background: 'var(--gray-50)',
                    borderRadius: 'var(--radius-lg)'
                  }}>
                    <h3 style={{ marginBottom: 'var(--space-4)' }}>
                      Premarital Counseling in Other {stateName} Cities
                    </h3>
                    <p style={{ marginBottom: 'var(--space-6)', color: 'var(--text-secondary)' }}>
                      Also serving engaged couples throughout {stateName}
                    </p>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                      gap: 'var(--space-3)'
                    }}>
                      {stateConfig.major_cities
                        .filter(c => c.toLowerCase().replace(/\s+/g, '-') !== city)
                        .slice(0, 8)
                        .map(cityName => {
                          const citySlug = cityName.toLowerCase().replace(/\s+/g, '-')
                          return (
                            <Link
                              key={citySlug}
                              to={`/premarital-counseling/${state}/${citySlug}`}
                              style={{
                                padding: 'var(--space-3)',
                                background: 'white',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid #e5e7eb',
                                textDecoration: 'none',
                                color: 'var(--color-primary)',
                                fontSize: '0.875rem',
                                transition: 'all 0.2s',
                                textAlign: 'center'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)'
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.boxShadow = 'none'
                              }}
                            >
                              {cityName}
                            </Link>
                          )
                        })}
                    </div>
                    <div style={{ marginTop: 'var(--space-6)', textAlign: 'center' }}>
                      <Link
                        to={`/premarital-counseling/${state}`}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.875rem' }}
                      >
                        View All {stateName} Counselors →
                      </Link>
                    </div>
                  </div>
                )}

                {/* Decision Help - More Valuable Than Generic Content */}
                <HowToChooseSection cityName={cityName} stateAbbr={stateConfig?.abbr} />

                {/* City-specific FAQ for rich results */}
                <div style={{ marginTop: 'var(--space-12)' }}>
                  <FAQ
                    faqs={cityFAQs}
                    title={`Premarital Counseling in ${cityName} — Frequently Asked Questions`}
                    description={`Common questions about premarital counseling in ${cityName}, ${stateName} for engaged couples`}
                    showSearch={false}
                    showAside={false}
                  />
                </div>

                {/* External Authority Resources for E-E-A-T */}
                <div style={{
                  marginTop: 'var(--space-8)',
                  padding: 'var(--space-6)',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--gray-200)'
                }}>
                  <h3 style={{
                    fontSize: 'var(--text-lg)',
                    marginBottom: 'var(--space-4)',
                    color: 'var(--text-primary)'
                  }}>
                    Further Resources on Premarital Counseling
                  </h3>
                  <p style={{
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)',
                    marginBottom: 'var(--space-4)'
                  }}>
                    For additional information on premarital counseling and marriage preparation, consult these authoritative sources:
                  </p>
                  <ul style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-3)'
                  }}>
                    <li>
                      <a
                        href="https://www.aamft.org/Consumer_Updates/Premarital_Counseling.aspx"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: 'var(--color-primary)',
                          fontWeight: '500',
                          textDecoration: 'underline'
                        }}
                      >
                        AAMFT: Premarital Counseling Guide
                      </a>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>
                        American Association for Marriage and Family Therapy
                      </span>
                    </li>
                    <li>
                      <a
                        href="https://www.apa.org/topics/marriage-divorce"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: 'var(--color-primary)',
                          fontWeight: '500',
                          textDecoration: 'underline'
                        }}
                      >
                        APA: Marriage & Divorce Resources
                      </a>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>
                        American Psychological Association
                      </span>
                    </li>
                    <li>
                      <a
                        href="https://www.gottman.com/couples/premarital/"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: 'var(--color-primary)',
                          fontWeight: '500',
                          textDecoration: 'underline'
                        }}
                      >
                        Gottman Institute: Premarital Resources
                      </a>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>
                        Research-based relationship guidance
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Provider CTA for Local SEO + Supply Growth */}
                <div style={{
                  marginTop: 'var(--space-8)',
                  padding: 'var(--space-6)',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                  borderRadius: 'var(--radius-lg)',
                  color: 'white',
                  textAlign: 'center'
                }}>
                  <h3 style={{
                    fontSize: 'var(--text-xl)',
                    marginBottom: 'var(--space-3)',
                    color: 'white'
                  }}>
                    Are you a premarital counselor in {cityName}?
                  </h3>
                  <p style={{
                    fontSize: '0.95rem',
                    marginBottom: 'var(--space-4)',
                    opacity: 0.95
                  }}>
                    Join our directory and connect with engaged couples looking for premarital counseling and marriage preparation services in {cityName}, {stateName}.
                  </p>
                  <Link
                    to={`/professional/signup?signup_source=city_page&city=${encodeURIComponent(cityName)}&state=${encodeURIComponent(stateName)}`}
                    rel="nofollow"
                    style={{
                      display: 'inline-block',
                      padding: 'var(--space-3) var(--space-6)',
                      background: 'white',
                      color: 'var(--teal)',
                      fontWeight: '600',
                      borderRadius: 'var(--radius-md)',
                      textDecoration: 'none',
                      transition: 'transform 0.2s ease'
                    }}
                    onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    Create Your Free Profile
                  </Link>
                  <p style={{
                    fontSize: '0.8rem',
                    marginTop: 'var(--space-3)',
                    opacity: 0.8
                  }}>
                    Free listing • Instant visibility • No commitment required
                  </p>
                </div>

              </>
            ) : (
              <div className="city-empty">
                <div className="city-empty__card">
                  <p className="section-eyebrow">New in this city</p>
                  <h2>No premarital counselors listed in {cityName} yet</h2>
                  <p className="city-empty__lead">
                    We are onboarding providers in {cityName}. In the meantime, browse nearby cities or all listings in {stateName}.
                  </p>
                  <div className="city-empty__actions">
                    <Link to={`/premarital-counseling/${state}`} className="city-empty__button city-empty__button--primary">
                      Browse {stateName}
                    </Link>
                    <Link to="/premarital-counseling" className="city-empty__button city-empty__button--ghost">
                      All Cities
                    </Link>
                  </div>
                  {nearbyCities.length > 0 && (
                    <div className="city-empty__nearby">
                      <p className="city-empty__nearby-title">Nearby cities in {stateName}</p>
                      <div className="city-empty__nearby-list">
                        {nearbyCities.map((nearbyCityName) => {
                          const nearbySlug = nearbyCityName.toLowerCase().replace(/\s+/g, '-')
                          return (
                            <Link
                              key={nearbySlug}
                              to={`/premarital-counseling/${state}/${nearbySlug}`}
                              className="city-empty__nearby-link"
                            >
                              {nearbyCityName}
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  <div className="city-empty__note">
                    <p>Are you a provider in {cityName}?</p>
                    <Link to="/claim-profile" className="city-empty__join-link">
                      List your practice
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConciergeLeadForm
        isOpen={isConciergeOpen}
        onClose={() => setIsConciergeOpen(false)}
        defaultLocation={`${cityName}, ${stateConfig?.abbr || stateName}`}
      />

      {/* Sticky mobile CTA — appears after scrolling past hero */}
      {hasProfiles && (
        <div
          className="city-sticky-cta"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 90,
            background: '#fff',
            borderTop: '1px solid var(--gray-200, #e5e7eb)',
            padding: '10px 16px',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            boxShadow: '0 -2px 8px rgba(0,0,0,0.08)'
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', lineHeight: 1.2 }}>
              {profiles.length} counselors in {cityName}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--gray-500, #6b7280)' }}>
              Free to contact — no fees
            </div>
          </div>
          <button
            onClick={() => setIsConciergeOpen(true)}
            className="btn btn-primary"
            style={{ whiteSpace: 'nowrap', padding: '8px 16px', fontSize: '0.85rem' }}
          >
            Get Matched Free
          </button>
        </div>
      )}
    </div>
  )
}

export default CityPage
