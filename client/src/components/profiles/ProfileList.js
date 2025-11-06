import React from 'react'
import ProfileCard from './ProfileCard'

const ProfileList = ({ profiles, loading, error, showViewAll = false }) => {
  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Finding the perfect counselors for you...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center" style={{ 
        padding: 'var(--space-12)', 
        color: 'var(--error)',
        background: 'var(--white)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--gray-200)',
        margin: 'var(--space-8) 0'
      }}>
        <h3>Oops! Something went wrong</h3>
        <p className="text-muted mb-6">
          We're having trouble loading the profiles. Please try again later.
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="btn btn-primary"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!profiles || profiles.length === 0) {
    return (
      <div className="text-center" style={{ 
        padding: 'var(--space-12)',
        background: 'var(--white)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--gray-200)',
        margin: 'var(--space-8) 0'
      }}>
        <h3>No counselors found</h3>
        <p className="text-muted">
          Try adjusting your search criteria or browse all professionals.
        </p>
      </div>
    )
  }

  // Separate sponsored and regular profiles
  const sponsoredProfiles = profiles.filter(profile => profile.is_sponsored)
  const regularProfiles = profiles.filter(profile => !profile.is_sponsored)

  // If this is the featured section on homepage, show simplified layout
  if (showViewAll) {
    return (
      <div className="container">
        <div className="profiles-grid">
          {profiles.map(profile => (
            <ProfileCard key={profile.id} profile={profile} type="featured" />
          ))}
        </div>
        
        <div className="text-center mt-12">
          <a href="/states" className="btn btn-primary btn-large">
            View All Professionals
          </a>
          <p className="text-muted mt-4">
            Browse our complete directory of 1000+ verified counselors
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="profiles-section">
      <div className="container">
        {sponsoredProfiles.length > 0 && (
          <>
            <div className="section-header">
              <h2 className="font-display">Featured Professionals</h2>
              <p>Verified and highly recommended counselors</p>
            </div>
            <div className="profiles-grid">
              {sponsoredProfiles.map(profile => (
                <ProfileCard key={profile.id} profile={profile} type="directory" />
              ))}
            </div>
          </>
        )}

        {regularProfiles.length > 0 && (
          <>
            <div className="section-header">
              <h2 className="font-display">
                {sponsoredProfiles.length > 0 ? 'More Professionals' : 'Premarital Counseling Professionals'}
              </h2>
              <p>
                Showing {regularProfiles.length} professional{regularProfiles.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="profiles-grid">
              {regularProfiles.map(profile => (
                <ProfileCard key={profile.id} profile={profile} type="directory" />
              ))}
            </div>
          </>
        )}

        {showViewAll && (
          <div className="text-center mt-8 mb-6">
            <a href="/states" className="btn btn-primary btn-large">
              <span>View All {profiles.length > 4 ? profiles.length : ''} Professionals</span>
              <span className="btn-arrow">→</span>
            </a>
          </div>
        )}

        <div className="text-center mt-12">
          <p className="text-muted">
            Don't see your profile? <a href="/claim-profile" className="text-accent weight-medium">Claim your listing</a> or{' '}
            <a href="/contact" className="text-accent weight-medium">contact us</a> to get added.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ProfileList
