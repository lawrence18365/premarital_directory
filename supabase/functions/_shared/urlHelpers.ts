/**
 * Shared URL helpers for Supabase Edge Functions.
 *
 * Converts state abbreviations and city names into URL-safe slugs that match
 * the canonical profile route: /premarital-counseling/{state}/{city}/{slug}
 */

const STATE_ABBR_TO_SLUG: Record<string, string> = {
  'AL': 'alabama', 'AK': 'alaska', 'AZ': 'arizona', 'AR': 'arkansas', 'CA': 'california',
  'CO': 'colorado', 'CT': 'connecticut', 'DE': 'delaware', 'FL': 'florida', 'GA': 'georgia',
  'HI': 'hawaii', 'ID': 'idaho', 'IL': 'illinois', 'IN': 'indiana', 'IA': 'iowa',
  'KS': 'kansas', 'KY': 'kentucky', 'LA': 'louisiana', 'ME': 'maine', 'MD': 'maryland',
  'MA': 'massachusetts', 'MI': 'michigan', 'MN': 'minnesota', 'MS': 'mississippi', 'MO': 'missouri',
  'MT': 'montana', 'NE': 'nebraska', 'NV': 'nevada', 'NH': 'new-hampshire', 'NJ': 'new-jersey',
  'NM': 'new-mexico', 'NY': 'new-york', 'NC': 'north-carolina', 'ND': 'north-dakota', 'OH': 'ohio',
  'OK': 'oklahoma', 'OR': 'oregon', 'PA': 'pennsylvania', 'RI': 'rhode-island', 'SC': 'south-carolina',
  'SD': 'south-dakota', 'TN': 'tennessee', 'TX': 'texas', 'UT': 'utah', 'VT': 'vermont',
  'VA': 'virginia', 'WA': 'washington', 'WV': 'west-virginia', 'WI': 'wisconsin', 'WY': 'wyoming',
  'DC': 'washington-dc',
}

/**
 * Convert a state abbreviation (e.g., "OH") to a full URL slug (e.g., "ohio").
 * Falls back to lowercased, hyphenated input if the abbreviation is not recognized.
 */
export function getStateSlug(stateProvince: string | null | undefined): string {
  if (!stateProvince) return ''
  const upper = stateProvince.trim().toUpperCase()
  return STATE_ABBR_TO_SLUG[upper] || stateProvince.toLowerCase().replace(/\s+/g, '-')
}

/**
 * Convert a city name (e.g., "Fort Worth") to a URL slug (e.g., "fort-worth").
 * Strips special characters and replaces spaces with hyphens.
 */
export function getCitySlug(city: string | null | undefined): string {
  if (!city) return ''
  return city.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').trim()
}

/**
 * Build the canonical public profile URL for a given profile record.
 */
export function getProfileUrl(
  profile: { state_province?: string | null; city?: string | null; slug?: string | null; id?: string | null },
  baseUrl = 'https://www.weddingcounselors.com'
): string {
  const state = getStateSlug(profile.state_province)
  const city = getCitySlug(profile.city)
  const slug = profile.slug || profile.id
  if (state && city && slug) {
    return `${baseUrl}/premarital-counseling/${state}/${city}/${slug}`
  }
  return profile.id ? `${baseUrl}/profile/${profile.id}` : baseUrl
}
