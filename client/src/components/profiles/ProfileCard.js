import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { generateSlug, formatLocation, truncateText, getStateNameFromAbbr } from '../../lib/utils'

const ProfileCard = ({ profile, type = 'directory' }) => {
  const profileSlug = profile.slug || generateSlug(profile.full_name)
  const stateSlug = profile.state_province ? getStateNameFromAbbr(profile.state_province) : null
  const citySlug = profile.city ? generateSlug(profile.city) : null

  const [imageError, setImageError] = useState(false)
  const hasPhoto = Boolean(profile.photo_url) && !imageError

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
        {profile.is_verified && !profile.is_sponsored && (
          <div className="profile-badge verified">
            <i className="fa fa-shield-alt"></i> Verified
          </div>
        )}
        {!profile.is_sponsored && !profile.is_verified && (
          <div className="profile-badge-hint">
            <i className="fa fa-lock"></i> Unverified
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
          <div className="profile-profession">{profile.profession}</div>
          <div className="profile-location">
            {formatLocation(profile)}
          </div>
        </div>
      </div>
      
      {profile.bio && (
        <div className="profile-bio">
          {truncateText(profile.bio, 150)}
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
            ? `/professionals/${stateSlug}/${citySlug}/${profileSlug}` 
            : `/profile/${profileSlug}`
        } className="btn btn-primary">
          View Profile
        </Link>
      </div>
    </div>
  )
}

export default ProfileCard
