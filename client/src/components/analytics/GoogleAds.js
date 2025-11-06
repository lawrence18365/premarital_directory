import { useEffect } from 'react'

// Google Ads Conversion Tracking Component
export const GoogleAds = () => {
  const GOOGLE_ADS_ID = process.env.REACT_APP_GOOGLE_ADS_ID

  useEffect(() => {
    if (!GOOGLE_ADS_ID) return

    // Load Google Ads script
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`
    document.head.appendChild(script)

    // Initialize gtag for Google Ads
    window.dataLayer = window.dataLayer || []
    function gtag() {
      window.dataLayer.push(arguments)
    }
    window.gtag = gtag
    
    gtag('js', new Date())
    gtag('config', GOOGLE_ADS_ID)

    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}"]`)
      if (existingScript) {
        existingScript.remove()
      }
    }
  }, [GOOGLE_ADS_ID])

  return null
}

// Track Google Ads conversions
export const trackGoogleAdsConversion = (conversionLabel, value = 1) => {
  if (window.gtag && process.env.REACT_APP_GOOGLE_ADS_ID) {
    window.gtag('event', 'conversion', {
      'send_to': `${process.env.REACT_APP_GOOGLE_ADS_ID}/${conversionLabel}`,
      'value': value,
      'currency': 'USD'
    })
  }
}

// Track professional contact as conversion
export const trackProfessionalContact = (professionalName) => {
  trackGoogleAdsConversion('contact_professional', 50) // Assign $50 value to leads
}

// Track profile claim as conversion
export const trackProfileClaim = () => {
  trackGoogleAdsConversion('profile_claim', 100) // Higher value for profile claims
}

export default GoogleAds
