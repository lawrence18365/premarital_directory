// Utility functions for the application

// Generate SEO-friendly slug from name
export const generateSlug = (name) => {
  if (!name) return ''
  
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim()
}

// Get profile by slug
export const getProfileBySlug = (profiles, slug) => {
  return profiles.find(profile => generateSlug(profile.full_name) === slug)
}

// Format phone number for display
export const formatPhoneNumber = (phone) => {
  if (!phone) return ''
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')
  
  // Format as (XXX) XXX-XXXX
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  
  return phone // Return original if can't format
}

// Format location string
export const formatLocation = (profile) => {
  const parts = []
  if (profile.city) parts.push(profile.city)
  if (profile.state_province) parts.push(profile.state_province)
  return parts.join(', ')
}

// Convert state abbreviation to full state name for URLs
export const getStateNameFromAbbr = (abbr) => {
  const stateMap = {
    'AL': 'alabama', 'AK': 'alaska', 'AZ': 'arizona', 'AR': 'arkansas', 'CA': 'california',
    'CO': 'colorado', 'CT': 'connecticut', 'DE': 'delaware', 'FL': 'florida', 'GA': 'georgia',
    'HI': 'hawaii', 'ID': 'idaho', 'IL': 'illinois', 'IN': 'indiana', 'IA': 'iowa',
    'KS': 'kansas', 'KY': 'kentucky', 'LA': 'louisiana', 'ME': 'maine', 'MD': 'maryland',
    'MA': 'massachusetts', 'MI': 'michigan', 'MN': 'minnesota', 'MS': 'mississippi', 'MO': 'missouri',
    'MT': 'montana', 'NE': 'nebraska', 'NV': 'nevada', 'NH': 'new-hampshire', 'NJ': 'new-jersey',
    'NM': 'new-mexico', 'NY': 'new-york', 'NC': 'north-carolina', 'ND': 'north-dakota', 'OH': 'ohio',
    'OK': 'oklahoma', 'OR': 'oregon', 'PA': 'pennsylvania', 'RI': 'rhode-island', 'SC': 'south-carolina',
    'SD': 'south-dakota', 'TN': 'tennessee', 'TX': 'texas', 'UT': 'utah', 'VT': 'vermont',
    'VA': 'virginia', 'WA': 'washington', 'WV': 'west-virginia', 'WI': 'wisconsin', 'WY': 'wyoming'
  }
  return stateMap[abbr?.toUpperCase()] || null
}

// Get initials from name
export const getInitials = (name) => {
  if (!name) return ''
  
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Truncate text with ellipsis
export const truncateText = (text, maxLength = 150) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

// Validate email format
export const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

// Normalize and validate a website URL
// Returns { url: string|null, error: string|null }
export const normalizeAndValidateUrl = (raw) => {
  if (!raw || !raw.trim()) return { url: '', error: null }

  // Strip all whitespace (including interior spaces like "therapist .com")
  let cleaned = raw.replace(/\s+/g, '')

  // Prepend https:// if no protocol
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = 'https://' + cleaned
  }

  // Strip trailing slashes
  cleaned = cleaned.replace(/\/+$/, '')

  try {
    const parsed = new URL(cleaned)

    // Lowercase the hostname
    parsed.hostname = parsed.hostname.toLowerCase()

    // Must have a dot in the hostname (e.g. "therapist.com", not just "therapist")
    if (!parsed.hostname.includes('.')) {
      return { url: null, error: "That doesn't look like a valid website URL. Example: https://yourpractice.com" }
    }

    // Rebuild without trailing slash
    let normalized = parsed.origin + parsed.pathname.replace(/\/+$/, '') + parsed.search + parsed.hash

    return { url: normalized, error: null }
  } catch {
    return { url: null, error: "That doesn't look like a valid website URL. Example: https://yourpractice.com" }
  }
}

// Get display URL without protocol
export const getDisplayUrl = (url) => {
  if (!url) return ''
  
  return url
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')
}

// Scroll to top of page
export const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

// Debounce function for search
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// State normalization helpers
const STATE_ABBR = {
  Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR', California: 'CA', Colorado: 'CO',
  Connecticut: 'CT', Delaware: 'DE', Florida: 'FL', Georgia: 'GA', Hawaii: 'HI', Idaho: 'ID',
  Illinois: 'IL', Indiana: 'IN', Iowa: 'IA', Kansas: 'KS', Kentucky: 'KY', Louisiana: 'LA',
  Maine: 'ME', Maryland: 'MD', Massachusetts: 'MA', Michigan: 'MI', Minnesota: 'MN',
  Mississippi: 'MS', Missouri: 'MO', Montana: 'MT', Nebraska: 'NE', Nevada: 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
  'North Carolina': 'NC', 'North Dakota': 'ND', Ohio: 'OH', Oklahoma: 'OK', Oregon: 'OR',
  Pennsylvania: 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC', 'South Dakota': 'SD',
  Tennessee: 'TN', Texas: 'TX', Utah: 'UT', Vermont: 'VT', Virginia: 'VA', Washington: 'WA',
  'West Virginia': 'WV', Wisconsin: 'WI', Wyoming: 'WY'
}

export const normalizeStateAbbr = (value) => {
  if (!value) return ''
  const trimmed = String(value).trim()
  // If full name present
  if (STATE_ABBR[trimmed]) return STATE_ABBR[trimmed]
  // If already an abbreviation
  if (trimmed.length <= 3) return trimmed.toUpperCase()
  // Try case-insensitive lookup
  const match = Object.keys(STATE_ABBR).find(k => k.toLowerCase() === trimmed.toLowerCase())
  return match ? STATE_ABBR[match] : trimmed
}
