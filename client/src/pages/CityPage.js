import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import ProfileList from '../components/profiles/ProfileList';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import Breadcrumbs, { generateBreadcrumbs } from '../components/common/Breadcrumbs';
import SEOHelmet from '../components/analytics/SEOHelmet';
import { trackLocationPageView } from '../components/analytics/GoogleAnalytics';
import { profileOperations } from '../lib/supabaseClient';
import { STATE_CONFIG, CITY_CONFIG, isAnchorCity } from '../data/locationConfig';
import SpecialtiesList from '../components/common/SpecialtiesList';
import LocationInsights from '../components/common/LocationInsights';
import FAQ from '../components/common/FAQ';
import HowToChooseSection from '../components/city/HowToChooseSection';
import MultiProviderInquiryForm from '../components/city/MultiProviderInquiryForm';
import '../assets/css/state-page.css';

const asArray = (value) => {
  if (Array.isArray(value)) return value
  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map((item) => item.trim()).filter(Boolean)
  }
  return []
}

const toBool = (value) => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  if (typeof value === 'string') {
    return ['true', '1', 'yes'].includes(value.trim().toLowerCase())
  }
  return false
}

const getProfileRole = (profile) => {
  const profession = String(profile?.profession || '').toLowerCase()

  const isClergy = ['clergy', 'pastor', 'priest', 'minister', 'reverend', 'deacon', 'chaplain', 'rabbi', 'pre-cana'].some((term) => profession.includes(term))
  if (isClergy) return 'clergy'

  const isCoach = ['coach', 'facilitator'].some((term) => profession.includes(term))
  if (isCoach) return 'coach'

  const isTherapist = ['therapist', 'lmft', 'lpc', 'lcsw', 'psychologist', 'counselor'].some((term) => profession.includes(term))
  if (isTherapist) return 'therapist'

  return 'other'
}

const groupProfilesByRole = (profiles = []) => {
  const grouped = { therapist: [], clergy: [], coach: [], other: [] }
  profiles.forEach((profile) => {
    grouped[getProfileRole(profile)].push(profile)
  })
  return grouped
}

const formatFaithTradition = (value) => {
  const labels = {
    secular: 'Secular',
    christian: 'Christian',
    catholic: 'Catholic',
    protestant: 'Protestant',
    jewish: 'Jewish',
    muslim: 'Muslim',
    interfaith: 'Interfaith',
    'all-faiths': 'All faiths'
  }
  return labels[value] || value
}

const formatTypeList = (items = []) => {
  if (items.length === 0) return 'premarital counselors'
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}

const getPriceMidpoint = (profile) => {
  const min = Number(profile?.session_fee_min) > 0 ? Number(profile.session_fee_min) / 100 : null
  const max = Number(profile?.session_fee_max) > 0 ? Number(profile.session_fee_max) / 100 : null
  if (min && max) return (min + max) / 2
  return min || max || null
}

const parsePriceRangeText = (value) => {
  if (!value) return null
  const matches = String(value).match(/\d{2,4}/g)
  if (!matches || matches.length === 0) return null
  const values = matches.map((entry) => Number(entry)).filter((entry) => Number.isFinite(entry) && entry > 0)
  if (values.length === 0) return null
  return {
    min: Math.min(...values),
    max: Math.max(...values)
  }
}

const getProfilePriceBounds = (profile) => {
  const minFee = Number(profile?.session_fee_min) > 0 ? Math.round(Number(profile.session_fee_min) / 100) : null
  const maxFee = Number(profile?.session_fee_max) > 0 ? Math.round(Number(profile.session_fee_max) / 100) : null

  if (minFee && maxFee) return { min: Math.min(minFee, maxFee), max: Math.max(minFee, maxFee) }
  if (minFee) return { min: minFee, max: minFee }
  if (maxFee) return { min: maxFee, max: maxFee }

  return parsePriceRangeText(profile?.pricing_range)
}

const roundToNearestFive = (value) => Math.round(value / 5) * 5

const getDirectoryPriceInsights = (profiles = []) => {
  const ranges = profiles
    .map((profile) => getProfilePriceBounds(profile))
    .filter((range) => range && Number.isFinite(range.min) && Number.isFinite(range.max))

  if (ranges.length === 0) {
    return {
      source: 'estimate',
      min: 150,
      max: 250,
      count: 0,
      label: '$150-$250'
    }
  }

  const min = Math.min(...ranges.map((range) => range.min))
  const max = Math.max(...ranges.map((range) => range.max))
  const boundedMin = Math.max(50, roundToNearestFive(min))
  const boundedMax = Math.max(boundedMin + 10, roundToNearestFive(max))

  return {
    source: 'directory',
    min: boundedMin,
    max: boundedMax,
    count: ranges.length,
    label: `$${boundedMin}-$${boundedMax}`
  }
}

