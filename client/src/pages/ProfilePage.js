import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { generateSlug } from '../lib/utils'
import { formatLocation, formatPhoneNumber } from '../lib/utils'
import LeadContactForm from '../components/leads/LeadContactForm'
import Breadcrumbs, { generateBreadcrumbs } from '../components/common/Breadcrumbs'
import SEOHelmet, { generateProfessionalStructuredData } from '../components/analytics/SEOHelmet'
import { trackProfileView } from '../components/analytics/GoogleAnalytics'
import { trackFacebookProfileView } from '../components/analytics/FacebookPixel'

import { profileOperations } from '../lib/supabaseClient'
import UnclaimedProfileBanner from '../components/profiles/UnclaimedProfileBanner'
import '../assets/css/profile-page-enhanced.css'

const asArray = (value) => {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => (typeof item === 'string' ? item.trim() : item))
    .filter(Boolean)
}

const uniqueValues = (values) => {
  const seen = new Set()

  return values.filter((value) => {
    const normalized = String(value).toLowerCase()
    if (seen.has(normalized)) return false
    seen.add(normalized)
    return true
  })
}

const formatFaithTradition = (value) => {
  if (!value) return null
  if (value === 'all-faiths') return 'All faiths welcome'
  if (value === 'secular') return 'Secular / non-religious'
  return value
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

const toBooleanFlag = (value) => {
  if (typeof value === 'boolean') return value
  if (value == null) return false
  if (typeof value === 'number') return value !== 0

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (!normalized) return false
    if (['false', '0', 'no', 'none', 'null', 'n/a'].includes(normalized)) return false
    return true
  }

  return Boolean(value)
}

