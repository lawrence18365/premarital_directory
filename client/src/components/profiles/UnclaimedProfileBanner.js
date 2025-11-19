import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import '../../assets/css/unclaimed-profile-banner.css'

const UnclaimedProfileBanner = ({ profile, viewCount = null }) => {
  const [isDismissed, setIsDismissed] = useState(false)
  const firstName = profile.full_name.split(' ')[0]
  const claimUrl = `/claim-profile/${profile.slug || profile.id}`
  
  useEffect(() => {
    // Check if banner was previously dismissed
    const dismissedBanners = JSON.parse(localStorage.getItem('dismissedClaimBanners') || '{}')
    const dismissedAt = dismissedBanners[profile.id]
    
    if (dismissedAt) {
      // Check if 7 days have passed
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
      if (dismissedAt > sevenDaysAgo) {
        setIsDismissed(true)
      } else {
        // Clean up old dismissal
        delete dismissedBanners[profile.id]
        localStorage.setItem('dismissedClaimBanners', JSON.stringify(dismissedBanners))
      }
    }
  }, [profile.id])

  const handleDismiss = () => {
    // Save dismiss state to localStorage
    const dismissedBanners = JSON.parse(localStorage.getItem('dismissedClaimBanners') || '{}')
    dismissedBanners[profile.id] = Date.now()
    localStorage.setItem('dismissedClaimBanners', JSON.stringify(dismissedBanners))
    setIsDismissed(true)
  }

  if (isDismissed) {
    return null
  }

  return (
    <div className="unclaimed-profile-banner" role="banner" aria-label="Profile claim notification">
      <div className="unclaimed-banner-container">
        <div className="unclaimed-banner-content">
          <div className="unclaimed-banner-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
          <div className="unclaimed-banner-text">
            <strong className="unclaimed-banner-title">
              Are you {firstName} {profile.full_name.split(' ').slice(1).join(' ')}?
            </strong>
            <p className="unclaimed-banner-message">
              {viewCount !== null && viewCount > 0 
                ? `You have ${viewCount} profile view${viewCount === 1 ? '' : 's'} this week. `
                : 'Couples are finding your profile. '}
              Claim it now to manage your leads and update your information.
            </p>
          </div>
          <div className="unclaimed-banner-actions">
            <Link 
              to={claimUrl}
              className="unclaimed-banner-cta"
              onClick={() => {
                // Track analytics
                if (window.gtag) {
                  window.gtag('event', 'click', {
                    event_category: 'Claim Profile',
                    event_label: 'Banner CTA',
                    value: profile.id
                  })
                }
              }}
            >
              Claim Your Profile
            </Link>
          </div>
        </div>
        <button 
          className="unclaimed-banner-dismiss"
          onClick={handleDismiss}
          aria-label="Dismiss banner"
          title="Don't show for 7 days"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

export default UnclaimedProfileBanner
