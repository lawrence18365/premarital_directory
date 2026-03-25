import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { isLikelyBot } from '../../utils/botDetection'

// Google Analytics 4 Component
export const GoogleAnalytics = () => {
  const location = useLocation()
  const GA4_MEASUREMENT_ID = process.env.REACT_APP_GA4_MEASUREMENT_ID

  useEffect(() => {
    if (!GA4_MEASUREMENT_ID || isLikelyBot()) return

    // Load gtag script
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`
    document.head.appendChild(script)

    // Initialize gtag
    window.dataLayer = window.dataLayer || []
    function gtag() {
      window.dataLayer.push(arguments)
    }
    window.gtag = gtag

    gtag('js', new Date())
    gtag('config', GA4_MEASUREMENT_ID, {
      page_title: document.title,
      page_location: window.location.href
    })

    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}"]`)
      if (existingScript) {
        existingScript.remove()
      }
    }
  }, [GA4_MEASUREMENT_ID])

  // Track page views on route changes
  useEffect(() => {
    if (!GA4_MEASUREMENT_ID || !window.gtag) return

    window.gtag('config', GA4_MEASUREMENT_ID, {
      page_title: document.title,
      page_location: window.location.href,
      page_path: location.pathname + location.search
    })
  }, [location, GA4_MEASUREMENT_ID])

  return null
}

// Track custom events
export const trackEvent = (eventName, parameters = {}) => {
  if (window.gtag && !isLikelyBot()) {
    window.gtag('event', eventName, parameters)
  }
}

// Track professional profile views
export const trackProfileView = (professionalName, city, state) => {
  trackEvent('profile_view', {
    professional_name: professionalName,
    city: city,
    state: state,
    event_category: 'engagement'
  })
}

// Track contact form submissions
export const trackContactSubmission = (professionalName, contactMethod) => {
  trackEvent('contact_professional', {
    professional_name: professionalName,
    contact_method: contactMethod,
    event_category: 'conversion'
  })
}

// Track search usage
export const trackSearch = (searchTerm, filters) => {
  trackEvent('search', {
    search_term: searchTerm,
    filters: JSON.stringify(filters),
    event_category: 'engagement'
  })
}

// Track directory launch milestone
export const trackDirectoryLaunch = (profileCount = 0) => {
  trackEvent('directory_launch', {
    launch_date: new Date().toISOString(),
    total_profiles: profileCount,
    event_category: 'milestone'
  })
}

// Track professional profile claims
export const trackProfileClaim = (professionalId, claimMethod) => {
  trackEvent('profile_claim', {
    professional_id: professionalId,
    claim_method: claimMethod,
    event_category: 'conversion'
  })
}

// Track state/city page views for local SEO insights
export const trackLocationPageView = (state, city = null) => {
  trackEvent('location_page_view', {
    state: state,
    city: city,
    location_type: city ? 'city' : 'state',
    event_category: 'engagement'
  })
}

// Track onboarding step completion
export const trackOnboardingStep = (stepNumber, stepName) => {
  trackEvent('onboarding_step_completed', {
    step_number: stepNumber,
    step_name: stepName,
    event_category: 'onboarding'
  })
}

// Track onboarding completion (profile published)
export const trackOnboardingComplete = (profileId, signupSource) => {
  trackEvent('onboarding_completed', {
    profile_id: profileId,
    signup_source: signupSource || 'organic',
    event_category: 'conversion'
  })
}

export default GoogleAnalytics