const ProfilePage = ({ stateOverride, cityOverride, profileSlugOverride }) => {
  const params = useParams()
  const state = stateOverride || params.state
  const city = cityOverride || params.city
  const profileSlug = profileSlugOverride || params.profileSlug
  const slugOrId = params.slugOrId

  const currentSlug = profileSlug || slugOrId
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [phoneRevealed, setPhoneRevealed] = useState(false)
  const [emailRevealed, setEmailRevealed] = useState(false)
  const [imageError, setImageError] = useState(false)
  const navigate = useNavigate()

  const canShowDirectContact = profile?.tier === 'local_featured' || profile?.tier === 'area_spotlight'

  useEffect(() => {
    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSlug])

  useEffect(() => {
    if (profile) {
      document.title = `${profile.full_name} - ${profile.profession} | Premarital Counseling Directory`
    }
  }, [profile])

  useEffect(() => {
    if (profile && !state) {
      const stateSlug = profile.state_province ? generateSlug(profile.state_province) : null
      const citySlug = profile.city ? generateSlug(profile.city) : null
      const normalizedProfileSlug = profile.slug || generateSlug(profile.full_name)

      if (stateSlug && citySlug && normalizedProfileSlug) {
        navigate(`/premarital-counseling/${stateSlug}/${citySlug}/${normalizedProfileSlug}`, { replace: true })
      } else if (stateSlug && normalizedProfileSlug) {
        navigate(`/premarital-counseling/${stateSlug}/${normalizedProfileSlug}`, { replace: true })
      }
    }
  }, [profile, state, city, navigate])

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

      let { data, error: getProfileError } = await profileOperations.getProfile(currentSlug)

      if (getProfileError || !data) {
        const searchTerm = currentSlug.replace(/-/g, ' ')
        const searchResult = await profileOperations.searchProfiles(searchTerm)

        if (searchResult.data && searchResult.data.length > 0) {
          data = searchResult.data[0]
          getProfileError = null
        }
      }

      if (getProfileError) {
        setError(getProfileError.message)
      } else if (!data) {
        setError('Profile not found')
      } else {
        setProfile(data)
      }
    } catch (err) {
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleLeadSuccess = (leadData) => {
    console.log('Lead submitted successfully:', leadData)
  }

  const handleRevealContact = async (type) => {
    try {
      await profileOperations.logContactReveal({
        profile_id: profile.id,
        reveal_type: type,
        ip_address: null,
        user_agent: navigator.userAgent,
        session_id: sessionStorage.getItem('session_id') || null,
        city: profile.city || city || null,
        state_province: profile.state_province || state || null,
        page_url: window.location.href,
        referrer: document.referrer || null
      })

      if (type === 'phone') setPhoneRevealed(true)
      if (type === 'email') setEmailRevealed(true)
    } catch (err) {
      console.error('Failed to log reveal:', err)
      if (type === 'phone') setPhoneRevealed(true)
      if (type === 'email') setEmailRevealed(true)
    }
  }

  const scrollToContact = () => {
    document.getElementById('contact-section')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
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
            : 'We encountered an error while loading this profile.'}
        </p>
        <Link to="/" className="btn btn-primary">
          Browse All Professionals
        </Link>
      </div>
    )
  }

  const stateName = profile?.state_province || (state ? state.replace(/-/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase()) : null)
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

  const firstName = profile?.full_name?.split(' ')[0] || 'Professional'
  const specialties = uniqueValues(asArray(profile?.specialties))
  const treatmentApproaches = uniqueValues(asArray(profile?.treatment_approaches))
  const clientFocus = uniqueValues(asArray(profile?.client_focus))
  const languages = uniqueValues(asArray(profile?.languages))
  const sessionTypes = uniqueValues(asArray(profile?.session_types))
  const credentials = uniqueValues(asArray(profile?.credentials))
  const certifications = uniqueValues(asArray(profile?.certifications))
  const education = uniqueValues(asArray(profile?.education))
  const insuranceAccepted = uniqueValues(asArray(profile?.insurance_accepted))
  const paymentMethods = uniqueValues(asArray(profile?.payment_methods))
  const faithTraditionLabel = formatFaithTradition(profile?.faith_tradition)
  const hasOnlineOption = sessionTypes.some((sessionType) => /online|virtual|hybrid/i.test(sessionType))
  const slidingScaleEnabled = toBooleanFlag(profile?.sliding_scale)
  const freeConsultationEnabled = toBooleanFlag(profile?.offers_free_consultation)

  const focusGroups = [
    { label: 'Specialties', items: specialties },
    { label: 'Approach', items: treatmentApproaches },
    { label: 'Client Focus', items: clientFocus },
    { label: 'Languages', items: languages },
    { label: 'Session Format', items: sessionTypes },
    { label: 'Faith', items: faithTraditionLabel ? [faithTraditionLabel] : [] }
  ].filter((group) => group.items.length > 0)

  const credentialGroups = [
    { label: 'Credentials', items: credentials },
    { label: 'Certifications', items: certifications },
    { label: 'Education', items: education }
  ].filter((group) => group.items.length > 0)

  const faqItems = [
    {
      question: 'What is premarital counseling?',
      answer: 'Premarital counseling helps couples build communication skills, align expectations, and prepare for marriage with practical tools.'
    },
    {
      question: 'How long does counseling usually take?',
      answer: 'Most couples complete 4 to 8 sessions, depending on goals, timeline, and session frequency.'
    },
    {
      question: 'Is insurance accepted?',
      answer: insuranceAccepted.length > 0
        ? `${firstName} lists ${insuranceAccepted.join(', ')}. Confirm eligibility directly with your insurance provider.`
        : 'Coverage varies by plan. Ask your insurance provider and confirm details with the professional.'
    },
    {
      question: 'What happens in the first session?',
      answer: 'The first session typically covers your relationship goals, key stress points, and a practical roadmap for next steps.'
    }
  ]

  const hasPricingSection =
    Boolean(profile?.pricing_range) ||
    insuranceAccepted.length > 0 ||
    paymentMethods.length > 0 ||
    freeConsultationEnabled ||
    slidingScaleEnabled

  return (
    <>
      <SEOHelmet
        title={`${profile?.full_name} - ${profile?.profession}${profile?.city && stateName ? ` in ${profile.city}, ${stateName}` : ''} | Premarital Counseling`}
        description={`Connect with ${profile?.full_name}, a qualified ${profile?.profession}${profile?.city && stateName ? ` in ${profile.city}, ${stateName}` : ''}. ${profile?.bio ? `${profile.bio.substring(0, 150)}...` : 'Specializing in premarital counseling for engaged couples.'}`}
        url={window.location.pathname}
        type="profile"
        structuredData={profile ? generateProfessionalStructuredData(profile) : null}
        professional={profile}
        keywords={`${profile?.profession}, premarital counseling, ${profile?.city}, ${profile?.state_province}, ${specialties.join(', ')}`}
        breadcrumbs={breadcrumbItems}
        canonicalUrl={`https://www.weddingcounselors.com${window.location.pathname}`}
        noindex={false}
      />

      <div className="profile-page profile-premium">
        {profile && !profile.is_claimed && (
          <UnclaimedProfileBanner
            profile={profile}
            viewCount={null}
          />
        )}

        <section className="profile-premium-shell">
          <div className="container">
            <Breadcrumbs items={breadcrumbItems} className="profile-premium-breadcrumbs" />

            <header className="profile-premium-hero">
              <div className="profile-premium-photo-wrap">
                {profile.photo_url && !imageError ? (
                  <img
                    src={profile.photo_url}
                    alt={profile.full_name}
                    className="profile-premium-photo"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="profile-premium-photo profile-premium-photo-placeholder">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                )}
                {(profile.tier === 'local_featured' || profile.tier === 'area_spotlight') && (
                  <span className="profile-premium-badge">
                    {profile.tier === 'area_spotlight' ? 'Area Spotlight' : `Featured in ${profile.city}`}
                  </span>
                )}
              </div>

              <div className="profile-premium-identity">
                <p className="profile-premium-eyebrow">Professional Profile</p>
                <h1>{profile.full_name}</h1>
                <p className="profile-premium-role">
                  {profile.profession}
                  {profile.pronouns ? ` (${profile.pronouns})` : ''}
                </p>

                <div className="profile-premium-meta">
                  <span>{formatLocation(profile)}</span>
                  {profile.years_experience && <span>{profile.years_experience}+ years experience</span>}
                  {profile.accepting_new_clients && <span>Accepting new clients</span>}
                </div>

                {specialties.length > 0 && (
                  <div className="profile-premium-top-tags">
                    {specialties.slice(0, 6).map((specialty) => (
                      <span key={specialty} className="profile-chip">
                        {specialty}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="profile-premium-hero-actions">
                <button onClick={scrollToContact} className="btn btn-primary">
                  Send Message
                </button>
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    className="btn btn-outline"
                  >
                    External Website
                  </a>
                )}
              </div>
            </header>

            <div className="profile-premium-grid">
              <main className="profile-premium-main">
                <section className="profile-premium-card">
                  <h2>About {firstName}</h2>
                  <div className="profile-prose">
                    {profile.bio ? (
                      profile.bio
                        .split('\n')
                        .map((paragraph) => paragraph.trim())
                        .filter(Boolean)
                        .map((paragraph, index) => (
                          <p key={index}>{paragraph}</p>
                        ))
                    ) : (
                      <>
                        <p>
                          {firstName} is a {profile.profession || 'premarital counseling professional'} serving couples in {profile.city}, {profile.state_province}.
                          {profile.years_experience ? ` With ${profile.years_experience} years of experience, ` : ' '}
                          the focus is practical preparation for long-term relationship health.
                        </p>
                        <p className="profile-note-inline">
                          This profile has limited public details. If this is your listing,{' '}
                          <Link to={`/claim-profile/${profile.slug || profile.id}`}>claim your profile</Link> to update it.
                        </p>
                      </>
                    )}
                  </div>
                </section>

                {profile.approach && (
                  <section className="profile-premium-card">
                    <h2>Approach</h2>
                    <div className="profile-prose">
                      {profile.approach
                        .split('\n')
                        .map((paragraph) => paragraph.trim())
                        .filter(Boolean)
                        .map((paragraph, index) => (
                          <p key={index}>{paragraph}</p>
                        ))}
                    </div>
                  </section>
                )}

                {focusGroups.length > 0 && (
                  <section className="profile-premium-card">
                    <h2>Practice Focus</h2>
                    <div className="profile-group-stack">
                      {focusGroups.map((group) => (
                        <div key={group.label} className="profile-group-row">
                          <h3>{group.label}</h3>
                          <div className="profile-chip-list">
                            {group.items.map((item) => (
                              <span key={`${group.label}-${item}`} className="profile-chip profile-chip-soft">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {credentialGroups.length > 0 && (
                  <section className="profile-premium-card">
                    <h2>Credentials</h2>
                    <div className="profile-group-stack">
                      {credentialGroups.map((group) => (
                        <div key={group.label} className="profile-group-row">
                          <h3>{group.label}</h3>
                          <ul className="profile-list-clean">
                            {group.items.map((item) => (
                              <li key={`${group.label}-${item}`}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {hasPricingSection && (
                  <section className="profile-premium-card">
                    <h2>Pricing & Availability</h2>
                    <div className="profile-detail-stack">
                      {profile.pricing_range && (
                        <div className="profile-detail-row">
                          <span>Session Fees</span>
                          <strong>{profile.pricing_range}</strong>
                        </div>
                      )}
                      {insuranceAccepted.length > 0 && (
                        <div className="profile-detail-row profile-detail-row-wrap">
                          <span>Insurance</span>
                          <div className="profile-chip-list">
                            {insuranceAccepted.map((insurance) => (
                              <span key={insurance} className="profile-chip profile-chip-soft">
                                {insurance}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {paymentMethods.length > 0 && (
                        <div className="profile-detail-row profile-detail-row-wrap">
                          <span>Payment Methods</span>
                          <div className="profile-chip-list">
                            {paymentMethods.map((method) => (
                              <span key={method} className="profile-chip profile-chip-soft">
                                {method}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {(freeConsultationEnabled || slidingScaleEnabled) && (
                      <div className="profile-status-row">
                        {freeConsultationEnabled && (
                          <span className="profile-status-pill">Free consultation</span>
                        )}
                        {slidingScaleEnabled && (
                          <span className="profile-status-pill">Sliding scale available</span>
                        )}
                      </div>
                    )}
                  </section>
                )}

                <section className="profile-premium-card">
                  <h2>Frequently Asked Questions</h2>
                  <div className="profile-faq-list">
                    {faqItems.map((faq) => (
                      <article key={faq.question} className="profile-faq-item">
                        <h3>{faq.question}</h3>
                        <p>{faq.answer}</p>
                      </article>
                    ))}
                  </div>
                </section>

                {profile.city && profile.state_province && (
                  <section className="profile-premium-card profile-premium-card-muted">
                    <h2>Premarital Counseling in {profile.city}, {profile.state_province}</h2>
                    <div className="profile-prose">
                      <p>
                        {firstName} serves couples in {profile.city} and nearby communities.
                        {hasOnlineOption ? ' Online sessions are available.' : ''}
                      </p>
                      <p>
                        Finding a strong fit matters. This profile highlights experience, focus areas, and logistics so couples can choose confidently.
                      </p>
                    </div>
                  </section>
                )}
              </main>

              <aside className="profile-premium-side">
                <section className="profile-premium-card profile-premium-card-emphasis">
                  <h2>Work with {firstName}</h2>
                  <div className="profile-kpi-list">
                    {profile.years_experience && (
                      <div className="profile-kpi-row">
                        <span>Experience</span>
                        <strong>{profile.years_experience}+ years</strong>
                      </div>
                    )}
                    <div className="profile-kpi-row">
                      <span>Status</span>
                      <strong>{profile.accepting_new_clients ? 'Accepting new clients' : 'Limited availability'}</strong>
                    </div>
                  </div>

                  {profile.booking_url ? (
                    <a
                      href={profile.booking_url}
                      target="_blank"
                      rel="nofollow noopener noreferrer"
                      className="btn btn-primary btn-full"
                    >
                      Book Consultation
                    </a>
                  ) : (
                    <button onClick={scrollToContact} className="btn btn-primary btn-full">
                      Send Message
                    </button>
                  )}
                </section>

                <section id="contact-section" className="profile-premium-card profile-contact-card">
                  <h2>Send a Message</h2>
                  <LeadContactForm
                    profileId={profile.id}
                    professionalName={profile.full_name}
                    profile={profile}
                    isProfileClaimed={profile.is_claimed}
                    onSuccess={handleLeadSuccess}
                  />
                </section>

                {canShowDirectContact && (
                  <section className="profile-premium-card">
                    <h2>Direct Contact</h2>
                    <div className="profile-contact-list">
                      {profile.phone && (
                        <div className="profile-contact-row">
                          <span>Phone</span>
                          {phoneRevealed ? (
                            <a href={`tel:${profile.phone}`} className="profile-contact-link">
                              {formatPhoneNumber(profile.phone)}
                            </a>
                          ) : (
                            <button onClick={() => handleRevealContact('phone')} className="profile-reveal-btn">
                              Show phone
                            </button>
                          )}
                        </div>
                      )}

                      {profile.email && (
                        <div className="profile-contact-row">
                          <span>Email</span>
                          {emailRevealed ? (
                            <a href={`mailto:${profile.email}`} className="profile-contact-link">
                              {profile.email}
                            </a>
                          ) : (
                            <button onClick={() => handleRevealContact('email')} className="profile-reveal-btn">
                              Show email
                            </button>
                          )}
                        </div>
                      )}

                      {profile.website && (
                        <div className="profile-contact-row">
                          <span>Website</span>
                          <a
                            href={profile.website}
                            target="_blank"
                            rel="nofollow noopener noreferrer"
                            className="profile-contact-link"
                            onClick={() => handleRevealContact('website')}
                          >
                            Visit website
                          </a>
                        </div>
                      )}

                      {profile.address_line1 && (
                        <div className="profile-contact-row profile-contact-row-stack">
                          <span>Address</span>
                          <p>
                            {profile.address_line1}
                            <br />
                            {formatLocation(profile)} {profile.postal_code}
                          </p>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {profile.city && profile.state_province && (
                  <section className="profile-premium-card">
                    <h2>Explore More</h2>
                    <div className="profile-link-list">
                      <Link
                        to={`/premarital-counseling/${state || generateSlug(profile.state_province)}/${generateSlug(profile.city)}`}
                        className="profile-link-row"
                      >
                        Premarital counseling in {profile.city}
                      </Link>
                      <Link
                        to={`/premarital-counseling/${state || generateSlug(profile.state_province)}`}
                        className="profile-link-row"
                      >
                        Browse all {profile.state_province} counselors
                      </Link>
                    </div>
                  </section>
                )}

                {!profile.is_claimed && (
                  <section className="profile-premium-card profile-premium-card-claim">
                    <h2>Is this your profile?</h2>
                    <p>
                      Claim this listing to update details, manage inquiries, and receive lead notifications.
                    </p>
                    <Link
                      to={`/claim-profile/${profile.slug || profile.id}`}
                      className="btn btn-primary btn-full"
                      onClick={() => {
                        if (window.gtag) {
                          window.gtag('event', 'click', {
                            event_category: 'Claim Profile',
                            event_label: 'Sidebar CTA',
                            value: profile.id
                          })
                        }
                      }}
                    >
                      Claim This Profile
                    </Link>
                    <small>Free to claim. No credit card required.</small>
                  </section>
                )}
              </aside>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

export default ProfilePage
