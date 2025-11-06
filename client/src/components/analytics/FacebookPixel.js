import { useEffect } from 'react'

// Facebook Pixel Component
export const FacebookPixel = () => {
  const FACEBOOK_PIXEL_ID = process.env.REACT_APP_FACEBOOK_PIXEL_ID

  useEffect(() => {
    if (!FACEBOOK_PIXEL_ID) return

    // Facebook Pixel Code
    // eslint-disable-next-line no-unused-expressions
    !(function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)})(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');

    window.fbq('init', FACEBOOK_PIXEL_ID)
    window.fbq('track', 'PageView')

    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector('script[src*="fbevents.js"]')
      if (existingScript) {
        existingScript.remove()
      }
    }
  }, [FACEBOOK_PIXEL_ID])

  return null
}

// Track custom Facebook events
export const trackFacebookEvent = (eventName, parameters = {}) => {
  if (window.fbq) {
    window.fbq('track', eventName, parameters)
  }
}

// Track professional contact as lead
export const trackFacebookLead = (professionalName, value = 50) => {
  trackFacebookEvent('Lead', {
    content_name: professionalName,
    value: value,
    currency: 'USD'
  })
}

// Track search as engagement
export const trackFacebookSearch = (searchTerm) => {
  trackFacebookEvent('Search', {
    search_string: searchTerm
  })
}

// Track profile view as content engagement
export const trackFacebookProfileView = (professionalName) => {
  trackFacebookEvent('ViewContent', {
    content_name: professionalName,
    content_type: 'professional_profile'
  })
}

export default FacebookPixel
