/**
 * Profile analytics utilities — shared across CityPage, StatePage, CityDataSummary.
 * Extracted from CityPage.js to avoid duplication.
 */

export const asArray = (value) => {
  if (Array.isArray(value)) return value
  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map((item) => item.trim()).filter(Boolean)
  }
  return []
}

export const toBool = (value) => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  if (typeof value === 'string') {
    return ['true', '1', 'yes'].includes(value.trim().toLowerCase())
  }
  return false
}

export const extractLicenseType = (profile) => {
  const text = [
    profile?.profession,
    ...asArray(profile?.credentials),
    ...asArray(profile?.certifications)
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

export const hasAvailabilityData = (profile) => {
  const value = profile?.accepting_new_clients
  if (value === true || value === false) return true
  if (typeof value === 'number') return value === 0 || value === 1
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return ['true', 'false', '1', '0', 'yes', 'no'].includes(normalized)
  }
  return false
}

export const getAvailabilityState = (profile) => {
  const claimed = toBool(profile?.is_claimed)
  const hasData = hasAvailabilityData(profile)

  if (!claimed || !hasData) {
    return { label: 'unverified', rank: 0, known: false, isAccepting: false }
  }

  if (toBool(profile?.accepting_new_clients)) {
    return { label: 'accepting', rank: 3, known: true, isAccepting: true }
  }

  return { label: 'limited', rank: 2, known: true, isAccepting: false }
}

export const getProfileRole = (profile) => {
  const profession = String(profile?.profession || '').toLowerCase()

  const isClergy = ['clergy', 'pastor', 'priest', 'minister', 'reverend', 'deacon', 'chaplain', 'rabbi', 'pre-cana'].some((term) => profession.includes(term))
  if (isClergy) return 'clergy'

  const isCoach = ['coach', 'facilitator'].some((term) => profession.includes(term))
  if (isCoach) return 'coach'

  const isTherapist = ['therapist', 'lmft', 'lpc', 'lcsw', 'psychologist', 'counselor'].some((term) => profession.includes(term))
  if (isTherapist) return 'therapist'

  return 'other'
}

export const groupProfilesByRole = (profiles = []) => {
  const grouped = { therapist: [], clergy: [], coach: [], other: [] }
  profiles.forEach((profile) => {
    grouped[getProfileRole(profile)].push(profile)
  })
  return grouped
}

export const formatFaithTradition = (value) => {
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

export const formatTypeList = (items = []) => {
  if (items.length === 0) return 'premarital counselors'
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}

export const getPriceMidpoint = (profile) => {
  const min = Number(profile?.session_fee_min) > 0 ? Number(profile.session_fee_min) / 100 : null
  const max = Number(profile?.session_fee_max) > 0 ? Number(profile.session_fee_max) / 100 : null
  if (min && max) return (min + max) / 2
  return min || max || null
}

export const parsePriceRangeText = (value) => {
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

export const getProfilePriceBounds = (profile) => {
  const minFee = Number(profile?.session_fee_min) > 0 ? Math.round(Number(profile.session_fee_min) / 100) : null
  const maxFee = Number(profile?.session_fee_max) > 0 ? Math.round(Number(profile.session_fee_max) / 100) : null

  if (minFee && maxFee) return { min: Math.min(minFee, maxFee), max: Math.max(minFee, maxFee) }
  if (minFee) return { min: minFee, max: minFee }
  if (maxFee) return { min: maxFee, max: maxFee }

  return parsePriceRangeText(profile?.pricing_range)
}

export const roundToNearestFive = (value) => Math.round(value / 5) * 5

export const getDirectoryPriceInsights = (profiles = []) => {
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

export const getSessionTypes = (profile) => {
  const raw = asArray(profile?.session_types).map((type) => String(type).toLowerCase())
  const values = new Set(raw)
  if (values.has('online') && values.has('in-person')) values.add('hybrid')
  if (values.has('both')) values.add('hybrid')
  return values
}

export const hasInsurance = (profile) => {
  const accepted = asArray(profile?.insurance_accepted).map((item) => String(item).toLowerCase())
  if (accepted.length === 0) return false
  return accepted.some((item) => item !== 'self-pay only')
}

export const isSelfPayOnly = (profile) => {
  const accepted = asArray(profile?.insurance_accepted).map((item) => String(item).toLowerCase())
  if (accepted.length === 0) return true
  return accepted.every((item) => item === 'self-pay only')
}

export const METHOD_FILTERS = [
  { value: 'gottman', label: 'Gottman Method', keywords: ['gottman'] },
  { value: 'eft', label: 'Emotionally Focused (EFT)', keywords: ['emotionally focused', 'eft'] },
  { value: 'prepare-enrich', label: 'PREPARE/ENRICH', keywords: ['prepare/enrich', 'prepare enrich', 'prepare-enrich'] },
  { value: 'symbis', label: 'SYMBIS', keywords: ['symbis'] },
  { value: 'foccus', label: 'FOCCUS', keywords: ['foccus'] },
  { value: 'pre-cana', label: 'Pre-Cana', keywords: ['pre-cana', 'precana'] },
  { value: 'faith-based', label: 'Faith-Based', keywords: ['faith-based', 'faith based', 'christian', 'catholic', 'church'] }
]

export const PREMARITAL_KEYWORDS = [
  'premarital',
  'pre-marital',
  'pre marriage',
  'engaged couple',
  'marriage prep',
  'marriage preparation',
  'before wedding'
]

export const PROGRAM_KEYWORDS = [
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

export const LGBTQ_KEYWORDS = ['lgbtq', 'affirming', 'queer', 'same-sex', 'same sex']
export const EVENING_WEEKEND_KEYWORDS = ['evening', 'after work', 'after 5', 'after 6', 'weekend', 'saturday', 'sunday']

export const toTextBlob = (profile) => {
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

export const includesAny = (text, keywords = []) => keywords.some((keyword) => text.includes(keyword))

export const getMethodTags = (profile, textBlob) => {
  const tags = new Set()
  METHOD_FILTERS.forEach((method) => {
    if (includesAny(textBlob, method.keywords)) {
      tags.add(method.value)
    }
  })

  if (profile?.faith_tradition && profile.faith_tradition !== 'secular') {
    tags.add('faith-based')
  }

  return Array.from(tags)
}

export const hasPremaritalFocus = (profile, textBlob) => {
  const specialtyMatch = asArray(profile?.specialties).some((item) => /premarital|pre[-\s]?marriage|marriage prep/i.test(String(item)))
  const clientFocusMatch = asArray(profile?.client_focus).some((item) => /engaged|newly engaged|wedding|premarital/i.test(String(item)))
  return specialtyMatch || clientFocusMatch || includesAny(textBlob, PREMARITAL_KEYWORDS)
}

export const hasStructuredProgram = (profile, textBlob) => {
  const hasMethod = asArray(profile?.treatment_approaches).length > 0 || asArray(profile?.certifications).length > 0
  return hasMethod || includesAny(textBlob, PROGRAM_KEYWORDS)
}

export const supportsLgbtq = (profile, textBlob) => {
  const specialtyMatch = asArray(profile?.specialties).some((item) => /lgbtq|affirming|queer/i.test(String(item)))
  const focusMatch = asArray(profile?.client_focus).some((item) => /lgbtq|queer/i.test(String(item)))
  return specialtyMatch || focusMatch || includesAny(textBlob, LGBTQ_KEYWORDS)
}

export const hasEveningWeekendAvailability = (profile, textBlob) => {
  return includesAny(textBlob, EVENING_WEEKEND_KEYWORDS)
}

export const getTierPriority = (profile) => {
  const order = { area_spotlight: 1, local_featured: 2, community: 3 }
  return order[profile?.tier] || 99
}

export const enrichPremaritalSignals = (profile) => {
  const textBlob = toTextBlob(profile)
  const methodTags = getMethodTags(profile, textBlob)
  const premaritalFocused = hasPremaritalFocus(profile, textBlob)
  const structuredProgram = hasStructuredProgram(profile, textBlob)
  const lgbtqAffirming = supportsLgbtq(profile, textBlob)
  const eveningWeekend = hasEveningWeekendAvailability(profile, textBlob)
  const availabilityState = getAvailabilityState(profile)
  const hasPriceData = Boolean(getProfilePriceBounds(profile))
  const hasInsuranceData = asArray(profile?.insurance_accepted).length > 0
  const hasSessionData = asArray(profile?.session_types).length > 0
  const licenseType = extractLicenseType(profile)
  const detailsVerified = Boolean(licenseType && hasSessionData && hasPriceData)

  const fitSignals = []

  if (premaritalFocused) {
    fitSignals.push({ reason: 'Premarital specialty listed', points: 26 })
  }

  if (structuredProgram) {
    fitSignals.push({ reason: 'Structured program evidence', points: 12 })
  }

  if (methodTags.length > 0) {
    const methodLabels = METHOD_FILTERS
      .filter((method) => methodTags.includes(method.value))
      .slice(0, 2)
      .map((method) => method.label)
    fitSignals.push({
      reason: methodLabels.length > 0 ? `Methods listed: ${methodLabels.join(', ')}` : 'Method details listed',
      points: Math.min(14, methodTags.length * 7)
    })
  }

  if (hasSessionData) {
    fitSignals.push({ reason: 'Session format listed', points: 7 })
  }

  if (hasPriceData) {
    fitSignals.push({ reason: 'Pricing listed', points: 7 })
  }

  if (hasInsuranceData) {
    fitSignals.push({ reason: 'Insurance details listed', points: 4 })
  }

  if (availabilityState.known) {
    fitSignals.push({
      reason: availabilityState.isAccepting ? 'Accepting new clients' : 'Availability status listed',
      points: availabilityState.isAccepting ? 6 : 3
    })
  }

  if (licenseType) {
    fitSignals.push({ reason: `License type listed (${licenseType})`, points: 6 })
  }

  if (lgbtqAffirming) {
    fitSignals.push({ reason: 'LGBTQ+ affirming signal', points: 3 })
  }

  if (eveningWeekend) {
    fitSignals.push({ reason: 'Evenings/weekends signal', points: 3 })
  }

  if (Number(profile?.years_experience) > 0) {
    fitSignals.push({
      reason: `${profile.years_experience}+ years experience`,
      points: Math.min(7, Math.floor(Number(profile.years_experience) / 3))
    })
  }

  const rawScore = fitSignals.reduce((sum, signal) => sum + signal.points, 0)
  const premaritalFitScore = Math.max(18, Math.min(96, Math.round(rawScore)))
  const fitReasonLabels = fitSignals
    .sort((a, b) => b.points - a.points)
    .map((signal) => signal.reason)
    .slice(0, 4)

  return {
    ...profile,
    premaritalFitScore,
    premaritalFocused,
    structuredProgram,
    methodTags,
    lgbtqAffirming,
    eveningWeekend,
    detailsVerified,
    availabilityState,
    hasPriceData,
    hasInsuranceData,
    licenseType,
    fitReasonLabels
  }
}

/**
 * Compute aggregated stats from enriched profiles for prose generation.
 * Expects profiles already passed through enrichPremaritalSignals().
 */
export const computeCityStats = (enrichedProfiles = []) => {
  const grouped = groupProfilesByRole(enrichedProfiles)

  const priceInsights = getDirectoryPriceInsights(enrichedProfiles)

  const onlineCount = enrichedProfiles.filter((p) => {
    const types = getSessionTypes(p)
    return types.has('online') || types.has('hybrid')
  }).length

  const faithBasedCount = enrichedProfiles.filter((p) =>
    p.methodTags?.includes('faith-based') ||
    (p.faith_tradition && p.faith_tradition !== 'secular')
  ).length

  const premaritalFocusedCount = enrichedProfiles.filter((p) => p.premaritalFocused).length

  // Aggregate method counts (exclude faith-based from method list)
  const methodCounts = {}
  METHOD_FILTERS.filter((m) => m.value !== 'faith-based').forEach((method) => {
    const count = enrichedProfiles.filter((p) => p.methodTags?.includes(method.value)).length
    if (count > 0) {
      methodCounts[method.label] = count
    }
  })
  const methods = Object.entries(methodCounts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)

  // Aggregate license type counts
  const licenseCounts = {}
  enrichedProfiles.forEach((p) => {
    if (p.licenseType) {
      licenseCounts[p.licenseType] = (licenseCounts[p.licenseType] || 0) + 1
    }
  })
  const licenseTypes = Object.entries(licenseCounts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)

  const acceptingCount = enrichedProfiles.filter((p) =>
    p.availabilityState?.known && p.availabilityState?.isAccepting
  ).length

  const insuranceCount = enrichedProfiles.filter((p) => hasInsurance(p)).length

  const lgbtqAffirmingCount = enrichedProfiles.filter((p) => p.lgbtqAffirming).length

  return {
    total: enrichedProfiles.length,
    therapists: grouped.therapist.length,
    clergy: grouped.clergy.length,
    coaches: grouped.coach.length,
    priceRange: {
      min: priceInsights.min,
      max: priceInsights.max,
      count: priceInsights.count,
      source: priceInsights.source
    },
    onlineCount,
    faithBasedCount,
    premaritalFocusedCount,
    methods,
    licenseTypes,
    acceptingCount,
    insuranceCount,
    lgbtqAffirmingCount
  }
}
