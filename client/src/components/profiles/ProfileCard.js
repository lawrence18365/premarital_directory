import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { generateSlug, formatLocation, truncateText, getStateNameFromAbbr } from '../../lib/utils'

const asArray = (value) => (Array.isArray(value) ? value : [])

const hasAvailabilityData = (profile) => {
  const value = profile?.accepting_new_clients
  if (value === true || value === false) return true
  if (typeof value === 'number') return value === 0 || value === 1
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return ['true', 'false', '1', '0', 'yes', 'no'].includes(normalized)
  }
  return false
}

const getPrimaryCredential = (profile) => {
  const text = [
    profile?.profession,
    ...asArray(profile?.credentials),
    ...asArray(profile?.certifications)
  ]
    .filter(Boolean)
    .join(' ')
    .toUpperCase()

  if (/\bLMFT\b/.test(text)) return 'LMFT'
  if (/\bLPCC\b/.test(text)) return 'LPCC'
  if (/\bLCSW\b/.test(text)) return 'LCSW'
  if (/\bLPC\b/.test(text)) {
    return String(profile?.state_province || '').toUpperCase() === 'CA' ? 'LPCC' : 'LPC'
  }
  if (/\bLMHC\b/.test(text)) return 'LMHC'
  if (/PSYCHOLOGIST|PSY\.D|PSYD|PHD/.test(text)) return 'Psychologist'
  return null
}

const getProfessionLabel = (profile) => {
  const profession = profile?.profession || 'Premarital Counselor'
  const credential = getPrimaryCredential(profile)
  const isGenericTherapistLabel = /licensed therapist|therapist|counselor/i.test(profession)
  if (credential && isGenericTherapistLabel && !profession.toUpperCase().includes(credential)) {
    return `${profession} (${credential})`
  }
  return profession
}

