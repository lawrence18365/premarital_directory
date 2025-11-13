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
import '../assets/css/profile-page-enhanced.css'

const ProfilePage = () => {
  const { slugOrId, state, city, profileSlug } = useParams()
  // Use profileSlug if available (new URL structure), otherwise use slugOrId (old structure)
  const currentSlug = profileSlug || slugOrId
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showContactForm, setShowContactForm] = useState(true)
  const [phoneRevealed, setPhoneRevealed] = useState(false)
  const [emailRevealed, setEmailRevealed] = useState(false)
  const navigate = useNavigate()

  // Determine if contact info should be visible based on tier
  const canShowDirectContact = profile?.tier === 'local_featured' || profile?.tier === 'area_spotlight'
  const isCommunityTier = profile?.tier === 'community' || !profile?.tier

  useEffect(() => {
    loadProfile()
  }, [currentSlug])

  useEffect(() => {
    // Update page title when profile loads
    if (profile) {
      document.title = `${profile.full_name} - ${profile.profession} | Premarital Counseling Directory`
    }
  }, [profile])

  // Redirect old UUID URLs to new slug-based URLs (SEO critical!)
  useEffect(() => {
    if (profile && !state) {
      // We're on /profile/{uuid} - redirect to proper nested URL
      const stateSlug = profile.state_province ? generateSlug(profile.state_province) : null
      const citySlug = profile.city ? generateSlug(profile.city) : null
      const profileSlug = profile.slug || generateSlug(profile.full_name)

      if (stateSlug && citySlug && profileSlug) {
        // Redirect to proper nested URL: /premarital-counseling/state/city/name-slug
        navigate(`/premarital-counseling/${stateSlug}/${citySlug}/${profileSlug}`, { replace: true })
      } else if (stateSlug && profileSlug) {
        // Fallback: redirect to /premarital-counseling/state/name-slug
        navigate(`/premarital-counseling/${stateSlug}/${profileSlug}`, { replace: true })
      }
    }
  }, [profile, state, city, navigate])

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
    // Set profile data (reviews will be added when we have a real review system)
    setProfile(data);
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

  const handleRevealContact = async (type) => {
    // Log contact reveal for analytics
    try {
      await profileOperations.logContactReveal({
        profile_id: profile.id,
        reveal_type: type,
        ip_address: null, // Will be captured server-side
        user_agent: navigator.userAgent,
        session_id: sessionStorage.getItem('session_id') || null
      })

      // Show the contact info
      if (type === 'phone') setPhoneRevealed(true)
      if (type === 'email') setEmailRevealed(true)
    } catch (err) {
      console.error('Failed to log reveal:', err)
      // Show anyway even if logging fails
      if (type === 'phone') setPhoneRevealed(true)
      if (type === 'email') setEmailRevealed(true)
    }
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
        `/premarital-counseling/${state || generateSlug(stateName)}`,
        null
      )
    : generateBreadcrumbs.profilePage(
        'All Locations',
        profile?.full_name || 'Profile',
        '/premarital-counseling',
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
                {(profile.tier === 'local_featured' || profile.tier === 'area_spotlight') && (
                  <div className="hero-sponsored-badge">
                    {profile.tier === 'area_spotlight' ? `Area Spotlight` : `Featured in ${profile.city}`}
                  </div>
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
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      {profile.years_experience}+ years of experience
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
                    <div className="profile-bio-content">
                      <p className="bio-paragraph">
                        {profile.full_name} is a {profile.profession || 'professional counselor'} serving couples in {profile.city}, {profile.state_province}.
                        {profile.years_experience && ` With ${profile.years_experience} years of experience in the field, `}
                        {profile.full_name.split(' ')[0]} specializes in helping engaged couples prepare for a successful marriage through premarital counseling.
                      </p>
                      <p className="bio-paragraph">
                        {profile.specialties && profile.specialties.length > 0
                          ? `Areas of focus include ${profile.specialties.slice(0, 3).join(', ')}${profile.specialties.length > 3 ? ', and more' : ''}.`
                          : 'Premarital counseling helps couples build strong communication skills, resolve conflicts effectively, and establish a solid foundation for their future together.'}
                      </p>
                      <p className="bio-paragraph" style={{
                        padding: 'var(--space-3)',
                        background: 'var(--warning-bg)',
                        borderLeft: '3px solid var(--warning)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.875rem'
                      }}>
                        <strong>Note:</strong> This profile hasn't been claimed yet. Information may be limited.
                        If this is your profile, <Link to={`/claim-profile/${profile.slug || profile.id}`} style={{ color: 'var(--primary)', textDecoration: 'underline' }}>claim it now</Link> to add your bio and complete your listing.
                      </p>
                    </div>
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

              {/* Education Section */}
              {profile.education && Array.isArray(profile.education) && profile.education.length > 0 && (
                <div className="content-section">
                  <h2 className="section-title">Education & Training</h2>
                  <div className="section-content">
                    <div className="credentials-list">
                      {profile.education.map((edu, index) => (
                        <div key={index} className="credential-item">
                          <div className="credential-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
                            </svg>
                          </div>
                          <span className="credential-name">{edu}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Pricing & Insurance Section */}
              {(profile.pricing_range || profile.insurance_accepted || profile.offers_free_consultation) && (
                <div className="content-section">
                  <h2 className="section-title">Pricing & Insurance</h2>
                  <div className="section-content">
                    {profile.pricing_range && (
                      <div className="info-item" style={{ marginBottom: 'var(--space-4)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--primary)' }}>
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
                          </svg>
                          <strong>Session Fees:</strong>
                        </div>
                        <p style={{ marginLeft: '1.75rem', color: 'var(--text-secondary)' }}>{profile.pricing_range}</p>
                      </div>
                    )}

                    {profile.insurance_accepted && profile.insurance_accepted.length > 0 && (
                      <div className="info-item" style={{ marginBottom: 'var(--space-4)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--primary)' }}>
                            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                          </svg>
                          <strong>Insurance Accepted:</strong>
                        </div>
                        <div style={{ marginLeft: '1.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {profile.insurance_accepted.map((insurance, index) => (
                            <span key={index} className="hero-specialty-tag" style={{ fontSize: '0.875rem' }}>
                              {insurance}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {profile.offers_free_consultation && (
                      <div className="info-item" style={{
                        padding: 'var(--space-3)',
                        background: 'var(--success-bg)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--success)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success-dark)' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          <strong>Free consultation available</strong>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* FAQ Section - Always show for SEO */}
              <div className="content-section">
                <h2 className="section-title">Frequently Asked Questions</h2>
                <div className="section-content">
                  <div className="faq-list">
                    <div className="faq-item" style={{ marginBottom: 'var(--space-4)' }}>
                      <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                        What is premarital counseling?
                      </h3>
                      <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                        Premarital counseling is a type of therapy that helps couples prepare for marriage. It addresses important topics like communication, conflict resolution, finances, family planning, and expectations to build a strong foundation for your relationship.
                      </p>
                    </div>

                    <div className="faq-item" style={{ marginBottom: 'var(--space-4)' }}>
                      <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                        How long does premarital counseling take?
                      </h3>
                      <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                        Most couples attend 4-8 sessions before their wedding. Some programs are more intensive, while others are flexible based on your needs and schedule.
                      </p>
                    </div>

                    <div className="faq-item" style={{ marginBottom: 'var(--space-4)' }}>
                      <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                        Does insurance cover premarital counseling?
                      </h3>
                      <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                        {profile.insurance_accepted && profile.insurance_accepted.length > 0
                          ? `${profile.full_name.split(' ')[0]} accepts ${profile.insurance_accepted.join(', ')}. Contact your insurance provider to verify your specific coverage for premarital counseling.`
                          : 'Coverage varies by insurance provider. Some plans cover premarital counseling as preventive care. Contact your insurance company to check your benefits, or ask this counselor about payment options.'}
                      </p>
                    </div>

                    <div className="faq-item">
                      <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                        What should we expect in our first session?
                      </h3>
                      <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                        The first session typically involves getting to know your counselor, discussing your relationship goals, and identifying areas you'd like to work on together. It's a comfortable, confidential space to begin your journey.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Local SEO Content */}
              {profile.city && profile.state_province && (
                <div className="content-section" style={{ background: 'var(--bg-secondary)', padding: 'var(--space-6)', borderRadius: 'var(--radius-lg)' }}>
                  <h2 className="section-title">Premarital Counseling in {profile.city}, {profile.state_province}</h2>
                  <div className="section-content">
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: 'var(--space-3)' }}>
                      {profile.full_name.split(' ')[0]} serves couples in {profile.city} and the surrounding {profile.state_province} area.
                      {profile.session_types && profile.session_types.includes('Online') &&
                        ' Online sessions are also available for couples who prefer virtual counseling.'}
                    </p>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
                      Finding the right premarital counselor is an important step in preparing for marriage.
                      {profile.years_experience && ` With ${profile.years_experience} years of experience, `}
                      {profile.full_name.split(' ')[0]} helps engaged couples build strong, lasting relationships through proven therapeutic approaches.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="profile-sidebar-content">
              {/* Quick Stats Card */}
              <div className="sidebar-card" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)', color: 'white', textAlign: 'center' }}>
                <div style={{ padding: 'var(--space-6)' }}>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-4)', color: 'white' }}>
                    Ready to strengthen your relationship?
                  </h3>
                  {profile.years_experience && (
                    <div style={{ marginBottom: 'var(--space-3)' }}>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                        {profile.years_experience}+
                      </div>
                      <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                        Years of Experience
                      </div>
                    </div>
                  )}
                  {profile.accepting_new_clients && (
                    <div style={{
                      padding: 'var(--space-2)',
                      background: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: 'var(--radius-md)',
                      marginTop: 'var(--space-3)',
                      fontSize: '0.875rem',
                      fontWeight: 'bold'
                    }}>
                      ✓ Accepting New Clients
                    </div>
                  )}
                  {profile.booking_url ? (
                    <a
                      href={profile.booking_url}
                      target="_blank"
                      rel="nofollow noopener noreferrer"
                      className="btn btn-secondary btn-large"
                      style={{ marginTop: 'var(--space-4)', width: '100%', background: 'white', color: 'var(--primary)' }}
                    >
                      Book Appointment Now
                    </a>
                  ) : (
                    <button
                      onClick={() => document.getElementById('contact-section').scrollIntoView({ behavior: 'smooth' })}
                      className="btn btn-secondary btn-large"
                      style={{ marginTop: 'var(--space-4)', width: '100%', background: 'white', color: 'var(--primary)' }}
                    >
                      Get in Touch
                    </button>
                  )}
                </div>
              </div>

              {/* Contact Card - FOR COUPLES */}
              <div id="contact-section" className="sidebar-card contact-card">
                <h3 className="card-title">Send a Message</h3>
                <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                  {profile.offers_free_consultation
                    ? 'Request your free consultation today!'
                    : `Interested in working with ${profile.full_name.split(' ')[0]}? Send a message to get started.`}
                </p>
                <LeadContactForm
                  profileId={profile.id}
                  professionalName={profile.full_name}
                  onSuccess={handleLeadSuccess}
                />
              </div>

              {/* Contact Info Card - Only show for Local Featured / Area Spotlight */}
              {canShowDirectContact && (
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
                          {phoneRevealed ? (
                            <a href={`tel:${profile.phone}`} className="contact-info-value">
                              {formatPhoneNumber(profile.phone)}
                            </a>
                          ) : (
                            <button
                              onClick={() => handleRevealContact('phone')}
                              className="btn btn-sm btn-outline"
                              style={{ marginTop: '0.5rem' }}
                            >
                              Show Phone Number
                            </button>
                          )}
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
                          {emailRevealed ? (
                            <a href={`mailto:${profile.email}`} className="contact-info-value">
                              {profile.email}
                            </a>
                          ) : (
                            <button
                              onClick={() => handleRevealContact('email')}
                              className="btn btn-sm btn-outline"
                              style={{ marginTop: '0.5rem' }}
                            >
                              Show Email
                            </button>
                          )}
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
                          <div className="contact-info-label">Website</div>
                          <a
                            href={profile.website}
                            target="_blank"
                            rel="nofollow noopener noreferrer"
                            className="contact-info-value"
                            onClick={() => handleRevealContact('website')}
                          >
                            Visit Website
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
              )}

              {/* Browse More in City - Critical for internal linking SEO */}
              {profile.city && profile.state_province && (
                <div className="sidebar-card quick-actions-card">
                  <h3 className="card-title">Looking for more options?</h3>
                  <div className="quick-actions-list">
                    <Link
                      to={`/premarital-counseling/${state || generateSlug(profile.state_province)}/${generateSlug(profile.city)}`}
                      className="quick-action-btn"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
                      </svg>
                      Premarital counseling in {profile.city}
                    </Link>
                    <Link
                      to={`/premarital-counseling/${state || generateSlug(profile.state_province)}`}
                      className="quick-action-btn"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                      Browse all {profile.state_province} counselors
                    </Link>
                  </div>
                </div>
              )}

              {/* Quick Actions Card - Only show for paid tiers */}
              {canShowDirectContact && (
                <div className="sidebar-card quick-actions-card">
                  <h3 className="card-title">Quick Actions</h3>
                  <div className="quick-actions-list">
                    {profile.website && (
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="nofollow noopener noreferrer"
                        className="quick-action-btn"
                        onClick={() => handleRevealContact('website')}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        Visit Website
                      </a>
                    )}

                    {profile.phone && phoneRevealed && (
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
                  </div>
                </div>
              )}
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
