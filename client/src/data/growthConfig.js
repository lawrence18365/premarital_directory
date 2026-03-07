export const PARTNER_AUDIENCES = [
  {
    value: 'officiant',
    label: 'Officiants',
    shortLabel: 'Officiant',
    medium: 'officiant',
    description: 'Share a city link in your booking flow or welcome packet.',
    route: '/for-officiants'
  },
  {
    value: 'church',
    label: 'Churches',
    shortLabel: 'Church',
    medium: 'church',
    description: 'Embed a search box on your marriage prep page.',
    route: '/for-churches'
  },
  {
    value: 'planner',
    label: 'Wedding Planners',
    shortLabel: 'Planner',
    medium: 'planner',
    description: 'Keep a referral link handy for couples who want next steps.',
    route: '/partners?audience=planner'
  },
  {
    value: 'community',
    label: 'Wedding Communities',
    shortLabel: 'Community',
    medium: 'community',
    description: 'Use tracked links in Reddit, Facebook groups, and local guides.',
    route: '/partners?audience=community'
  }
]

export const PARTNER_CITY_PRESETS = [
  { id: 'new-york-ny', city: 'New York City', citySlug: 'new-york', stateName: 'New York', stateAbbr: 'NY', stateSlug: 'new-york' },
  { id: 'los-angeles-ca', city: 'Los Angeles', citySlug: 'los-angeles', stateName: 'California', stateAbbr: 'CA', stateSlug: 'california' },
  { id: 'chicago-il', city: 'Chicago', citySlug: 'chicago', stateName: 'Illinois', stateAbbr: 'IL', stateSlug: 'illinois' },
  { id: 'dallas-tx', city: 'Dallas', citySlug: 'dallas', stateName: 'Texas', stateAbbr: 'TX', stateSlug: 'texas' },
  { id: 'atlanta-ga', city: 'Atlanta', citySlug: 'atlanta', stateName: 'Georgia', stateAbbr: 'GA', stateSlug: 'georgia' },
  { id: 'houston-tx', city: 'Houston', citySlug: 'houston', stateName: 'Texas', stateAbbr: 'TX', stateSlug: 'texas' },
  { id: 'phoenix-az', city: 'Phoenix', citySlug: 'phoenix', stateName: 'Arizona', stateAbbr: 'AZ', stateSlug: 'arizona' },
  { id: 'charlotte-nc', city: 'Charlotte', citySlug: 'charlotte', stateName: 'North Carolina', stateAbbr: 'NC', stateSlug: 'north-carolina' },
  { id: 'nashville-tn', city: 'Nashville', citySlug: 'nashville', stateName: 'Tennessee', stateAbbr: 'TN', stateSlug: 'tennessee' },
  { id: 'denver-co', city: 'Denver', citySlug: 'denver', stateName: 'Colorado', stateAbbr: 'CO', stateSlug: 'colorado' }
]

export const PARTNER_SPECIALTY_PRESETS = [
  {
    slug: 'none',
    label: 'All counselor types',
    description: 'Show therapists, clergy, coaches, and online options together.'
  },
  {
    slug: 'christian',
    label: 'Christian',
    description: 'Faith-based counseling rooted in Christian marriage prep.'
  },
  {
    slug: 'catholic',
    label: 'Catholic / Pre-Cana',
    description: 'Send couples straight to Catholic programs and parish-friendly providers.'
  },
  {
    slug: 'interfaith',
    label: 'Interfaith',
    description: 'Useful for officiants and planners serving mixed-faith couples.'
  },
  {
    slug: 'online',
    label: 'Online',
    description: 'Best for long-distance couples or markets with thin local supply.'
  }
]

export const TARGET_METRO_CLUSTERS = PARTNER_CITY_PRESETS

export const TARGET_SPECIALTY_CLUSTERS = [
  { slug: 'online', label: 'Online Counseling', matchTerms: ['online', 'virtual', 'telehealth', 'video'] },
  { slug: 'christian', label: 'Christian Counseling', matchTerms: ['christian', 'faith-based', 'biblical', 'church'] },
  { slug: 'catholic', label: 'Catholic / Pre-Cana', matchTerms: ['catholic', 'pre-cana', 'precana', 'foccus'] },
  { slug: 'interfaith', label: 'Interfaith', matchTerms: ['interfaith', 'mixed faith'] }
]

