/**
 * Couple-side attribution tracking.
 * Captures UTM params and referrer on first page load, persists in sessionStorage,
 * and provides them for lead submissions and click tracking.
 */

const STORAGE_KEY = 'wc_attribution'

const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ref']

/**
 * Call once on app init. Captures UTM params from the URL and landing page info.
 * Only writes on first visit in a session (doesn't overwrite mid-session).
 */
export function captureAttribution() {
  if (sessionStorage.getItem(STORAGE_KEY)) return

  const params = new URLSearchParams(window.location.search)
  const attribution = {}

  for (const key of UTM_PARAMS) {
    const value = params.get(key)
    if (value) attribution[key] = value
  }

  attribution.landing_page = window.location.pathname
  attribution.referrer = document.referrer || null
  attribution.captured_at = new Date().toISOString()

  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attribution))
}

/**
 * Returns the captured attribution data for this session.
 */
export function getAttribution() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || {}
  } catch {
    return {}
  }
}

/**
 * Derives a human-readable source label for lead attribution.
 */
export function getSourceLabel() {
  const attr = getAttribution()
  if (attr.ref) return `partner:${attr.ref}`
  if (attr.utm_source === 'widget') return 'church_widget'
  if (attr.utm_source) return attr.utm_source
  if (attr.referrer) {
    try {
      const host = new URL(attr.referrer).hostname
      if (host.includes('google')) return 'organic_google'
      if (host.includes('bing')) return 'organic_bing'
      if (host.includes('facebook') || host.includes('fb.')) return 'social_facebook'
      if (host.includes('instagram')) return 'social_instagram'
      return `referral:${host}`
    } catch {
      return 'referral'
    }
  }
  return 'direct'
}
