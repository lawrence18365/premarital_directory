import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { generateSlug } from '../lib/utils'
import { formatLocation, getInitials, formatPhoneNumber, getDisplayUrl } from '../lib/utils'
import LeadContactForm from '../components/leads/LeadContactForm'
import Breadcrumbs, { generateBreadcrumbs } from '../components/common/Breadcrumbs'
import SEOHelmet, { generateProfessionalStructuredData } from '../components/analytics/SEOHelmet'
import { trackProfileView } from '../components/analytics/GoogleAnalytics'
import { trackFacebookProfileView } from '../components/analytics/FacebookPixel'

import { profileOperations } from '../lib/supabaseClient'

const ProfilePage = () => {
  const { slugOrId, state, city, profileSlug } = useParams()
  // Use profileSlug if available (new URL structure), otherwise use slugOrId (old structure)
  const currentSlug = profileSlug || slugOrId
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showContactForm, setShowContactForm] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadProfile()
  }, [currentSlug])

  useEffect(() => {
    // Update page title when profile loads
    if (profile) {
      document.title = `${profile.full_name} - ${profile.profession} | Premarital Counseling Directory`
    }
  }, [profile])

  // Redirect old URL to nested canonical when state known
  useEffect(() => {
    if (profile && !state) {
      const stateSlug = profile.state_province ? generateSlug(profile.state_province) : null
      const profileSlug = profile.slug || generateSlug(profile.full_name)
      if (stateSlug && profileSlug) {
        navigate(`/professionals/${stateSlug}/${profileSlug}`, { replace: true })
      }
    }
  }, [profile, state, navigate])

  // Track profile view
  useEffect(() => {
    if (profile) {
      trackProfileView(profile.full_name, profile.city, profile.state_province)
      trackFacebookProfileView(profile.full_name)
    }
  }, [profile])

  const loadProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      
  // Try to get profile by slug first, then by ID if that fails
  let { data, error } = await profileOperations.getProfile(currentSlug)
  
  // If slug lookup fails, try by ID (for profiles without slugs)
  if (error || !data) {
    // For now, since we don't have slugs, search by name similarity
    const searchTerm = currentSlug.replace(/-/g, ' ')
    const searchResult = await profileOperations.searchProfiles(searchTerm)
    
    if (searchResult.data && searchResult.data.length > 0) {
      data = searchResult.data[0] // Take first match
      error = null
    }
  }
  
  if (error) {
    setError(error.message)
  } else if (!data) {
    setError('Profile not found')
  } else {
    // Enhance profile data with additional computed fields
    // DUMMY DATA: Replace with actual reviews from your data source
    const dummyReviews = [
      {
        author: 'Jane Doe',
        rating: 5,
        reviewBody: 'Dr. Smith was incredibly helpful. I highly recommend her!'
      },
      {
        author: 'John Doe',
        rating: 4,
        reviewBody: 'A great experience. We learned a lot.'
      }
    ];

    const enhancedProfile = {
      ...data,
      reviews: dummyReviews, // Add dummy reviews to the profile object
      // Add any computed fields here if needed
    };
    setProfile(enhancedProfile);
  }
    } catch (err) {
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleLeadSuccess = (leadData) => {
    // Handle successful lead submission
    console.log('Lead submitted successfully:', leadData)
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container" style={{ padding: 'var(--space-20) 0', textAlign: 'center' }}>
        <h2>Profile Not Found</h2>
        <p className="text-secondary mb-8">
          {error === 'Profile not found' 
            ? 'The profile you\'re looking for doesn\'t exist or may have been removed.'
            : 'We encountered an error while loading this profile.'
          }
        </p>
        <Link to="/" className="btn btn-primary">
          Browse All Professionals
        </Link>
      </div>
    )
  }

  // Generate breadcrumbs - handle missing state gracefully
  const stateName = profile?.state_province || (state ? state.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : null)
  const breadcrumbItems = stateName && profile
    ? generateBreadcrumbs.profilePage(
        stateName,
        profile.full_name,
        `/professionals/${state || generateSlug(stateName)}`,
        null
      )
    : generateBreadcrumbs.profilePage(
        'All Locations',
        profile?.full_name || 'Profile',
        '/states',
        null
      )

  return (
    <>
      <SEOHelmet
        title={`${profile?.full_name} - ${profile?.profession}${profile?.city && stateName ? ` in ${profile.city}, ${stateName}` : ''} | Premarital Counseling`}
        description={`Connect with ${profile?.full_name}, a qualified ${profile?.profession}${profile?.city && stateName ? ` in ${profile.city}, ${stateName}` : ''}. ${profile?.bio ? profile.bio.substring(0, 150) + '...' : 'Specializing in premarital counseling for engaged couples.'}`}
        url={window.location.pathname}
        type="profile"
        structuredData={profile ? generateProfessionalStructuredData(profile) : null}
        reviews={profile ? profile.reviews : null}
        professional={profile}
        keywords={`${profile?.profession}, premarital counseling, ${profile?.city}, ${profile?.state_province}, ${profile?.specialties?.join(', ') || ''}`}
        breadcrumbs={breadcrumbItems}
        canonicalUrl={`https://www.weddingcounselors.com${window.location.pathname}`}
        noindex={false}
      />
      <div className="profile-page">
        <div className="container">
          <Breadcrumbs items={breadcrumbItems} />
        </div>
        {/* Hero Section */}
        <section className="profile-hero">
          <div className="container">
          <div className="profile-hero-content">
            <div className="profile-hero-main">
              <div className="profile-hero-photo">
                {profile.photo_url ? (
                  <img 
                    src={profile.photo_url} 
                    alt={profile.full_name}
                    className="hero-photo"
                  />
                ) : (
                  <div className="hero-photo-placeholder">
                    {getInitials(profile.full_name)}
                  </div>
                )}
                {profile.is_sponsored && (
                  <div className="hero-sponsored-badge">Featured Professional</div>
                )}
              </div>
              
              <div className="profile-hero-info">
                <div className="profile-hero-header">
                  <h1 className="profile-hero-name">{profile.full_name}</h1>
                  <div className="profile-hero-profession">{profile.profession}</div>
                  <div className="profile-hero-location">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    {formatLocation(profile)}
                  </div>
                  {profile.years_experience && (
                    <div className="profile-hero-experience">
                      {profile.years_experience} years of experience
                    </div>
                  )}
                </div>

                {profile.specialties && profile.specialties.length > 0 && (
                  <div className="profile-hero-specialties">
                    {profile.specialties.map((specialty, index) => (
                      <span key={index} className="hero-specialty-tag">
                        {specialty}
                      </span>
                    ))}
                  </div>
                )}

                <div className="profile-hero-actions">
                  <button 
                    onClick={() => document.getElementById('contact-section').scrollIntoView({ behavior: 'smooth' })}
                    className="btn btn-primary btn-large"
                  >
                    Get in Touch
                  </button>
                  {profile.website && (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="nofollow noopener noreferrer"
                      className="btn btn-secondary btn-large"
                    >
                      Visit External Profile
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="profile-content">
        <div className="container">
          <div className="profile-content-grid">
            {/* Left Column - Main Content */}
            <div className="profile-main-content">
              {/* About Section */}
              <div className="content-section">
                <h2 className="section-title">About {profile.full_name.split(' ')[0]}</h2>
                <div className="section-content">
                  {profile.bio ? (
                    <div className="profile-bio-content">
                      {profile.bio.split('\n').map((paragraph, index) => (
                        <p key={index} className="bio-paragraph">{paragraph}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted">No bio available for this professional.</p>
                  )}
                </div>
              </div>

              {/* Specialties Section */}
              {profile.specialties && profile.specialties.length > 0 && (
                <div className="content-section">
                  <h2 className="section-title">Areas of Expertise</h2>
                  <div className="section-content">
                    <div className="specialties-grid">
                      {profile.specialties.map((specialty, index) => (
                        <div key={index} className="specialty-item">
                          <div className="specialty-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                          </div>
                          <span className="specialty-name">{specialty}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Credentials Section */}
              {profile.credentials && Array.isArray(profile.credentials) && profile.credentials.length > 0 && (
                <div className="content-section">
                  <h2 className="section-title">Professional Credentials</h2>
                  <div className="section-content">
                    <div className="credentials-list">
                      {profile.credentials.map((credential, index) => (
                        <div key={index} className="credential-item">
                          <div className="credential-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                          </div>
                          <span className="credential-name">{credential}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Approach/Methodology Section */}
              {profile.approach && (
                <div className="content-section">
                  <h2 className="section-title">Therapeutic Approach</h2>
                  <div className="section-content">
                    <div className="profile-bio-content">
                      {profile.approach.split('\n').map((paragraph, index) => (
                        <p key={index} className="bio-paragraph">{paragraph}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Client Focus Section */}
              {(profile.client_focus || profile.languages || profile.session_types) && (
                <div className="content-section">
                  <h2 className="section-title">Client Focus</h2>
                  <div className="section-content">
                    <div className="specialties-grid">
                      {profile.client_focus && profile.client_focus.map((focus, index) => (
                        <div key={index} className="specialty-item">
                          <div className="specialty-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                          </div>
                          <span className="specialty-name">{focus}</span>
                        </div>
                      ))}
                      {profile.languages && profile.languages.map((language, index) => (
                        <div key={`lang-${index}`} className="specialty-item">
                          <div className="specialty-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.1-4.61.64-6.84-1.46-2.23-4.12-3.12-6.41-2.35-2.29.77-3.82 2.87-3.82 5.28 0 2.01 1.03 3.77 2.54 4.82l-1.03 1.03c-1.7-1.4-2.72-3.55-2.72-5.85 0-3.73 3.03-6.76 6.76-6.76 2.13 0 4.04.91 5.38 2.35 1.34-1.44 3.25-2.35 5.38-2.35 3.73 0 6.76 3.03 6.76 6.76 0 2.3-1.02 4.45-2.72 5.85l-1.03-1.03c1.51-1.05 2.54-2.81 2.54-4.82 0-2.41-1.53-4.51-3.82-5.28-2.29-.77-4.95.12-6.41 2.35-1.46 2.23-1.1 4.9.64 6.84l.03.03-2.54 2.51z"/>
                            </svg>
                          </div>
                          <span className="specialty-name">{language}</span>
                        </div>
                      ))}
                      {profile.session_types && profile.session_types.map((sessionType, index) => (
                        <div key={`session-${index}`} className="specialty-item">
                          <div className="specialty-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                            </svg>
                          </div>
                          <span className="specialty-name">{sessionType}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="profile-sidebar-content">
              {/* Contact Card - FOR COUPLES */}
              <div id="contact-section" className="sidebar-card contact-card">
                <h3 className="card-title">Contact this counselor</h3>
                <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                  Looking for premarital counseling in {profile.city || 'your area'}? Connect with this counselor.
                </p>
                <LeadContactForm
                  profileId={profile.id}
                  professionalName={profile.full_name}
                  onSuccess={handleLeadSuccess}
                />
              </div>

              {/* Contact Info Card */}
              <div className="sidebar-card contact-info-card">
                <h3 className="card-title">Contact Information</h3>
                <div className="contact-info-list">
                  {profile.phone && (
                    <div className="contact-info-item">
                      <div className="contact-info-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                        </svg>
                      </div>
                      <div className="contact-info-content">
                        <div className="contact-info-label">Phone</div>
                        <a href={`tel:${profile.phone}`} className="contact-info-value">
                          {formatPhoneNumber(profile.phone)}
                        </a>
                      </div>
                    </div>
                  )}

                  {profile.email && (
                    <div className="contact-info-item">
                      <div className="contact-info-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                        </svg>
                      </div>
                      <div className="contact-info-content">
                        <div className="contact-info-label">Email</div>
                        <a href={`mailto:${profile.email}`} className="contact-info-value">
                          {profile.email}
                        </a>
                      </div>
                    </div>
                  )}

                  {profile.website && (
                    <div className="contact-info-item">
                      <div className="contact-info-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                      </div>
                      <div className="contact-info-content">
                        <div className="contact-info-label">External Profile</div>
                        <a href={profile.website} target="_blank" rel="nofollow noopener noreferrer" className="contact-info-value">
                          Visit external profile
                        </a>
                      </div>
                    </div>
                  )}

                  {profile.address_line1 && (
                    <div className="contact-info-item">
                      <div className="contact-info-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                      </div>
                      <div className="contact-info-content">
                        <div className="contact-info-label">Address</div>
                        <div className="contact-info-value">
                          {profile.address_line1}<br />
                          {formatLocation(profile)} {profile.postal_code}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="sidebar-card quick-actions-card">
                <h3 className="card-title">Quick Actions</h3>
                <div className="quick-actions-list">
                  {profile.website && (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="nofollow noopener noreferrer"
                      className="quick-action-btn"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                      Visit External Profile
                    </a>
                  )}
                  
                  {profile.phone && (
                    <a 
                      href={`tel:${profile.phone}`}
                      className="quick-action-btn"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                      </svg>
                      Call Now
                    </a>
                  )}
                  
                  <Link to="/" className="quick-action-btn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                    </svg>
                    Browse More Professionals
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Claim Profile Section - FOR THE COUNSELOR */}
      <section className="claim-profile-section" style={{ background: 'var(--bg-secondary)', padding: 'var(--space-16) 0' }}>
        <div className="container">
          <div className="claim-profile-card" style={{
            background: 'white',
            padding: 'var(--space-12)',
            borderRadius: 'var(--radius-lg)',
            maxWidth: '800px',
            margin: '0 auto',
            textAlign: 'center'
          }}>
            <h2 style={{ marginBottom: 'var(--space-4)' }}>Is this your profile?</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
              This listing was added so engaged couples can find premarital counseling in {profile.city || 'your area'}.
              {!profile.is_claimed && " It hasn't been claimed yet."}
            </p>
            <Link
              to={`/claim-profile/${profile.slug || profile.id}`}
              className="btn btn-primary btn-large"
              style={{ marginBottom: 'var(--space-4)' }}
            >
              {profile.is_claimed ? 'Update this listing' : 'Claim this listing'}
            </Link>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
              Free to claim. Verified counselors can update their info, add specialties, and receive lead notifications.
              {!profile.is_claimed && ' You can also request removal if you prefer.'}
            </p>
          </div>
        </div>
      </section>
      </div>
    </>
  )
}

export default ProfilePage