export const DISTRIBUTION_CHANNEL_OPTIONS = [
  {
    value: 'county-clerk',
    label: 'County clerks',
    cadence: 'This week',
    defaultAudience: 'community',
    summary: 'Pitch discount and state-law pages to clerk offices and marriage license resources.'
  },
  {
    value: 'claimed-counselors',
    label: 'Claimed counselors',
    cadence: 'This week',
    defaultAudience: 'community',
    summary: 'Ask claimed providers for backlinks, colleague referrals, and local introductions.'
  },
  {
    value: 'reddit',
    label: 'Reddit',
    cadence: 'Weekly',
    defaultAudience: 'community',
    summary: 'Answer live wedding-planning questions with city or discount pages.'
  },
  {
    value: 'facebook-groups',
    label: 'Facebook groups',
    cadence: 'Weekly',
    defaultAudience: 'community',
    summary: 'Use helpful city-specific posts in wedding groups and planning communities.'
  },
  {
    value: 'church-outreach',
    label: 'Church outreach',
    cadence: 'Weekly',
    defaultAudience: 'church',
    summary: 'Offer the widget to churches that already require marriage prep.'
  },
  {
    value: 'planner-outreach',
    label: 'Planner outreach',
    cadence: 'Weekly',
    defaultAudience: 'planner',
    summary: 'Give planners a clean city link for couples asking for counselor referrals.'
  },
  {
    value: 'quora-answer-sites',
    label: 'Quora / answer sites',
    cadence: 'Ongoing',
    defaultAudience: 'community',
    summary: 'Capture long-tail intent with useful, non-promotional answers.'
  },
  {
    value: 'medium-substack',
    label: 'Medium / Substack',
    cadence: 'Monthly',
    defaultAudience: 'community',
    summary: 'Cross-post booking-adjacent content that links to state and city pages.'
  },
  {
    value: 'therapist-groups',
    label: 'Therapist groups',
    cadence: 'Weekly',
    defaultAudience: 'community',
    summary: 'Use local therapist groups to seed more supply in priority metros.'
  }
]

export const DISTRIBUTION_STATUS_OPTIONS = [
  { value: 'queued', label: 'Queued' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'live', label: 'Live' },
  { value: 'won', label: 'Won' },
  { value: 'done', label: 'Done' },
  { value: 'paused', label: 'Paused' },
  { value: 'dropped', label: 'Dropped' }
]

export const PARTNER_REPORT_LOOKBACKS = [
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'all', label: 'All time' }
]

export const DEFAULT_PARTNER_CITY_ID = PARTNER_CITY_PRESETS[0].id

export const slugifySegment = (value = '') => {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const buildDirectoryPath = ({ stateSlug, citySlug, specialtySlug }) => {
  if (specialtySlug && specialtySlug !== 'none') {
    return `/premarital-counseling/${specialtySlug}/${stateSlug}/${citySlug}`
  }
  return `/premarital-counseling/${stateSlug}/${citySlug}`
}

export const buildPartnerRef = ({ audience, city, stateAbbr, specialtySlug }) => {
  const parts = [audience, city, stateAbbr]
  if (specialtySlug && specialtySlug !== 'none') {
    parts.push(specialtySlug)
  }
  return slugifySegment(parts.filter(Boolean).join('-'))
}

export const buildTrackedDirectoryUrl = ({ audience, cityPreset, specialtySlug, refCode, siteOrigin = 'https://www.weddingcounselors.com' }) => {
  const path = buildDirectoryPath({
    stateSlug: cityPreset.stateSlug,
    citySlug: cityPreset.citySlug,
    specialtySlug
  })

  const params = new URLSearchParams({
    utm_source: 'partner',
    utm_medium: audience,
    utm_campaign: refCode,
    ref: refCode
  })

  return `${siteOrigin}${path}?${params.toString()}`
}

export const buildPartnerWidgetUrl = ({ refCode, siteOrigin = 'https://www.weddingcounselors.com' }) => {
  const params = new URLSearchParams({ ref: refCode })
  return `${siteOrigin}/embed/find?${params.toString()}`
}

export const findAudience = (value) => {
  return PARTNER_AUDIENCES.find((item) => item.value === value) || PARTNER_AUDIENCES[0]
}

export const findCityPreset = (id) => {
  return PARTNER_CITY_PRESETS.find((item) => item.id === id) || PARTNER_CITY_PRESETS[0]
}

export const findSpecialtyPreset = (slug) => {
  return PARTNER_SPECIALTY_PRESETS.find((item) => item.slug === slug) || PARTNER_SPECIALTY_PRESETS[0]
}

