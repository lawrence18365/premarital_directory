import React, { useEffect, useMemo, useRef } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { UPGRADE_OFFER } from '../../lib/providerOffers'
import { trackEvent } from '../analytics/GoogleAnalytics'
import '../../assets/css/upgrade-cta.css'

const FEATURED_TIERS = new Set(['local_featured', 'area_spotlight', 'featured', 'premium'])

export const isProfileFeatured = (profile = {}) => Boolean(
  profile?.is_sponsored ||
  Number(profile?.sponsored_rank || 0) > 0 ||
  FEATURED_TIERS.has(profile?.tier)
)

const appendAttribution = (checkoutUrl, { profileId, surface }) => {
  if (!checkoutUrl || !profileId || !surface) return checkoutUrl || ''

  try {
    const url = new URL(checkoutUrl)
    url.searchParams.set('client_reference_id', profileId)
    url.searchParams.set('utm_source', surface)
    return url.toString()
  } catch {
    const separator = checkoutUrl.includes('?') ? '&' : '?'
    return `${checkoutUrl}${separator}client_reference_id=${encodeURIComponent(profileId)}&utm_source=${encodeURIComponent(surface)}`
  }
}

const logUpgradeEvent = async ({ profileId, eventType, surface }) => {
  if (!profileId || !eventType || !surface) return

  try {
    await supabase.from('upgrade_events').insert({
      profile_id: profileId,
      event_type: eventType,
      surface
    })
  } catch {
    // Non-critical tracking should never block checkout or dashboard rendering.
  }
}

const UpgradeCTA = ({ profile, surface = 'unknown', variant = 'card', className = '' }) => {
  const hasLoggedView = useRef(false)
  const profileId = profile?.id
  const checkoutUrl = UPGRADE_OFFER.checkoutUrl
  const href = useMemo(
    () => appendAttribution(checkoutUrl, { profileId, surface }),
    [checkoutUrl, profileId, surface]
  )
  const shouldRender = Boolean(profileId && checkoutUrl) && !isProfileFeatured(profile)

  useEffect(() => {
    if (!shouldRender || hasLoggedView.current) return
    hasLoggedView.current = true

    trackEvent('upgrade_cta_view', {
      profile_id: profileId,
      surface,
      event_category: 'monetization'
    })

    logUpgradeEvent({
      profileId,
      eventType: 'view',
      surface
    })
  }, [profileId, shouldRender, surface])

  if (!shouldRender) return null

  const handleClick = () => {
    trackEvent('upgrade_cta_click', {
      profile_id: profileId,
      surface,
      event_category: 'conversion'
    })

    logUpgradeEvent({
      profileId,
      eventType: 'click',
      surface
    })
  }

  return (
    <section className={`upgrade-cta upgrade-cta--${variant} ${className}`.trim()}>
      <div className="upgrade-cta__header">
        <div>
          <p className="upgrade-cta__eyebrow">{UPGRADE_OFFER.label}</p>
          <h2 className="upgrade-cta__title">Upgrade your listing visibility</h2>
          <p className="upgrade-cta__copy">
            Lock in a founding provider placement while WeddingCounselors.com is still early.
          </p>
        </div>
        <div className="upgrade-cta__price" aria-label={`${UPGRADE_OFFER.price} ${UPGRADE_OFFER.billingNote}`}>
          <strong>{UPGRADE_OFFER.price}</strong>
          <span>{UPGRADE_OFFER.billingNote}</span>
        </div>
      </div>

      <ul className="upgrade-cta__list">
        {UPGRADE_OFFER.valueProps.map((valueProp) => (
          <li key={valueProp}>
            <i className="fa fa-check" aria-hidden="true"></i>
            <span>{valueProp}</span>
          </li>
        ))}
      </ul>

      <div className="upgrade-cta__footer">
        <p className="upgrade-cta__note">No lead guarantees. This is an early visibility placement.</p>
        <a
          className="btn btn-primary upgrade-cta__button"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
        >
          Upgrade Listing
        </a>
      </div>
    </section>
  )
}

export default UpgradeCTA