const getSessionTypes = (profile) => {
  const raw = asArray(profile?.session_types).map((type) => String(type).toLowerCase())
  const values = new Set(raw)
  if (values.has('online') && values.has('in-person')) values.add('hybrid')
  if (values.has('both')) values.add('hybrid')
  return values
}

const hasInsurance = (profile) => {
  const accepted = asArray(profile?.insurance_accepted).map((item) => String(item).toLowerCase())
  if (accepted.length === 0) return false
  return accepted.some((item) => item !== 'self-pay only')
}

const isSelfPayOnly = (profile) => {
  const accepted = asArray(profile?.insurance_accepted).map((item) => String(item).toLowerCase())
  if (accepted.length === 0) return true
  return accepted.every((item) => item === 'self-pay only')
}

const METHOD_FILTERS = [
  { value: 'gottman', label: 'Gottman Method', keywords: ['gottman'] },
  { value: 'eft', label: 'Emotionally Focused (EFT)', keywords: ['emotionally focused', 'eft'] },
  { value: 'prepare-enrich', label: 'PREPARE/ENRICH', keywords: ['prepare/enrich', 'prepare enrich', 'prepare-enrich'] },
  { value: 'symbis', label: 'SYMBIS', keywords: ['symbis'] },
  { value: 'foccus', label: 'FOCCUS', keywords: ['foccus'] },
  { value: 'pre-cana', label: 'Pre-Cana', keywords: ['pre-cana', 'precana'] },
  { value: 'faith-based', label: 'Faith-Based', keywords: ['faith-based', 'faith based', 'christian', 'catholic', 'church'] }
]

const PREMARITAL_KEYWORDS = [
  'premarital',
  'pre-marital',
  'pre marriage',
  'engaged couple',
  'marriage prep',
  'marriage preparation',
  'before wedding'
]

const PROGRAM_KEYWORDS = [
  'program',
  'curriculum',
  'package',
  'assessment',
  '5-8 sessions',
  '6-8 sessions',
  'prepare/enrich',
  'foccus',
  'symbis',
  'gottman'
]

const LGBTQ_KEYWORDS = ['lgbtq', 'affirming', 'queer', 'same-sex', 'same sex']
const EVENING_WEEKEND_KEYWORDS = ['evening', 'after work', 'after 5', 'after 6', 'weekend', 'saturday', 'sunday']

