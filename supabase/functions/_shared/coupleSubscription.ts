const BASE_URL = 'https://www.weddingcounselors.com'

const STATE_NAME_BY_ABBR = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DC: 'District of Columbia',
  DE: 'Delaware',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  IA: 'Iowa',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  MA: 'Massachusetts',
  MD: 'Maryland',
  ME: 'Maine',
  MI: 'Michigan',
  MN: 'Minnesota',
  MO: 'Missouri',
  MS: 'Mississippi',
  MT: 'Montana',
  NC: 'North Carolina',
  ND: 'North Dakota',
  NE: 'Nebraska',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NV: 'Nevada',
  NY: 'New York',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VA: 'Virginia',
  VT: 'Vermont',
  WA: 'Washington',
  WI: 'Wisconsin',
  WV: 'West Virginia',
  WY: 'Wyoming',
}

const STATE_ABBR_BY_NORMALIZED_NAME = Object.fromEntries(
  Object.entries(STATE_NAME_BY_ABBR).map(([abbr, name]) => [name.toLowerCase(), abbr])
)

const STATE_SLUG_BY_ABBR = Object.fromEntries(
  Object.entries(STATE_NAME_BY_ABBR).map(([abbr, name]) => [
    abbr,
    name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-'),
  ])
)

const normalizeText = (value) => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed || null
}

export const normalizeStateAbbr = (state) => {
  const normalized = normalizeText(state)
  if (!normalized) return null

  const upper = normalized.toUpperCase()
  if (STATE_NAME_BY_ABBR[upper]) return upper

  return STATE_ABBR_BY_NORMALIZED_NAME[normalized.toLowerCase()] || null
}

export const getStateName = (state) => {
  const abbr = normalizeStateAbbr(state)
  return abbr ? STATE_NAME_BY_ABBR[abbr] : null
}

export const getStateSlug = (state) => {
  const abbr = normalizeStateAbbr(state)
  return abbr ? STATE_SLUG_BY_ABBR[abbr] : null
}

export const getCitySlug = (city) => {
  const normalized = normalizeText(city)
  if (!normalized) return null

  return normalized
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export const buildLocationLabel = (city, state) => {
  const normalizedCity = normalizeText(city)
  const stateName = getStateName(state)

  if (normalizedCity && stateName) return `${normalizedCity}, ${stateName}`
  if (normalizedCity) return normalizedCity
  if (stateName) return stateName
  return 'your area'
}

export const buildDirectoryLink = (city, state) => {
  const stateSlug = getStateSlug(state)
  const citySlug = getCitySlug(city)

  if (stateSlug && citySlug) {
    return `${BASE_URL}/premarital-counseling/${stateSlug}/${citySlug}`
  }

  if (stateSlug) {
    return `${BASE_URL}/premarital-counseling/${stateSlug}`
  }

  return `${BASE_URL}/premarital-counseling`
}

export const normalizeCoupleInterest = (interest) => {
  if (interest === 'officiant' || interest === 'both') return interest
  return 'counseling'
}

export const normalizeCoupleSubscription = (input) => {
  const email = normalizeText(input.email)?.toLowerCase()
  if (!email) {
    throw new Error('Email required')
  }

  const city = normalizeText(input.city)
  const stateAbbr = normalizeStateAbbr(input.state)
  const stateName = stateAbbr ? STATE_NAME_BY_ABBR[stateAbbr] : null

  return {
    email,
    firstName: normalizeText(input.first_name),
    interest: normalizeCoupleInterest(input.interest),
    city,
    stateAbbr,
    stateName,
    sourcePage: normalizeText(input.source_page),
    locationLabel: buildLocationLabel(city, stateAbbr),
    directoryLink: buildDirectoryLink(city, stateAbbr),
  }
}