const formatFaithLabel = (faithTradition) => {
  if (!faithTradition || faithTradition === 'secular') return null
  if (faithTradition === 'all-faiths') return 'All faiths'
  return String(faithTradition)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

const getMethodLabel = (profile) => {
  const text = [
    ...asArray(profile?.treatment_approaches),
    ...asArray(profile?.certifications)
  ].join(' ').toLowerCase()

  if (!text) return null
  if (text.includes('gottman')) return 'Gottman'
  if (text.includes('emotionally focused') || text.includes('eft')) return 'EFT'
  if (text.includes('prepare/enrich') || text.includes('prepare enrich') || text.includes('prepare-enrich')) return 'PREPARE/ENRICH'
  if (text.includes('symbis')) return 'SYMBIS'
  if (text.includes('foccus')) return 'FOCCUS'
  if (text.includes('pre-cana') || text.includes('precana')) return 'Pre-Cana'
  if (text.includes('faith')) return 'Faith-based'
  return asArray(profile?.treatment_approaches)[0] || null
}

const getSessionTypeLabel = (profile) => {
  const sessionTypes = asArray(profile?.session_types).map((item) => String(item).toLowerCase())
  const hasOnline = sessionTypes.includes('online') || sessionTypes.includes('hybrid')
  const hasInPerson = sessionTypes.includes('in-person') || sessionTypes.includes('hybrid')

  if (hasOnline && hasInPerson) return 'Online + In-Person'
  if (hasOnline) return 'Online'
  if (hasInPerson) return 'In-Person'
  return null
}

const getRateLabel = (profile) => {
  const min = Number(profile?.session_fee_min) > 0 ? Math.round(Number(profile.session_fee_min) / 100) : null
  const max = Number(profile?.session_fee_max) > 0 ? Math.round(Number(profile.session_fee_max) / 100) : null
  if (min && max) return `$${min}-$${max}`
  if (min) return `$${min}+`
  if (profile?.pricing_range) return String(profile.pricing_range)
  return null
}

const getInsuranceLabel = (profile) => {
  const accepted = asArray(profile?.insurance_accepted).map((item) => String(item).toLowerCase())
  if (accepted.length === 0) return null
  const hasNonSelfPay = accepted.some((item) => item !== 'self-pay only')
  if (hasNonSelfPay) return 'Insurance accepted'
  return 'Self-pay only'
}

const getAvailabilityLabel = (profile) => {
  if (profile?.availabilityState?.label === 'accepting') return 'Accepting new clients'
  if (profile?.availabilityState?.label === 'limited') return 'Limited availability'
  if (profile?.availabilityState?.label === 'unverified') return 'Availability unverified'
  if (!profile?.is_claimed) return 'Availability unverified'
  if (!hasAvailabilityData(profile)) return 'Availability not listed'
  if (profile?.accepting_new_clients) return 'Accepting new clients'
  return 'Limited availability'
}

const ProfileCard = ({ profile, type = 'directory' }) => {
  const profileSlug = profile.slug || generateSlug(profile.full_name)
  const stateSlug = profile.state_province ? getStateNameFromAbbr(profile.state_province) : null
  const citySlug = profile.city ? generateSlug(profile.city) : null

  const [imageError, setImageError] = useState(false)
  const hasPhoto = Boolean(profile.photo_url) && !imageError
  const fitScore = Number(profile?.premaritalFitScore)
  const hasFitScore = Number.isFinite(fitScore) && fitScore > 0
  const professionLabel = getProfessionLabel(profile)
  const isClaimed = Boolean(profile?.is_claimed)
  const rateLabel = getRateLabel(profile)
  const insuranceLabel = getInsuranceLabel(profile)
  const availabilityLabel = getAvailabilityLabel(profile)

  const missingDetails = []
  if (!rateLabel) missingDetails.push('pricing')
  if (!insuranceLabel) missingDetails.push('insurance')
  if (!isClaimed || availabilityLabel === 'Availability unverified' || availabilityLabel === 'Availability not listed') {
    missingDetails.push('availability')
  }

  const detailsPendingLabel = missingDetails.length >= 2
    ? `Details pending: ${missingDetails.slice(0, 2).join(' + ')}`
    : null

  const decisionPills = [
    getSessionTypeLabel(profile),
    profile?.postal_code ? `ZIP ${profile.postal_code}` : null,
    getMethodLabel(profile),
    formatFaithLabel(profile?.faith_tradition),
    rateLabel,
    insuranceLabel,
    !detailsPendingLabel ? availabilityLabel : detailsPendingLabel
  ].filter(Boolean)

  const fitReasons = Array.isArray(profile?.fitReasonLabels) && profile.fitReasonLabels.length > 0
    ? profile.fitReasonLabels
    : [
      profile?.premaritalFocused ? 'Premarital-focused' : null,
      profile?.structuredProgram ? 'Structured program evidence' : null
    ].filter(Boolean)

  return (
    <div className={`profile-card profile-card--${type} ${profile.is_sponsored ? 'sponsored' : ''} ${!hasPhoto ? 'no-photo' : ''}`}>
      <div className="profile-badges">
        {profile.sponsored_rank >= 3 && (
          <div className="profile-badge premium">
            <i className="fa fa-crown"></i> Premium
          </div>
        )}
        {profile.sponsored_rank === 2 && (
          <div className="profile-badge featured">
            <i className="fa fa-star"></i> Featured
          </div>
        )}
        {(profile.is_verified || profile.badge_verified) && !profile.is_sponsored && (
          <div className="profile-badge verified">
            <i className="fa fa-shield-alt"></i> Verified
          </div>
        )}
      </div>
      
      <div className="profile-header">
        <div className="profile-photo-container">
          {hasPhoto ? (
            <img
              src={profile.photo_url}
              alt={profile.full_name}
              className="profile-photo"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="profile-photo placeholder" aria-label={`Placeholder for ${profile.full_name}`} style={{ background: '#f3f4f6' }}>
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '40%', height: '40%', color: '#9ca3af' }}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
          )}
        </div>
        
        <div className="profile-info">
          <h3>{profile.full_name}</h3>
          <div className="profile-profession">{professionLabel}</div>
          <div className="profile-location">
            {formatLocation(profile)}
          </div>
          {hasFitScore && (
            <div className="profile-fit-indicator">
              Premarital fit {fitScore}
            </div>
          )}
        </div>
      </div>
      
      {profile.bio && (
        <div className="profile-bio">
          {truncateText(profile.bio, 150)}
        </div>
      )}

      {decisionPills.length > 0 && (
        <div className="profile-decision-row">
          {decisionPills.slice(0, 6).map((pill, index) => (
            <span key={`${pill}-${index}`} className="profile-decision-pill">
              {pill}
            </span>
          ))}
        </div>
      )}

      {fitReasons.length > 0 && (
        <div className="profile-fit-reasons">
          Why this match: {fitReasons.slice(0, 2).join(' · ')}
        </div>
      )}

      {detailsPendingLabel && (
        <div className="profile-fit-reasons">
          Ask directly about pricing, insurance, and availability.
        </div>
      )}
      
      {profile.specialties && profile.specialties.length > 0 && (
        <div className="profile-specialties">
          <div className="specialties-list">
            {profile.specialties.slice(0, 3).map((specialty, index) => (
              <span key={index} className="specialty-tag">
                {specialty}
              </span>
            ))}
            {profile.specialties.length > 3 && (
              <span className="specialty-tag">
                +{profile.specialties.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
      
      <div className="profile-actions">
        <Link to={
          stateSlug && citySlug 
            ? `/premarital-counseling/${stateSlug}/${citySlug}/${profileSlug}` 
            : `/profile/${profileSlug}`
        } className="btn btn-primary">
          View & Contact
        </Link>
      </div>
    </div>
  )
}

export default ProfileCard