const toTextBlob = (profile) => {
  return [
    profile?.profession,
    profile?.bio,
    profile?.approach,
    profile?.bio_approach,
    profile?.bio_ideal_client,
    profile?.bio_outcomes,
    JSON.stringify(profile?.office_hours || {}),
    ...asArray(profile?.specialties),
    ...asArray(profile?.client_focus),
    ...asArray(profile?.treatment_approaches),
    ...asArray(profile?.certifications),
    ...asArray(profile?.faqs).map((faq) => `${faq?.question || ''} ${faq?.answer || ''}`)
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

const includesAny = (text, keywords = []) => keywords.some((keyword) => text.includes(keyword))

const getMethodTags = (profile, textBlob) => {
  const tags = new Set()
  METHOD_FILTERS.forEach((method) => {
    if (includesAny(textBlob, method.keywords)) {
      tags.add(method.value)
    }
  })

  // Normalize explicit faith tradition into method tags
  if (profile?.faith_tradition && profile.faith_tradition !== 'secular') {
    tags.add('faith-based')
  }

  return Array.from(tags)
}

const hasPremaritalFocus = (profile, textBlob) => {
  const specialtyMatch = asArray(profile?.specialties).some((item) => /premarital|pre[-\s]?marriage|marriage prep/i.test(String(item)))
  const clientFocusMatch = asArray(profile?.client_focus).some((item) => /engaged|newly engaged|wedding|premarital/i.test(String(item)))
  return specialtyMatch || clientFocusMatch || includesAny(textBlob, PREMARITAL_KEYWORDS)
}

const hasStructuredProgram = (profile, textBlob) => {
  const hasMethod = asArray(profile?.treatment_approaches).length > 0 || asArray(profile?.certifications).length > 0
  return hasMethod || includesAny(textBlob, PROGRAM_KEYWORDS)
}

const supportsLgbtq = (profile, textBlob) => {
  const specialtyMatch = asArray(profile?.specialties).some((item) => /lgbtq|affirming|queer/i.test(String(item)))
  const focusMatch = asArray(profile?.client_focus).some((item) => /lgbtq|queer/i.test(String(item)))
  return specialtyMatch || focusMatch || includesAny(textBlob, LGBTQ_KEYWORDS)
}

const hasEveningWeekendAvailability = (profile, textBlob) => {
  return includesAny(textBlob, EVENING_WEEKEND_KEYWORDS)
}

const getTierPriority = (profile) => {
  const order = { area_spotlight: 1, local_featured: 2, community: 3 }
  return order[profile?.tier] || 99
}

const enrichPremaritalSignals = (profile) => {
  const textBlob = toTextBlob(profile)
  const methodTags = getMethodTags(profile, textBlob)
  const premaritalFocused = hasPremaritalFocus(profile, textBlob)
  const structuredProgram = hasStructuredProgram(profile, textBlob)
  const lgbtqAffirming = supportsLgbtq(profile, textBlob)
  const eveningWeekend = hasEveningWeekendAvailability(profile, textBlob)
  const sessionTypes = getSessionTypes(profile)

  let score = 0
  if (premaritalFocused) score += 48
  if (structuredProgram) score += 14
  if (methodTags.length > 0) score += Math.min(24, methodTags.length * 8)
  if (toBool(profile?.accepting_new_clients)) score += 7
  if (sessionTypes.has('online') || sessionTypes.has('hybrid')) score += 4
  if (lgbtqAffirming) score += 4
  if (Number(profile?.years_experience) > 0) score += Math.min(3, Math.floor(Number(profile.years_experience) / 5))

  const premaritalFitScore = Math.max(0, Math.min(100, score))

  return {
    ...profile,
    premaritalFitScore,
    premaritalFocused,
    structuredProgram,
    methodTags,
    lgbtqAffirming,
    eveningWeekend
  }
}

const CityPage = ({ stateOverride, cityOverride }) => {
  const params = useParams()
  const state = stateOverride || params.state
  const city = cityOverride || params.cityOrSlug
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortBy, setSortBy] = useState('best-premarital')
  const [directoryFilters, setDirectoryFilters] = useState({
    faith: 'all',
    sessionType: 'all',
    price: 'all',
    insurance: 'all',
    method: 'all',
    premarital: 'all',
    programStyle: 'all',
    lgbtq: 'all',
    schedule: 'all',
    neighborhood: 'all',
    availability: 'all'
  })

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
      if (directoryFilters.faith !== 'all' && profile.faith_tradition !== directoryFilters.faith) {
        return false
      }

      if (directoryFilters.sessionType !== 'all') {
        const sessionTypes = getSessionTypes(profile)
        if (!sessionTypes.has(directoryFilters.sessionType)) return false
      }

      if (directoryFilters.price !== 'all') {
        const priceMidpoint = getPriceMidpoint(profile)
        if (!priceMidpoint && directoryFilters.price !== 'unknown') return false
        if (directoryFilters.price === 'under150' && !(priceMidpoint < 150)) return false
        if (directoryFilters.price === '150to250' && !(priceMidpoint >= 150 && priceMidpoint <= 250)) return false
        if (directoryFilters.price === '250plus' && !(priceMidpoint > 250)) return false
        if (directoryFilters.price === 'unknown' && priceMidpoint) return false
      }

      if (directoryFilters.insurance === 'accepts' && !hasInsurance(profile)) {
        return false
      }

      if (directoryFilters.insurance === 'selfpay' && !isSelfPayOnly(profile)) {
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

      if (directoryFilters.availability === 'accepting' && !toBool(profile?.accepting_new_clients)) {
        return false
      }

      if (directoryFilters.availability === 'limited' && toBool(profile?.accepting_new_clients)) {
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
      } else if (sortBy === 'availability') {
        if (toBool(a.accepting_new_clients) !== toBool(b.accepting_new_clients)) {
          return Number(toBool(b.accepting_new_clients)) - Number(toBool(a.accepting_new_clients))
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
      return new Date(b.created_at) - new Date(a.created_at)
    })

    return sorted
  }, [filteredProfiles, sortBy])

  const groupedFilteredProfiles = useMemo(() => groupProfilesByRole(sortedProfiles), [sortedProfiles])

  const clearDirectoryFilters = () => {
    setDirectoryFilters({
      faith: 'all',
      sessionType: 'all',
      price: 'all',
      insurance: 'all',
      method: 'all',
      premarital: 'all',
      programStyle: 'all',
      lgbtq: 'all',
      schedule: 'all',
      neighborhood: 'all',
      availability: 'all'
    })
  }

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
        'url': profile.slug ? `https://www.weddingcounselors.com/premarital-counseling/${state}/${city}/${profile.slug}` : undefined
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
      answer: `Most engaged couples in ${cityName} complete 5-8 premarital counseling sessions over 2-3 months before their wedding. Programs like PREPARE-ENRICH and Gottman Method have structured timelines. ${timelineFaithSentence}`
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
        : { label: 'Premarital methods', detail: 'Gottman, EFT, PREPARE/ENRICH and more' },
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
        title={`Premarital & Marriage Counseling ${cityName}, ${stateConfig?.abbr || stateName} - ${profiles.length > 0 ? profiles.length : 'Top'} Professionals (2026)`}
        description={`Find ${profiles.length || 'top'} premarital counselors in ${cityName}, ${stateName}. Compare ${inventoryDescriptor}, filter by program method and availability, and contact directly. From $${costStartingAt}/session.`}
        keywords={seoKeywords}
        structuredData={structuredData}
        faqs={cityFAQs}
        noindex={shouldNoindex}
      />

      {/* City Header - Short & Focused on Conversion */}
      <section className="state-header city-header">
        <div className="container">
          <Breadcrumbs items={breadcrumbData} variant="on-hero" />
          <div className="state-header-content">
            <h1>Premarital Counseling in {cityName}, {stateName}</h1>
            <p className="lead city-hero-subtitle">
              Compare {profiles.length > 0 ? profiles.length : 'qualified'} {formatTypeList(providerTypeLabels)} in {cityName}. Browse profiles, see their focus, and reach out directly.
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
                    <Link to={`/premarital-counseling/${state}`} className="btn btn-primary btn-large">
                      Browse {stateName} Counselors
                    </Link>
                    <Link to="/premarital-counseling" className="btn btn-outline btn-large">
                      View All Cities
                    </Link>
                  </>
                ) : (
                  <button
                    onClick={() => document.getElementById('providers-list').scrollIntoView({ behavior: 'smooth' })}
                    className="btn btn-primary btn-large"
                  >
                    Browse {profiles.length} Counselors Below
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* City Content */}
      <div className="container">
        {/* Money SERP Insights Box */}
        <LocationInsights
          stateSlug={state}
          citySlug={city}
          profiles={profilesWithSignals}
          costEstimateOverride={sessionCostDisplayRange}
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
                        <option value="availability">Soonest availability</option>
                        <option value="price-low">Lowest price</option>
                        <option value="faith-based">Faith-based first</option>
                        <option value="online">Online first</option>
                      </select>
                    </label>
                    <p className="city-filters__hint">
                      Ranking uses premarital-specific signals like explicit premarital focus, structured programs, methods, and availability.
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
                        <option value="all">Any availability</option>
                        <option value="accepting">Accepting new clients</option>
                        <option value="limited">Limited availability</option>
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
                      <div style={{ marginBottom: 'var(--space-12)' }}>
                        <h3 style={{
                          fontSize: '1.5rem',
                          marginBottom: 'var(--space-4)',
                          color: 'var(--text-primary)',
                          borderBottom: '2px solid var(--color-primary)',
                          paddingBottom: 'var(--space-2)'
                        }}>
                          Licensed Therapists & Counselors
                        </h3>
                        <ProfileList
                          profiles={groupedFilteredProfiles.therapist}
                          loading={false}
                          error={null}
                        />
                      </div>
                    )}

                    {groupedFilteredProfiles.clergy.length > 0 && (
                      <div style={{ marginBottom: 'var(--space-12)' }}>
                        <h3 style={{
                          fontSize: '1.5rem',
                          marginBottom: 'var(--space-4)',
                          color: 'var(--text-primary)',
                          borderBottom: '2px solid var(--color-primary)',
                          paddingBottom: 'var(--space-2)'
                        }}>
                          Clergy & Faith-Based Marriage Preparation
                        </h3>
                        <ProfileList
                          profiles={groupedFilteredProfiles.clergy}
                          loading={false}
                          error={null}
                        />
                      </div>
                    )}

                    {groupedFilteredProfiles.coach.length > 0 && (
                      <div style={{ marginBottom: 'var(--space-12)' }}>
                        <h3 style={{
                          fontSize: '1.5rem',
                          marginBottom: 'var(--space-4)',
                          color: 'var(--text-primary)',
                          borderBottom: '2px solid var(--color-primary)',
                          paddingBottom: 'var(--space-2)'
                        }}>
                          Relationship Coaches
                        </h3>
                        <ProfileList
                          profiles={groupedFilteredProfiles.coach}
                          loading={false}
                          error={null}
                        />
                      </div>
                    )}

                    {groupedFilteredProfiles.other.length > 0 && (
                      <div style={{ marginBottom: 'var(--space-12)' }}>
                        <h3 style={{
                          fontSize: '1.5rem',
                          marginBottom: 'var(--space-4)',
                          color: 'var(--text-primary)',
                          borderBottom: '2px solid var(--color-primary)',
                          paddingBottom: 'var(--space-2)'
                        }}>
                          Other Marriage Preparation Professionals
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
                <HowToChooseSection cityName={cityName} />

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
    </div>
  )
}

export default CityPage
