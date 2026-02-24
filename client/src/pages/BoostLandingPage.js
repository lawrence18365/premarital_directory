import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import LeadContactForm from '../components/leads/LeadContactForm'
import { profileOperations } from '../lib/supabaseClient'
import { formatLocation } from '../lib/utils'
import '../assets/css/boost-landing.css'

const asArray = (value) => (Array.isArray(value) ? value : [])

const getMethodLabel = (profile) => {
  const text = [
    ...asArray(profile?.treatment_approaches),
    ...asArray(profile?.certifications)
  ].join(' ').toLowerCase()
  if (!text) return null
  if (text.includes('gottman')) return 'Gottman Method'
  if (text.includes('emotionally focused') || text.includes('eft')) return 'EFT'
  if (text.includes('prepare/enrich') || text.includes('prepare enrich')) return 'PREPARE/ENRICH'
  if (text.includes('symbis')) return 'SYMBIS'
  return asArray(profile?.treatment_approaches)[0] || null
}

const getRateLabel = (profile) => {
  const min = Number(profile?.session_fee_min) > 0 ? Math.round(Number(profile.session_fee_min) / 100) : null
  const max = Number(profile?.session_fee_max) > 0 ? Math.round(Number(profile.session_fee_max) / 100) : null
  if (min && max) return `$${min}–$${max}/session`
  if (min) return `From $${min}/session`
  if (profile?.pricing_range) return String(profile.pricing_range)
  return null
}

const getSessionTypes = (profile) => {
  const types = asArray(profile?.session_types).map((t) => String(t).toLowerCase())
  const hasOnline = types.includes('online') || types.includes('hybrid')
  const hasInPerson = types.includes('in-person') || types.includes('hybrid')
  if (hasOnline && hasInPerson) return 'Online & In-Person'
  if (hasOnline) return 'Online'
  if (hasInPerson) return 'In-Person'
  return null
}

const BoostLandingPage = () => {
  const { profileSlug } = useParams()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data, error: fetchError } = await profileOperations.getProfileBySlug(profileSlug)
        if (fetchError || !data) {
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
    loadProfile()
  }, [profileSlug])

  if (loading) {
    return (
      <div className="boost-page">
        <div className="boost-loading">
          <div className="boost-loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="boost-page">
        <div className="boost-error">
          <h1>Profile Not Found</h1>
          <p>This counselor profile could not be found.</p>
          <Link to="/premarital-counseling" className="boost-btn boost-btn--outline">
            Browse All Counselors
          </Link>
        </div>
      </div>
    )
  }

  const name = profile.full_name || 'Premarital Counselor'
  const profession = profile.profession || 'Premarital Counselor'
  const location = formatLocation(profile)
  const method = getMethodLabel(profile)
  const rate = getRateLabel(profile)
  const sessionType = getSessionTypes(profile)
  const bio = profile.bio || ''
  const shortBio = bio.length > 300 ? bio.substring(0, 297) + '...' : bio
  const hasPhoto = Boolean(profile.photo_url)
  const contactReveals = Number(profile.contact_reveals_count) || 0
  const credentials = [
    ...asArray(profile.credentials),
    ...asArray(profile.certifications)
  ].filter(Boolean).slice(0, 4)
  const specialties = asArray(profile.specialties).slice(0, 5)
  const insuranceAccepted = asArray(profile.insurance_accepted).filter(
    (i) => String(i).toLowerCase() !== 'self-pay only'
  )
  const hasInsurance = insuranceAccepted.length > 0
  const hasFreeConsult = Boolean(profile.free_consultation)

  const trustSignals = [
    sessionType,
    rate,
    hasInsurance ? 'Insurance accepted' : null,
    hasFreeConsult ? 'Free consultation' : null,
    method,
    profile.years_experience ? `${profile.years_experience}+ years experience` : null,
  ].filter(Boolean)

  return (
    <div className="boost-page">
      <Helmet>
        <title>{name} — Premarital Counseling | Book a Session</title>
        <meta name="description" content={`${profession} in ${location}. ${method ? method + ' trained. ' : ''}${rate ? rate + '. ' : ''}Contact ${name} directly for premarital counseling.`} />
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      {/* Minimal header */}
      <header className="boost-header">
        <div className="boost-header__inner">
          <Link to="/" className="boost-header__logo">
            WeddingCounselors.com
          </Link>
          <span className="boost-header__tagline">Premarital Counseling Directory</span>
        </div>
      </header>

      {/* Hero Section */}
      <section className="boost-hero">
        <div className="boost-hero__inner">
          <div className="boost-hero__profile">
            {hasPhoto ? (
              <img
                src={profile.photo_url}
                alt={name}
                className="boost-hero__photo"
              />
            ) : (
              <div className="boost-hero__photo boost-hero__photo--placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
            )}
            <div className="boost-hero__info">
              <h1 className="boost-hero__name">{name}</h1>
              <p className="boost-hero__profession">{profession}</p>
              <p className="boost-hero__location">
                <i className="fa fa-map-marker-alt"></i> {location}
              </p>
              {contactReveals >= 3 && (
                <p className="boost-hero__activity">
                  <i className="fa fa-bolt"></i>
                  {contactReveals >= 10 ? 'Frequently contacted by couples' : 'Recently contacted by couples'}
                </p>
              )}
            </div>
          </div>

          <div className="boost-hero__cta">
            <button
              onClick={() => document.getElementById('boost-contact-form')?.scrollIntoView({ behavior: 'smooth' })}
              className="boost-btn boost-btn--primary boost-btn--large"
            >
              Contact {name.split(' ')[0]} Today
            </button>
            <p className="boost-hero__response-time">Most counselors respond within 1-2 business days</p>
          </div>
        </div>
      </section>

      {/* Trust Signals Bar */}
      <section className="boost-trust-bar">
        <div className="boost-trust-bar__inner">
          {trustSignals.map((signal, i) => (
            <span key={i} className="boost-trust-signal">{signal}</span>
          ))}
        </div>
      </section>

      {/* Main Content - 2 column on desktop */}
      <div className="boost-content">
        <div className="boost-content__inner">
          {/* Left: About + Details */}
          <div className="boost-content__main">
            {/* About */}
            {shortBio && (
              <section className="boost-section">
                <h2>About {name.split(' ')[0]}</h2>
                <p className="boost-section__text">{shortBio}</p>
              </section>
            )}

            {/* Credentials */}
            {credentials.length > 0 && (
              <section className="boost-section">
                <h2>Credentials & Training</h2>
                <ul className="boost-credentials">
                  {credentials.map((cred, i) => (
                    <li key={i}><i className="fa fa-check-circle"></i> {cred}</li>
                  ))}
                </ul>
              </section>
            )}

            {/* Specialties */}
            {specialties.length > 0 && (
              <section className="boost-section">
                <h2>Specialties</h2>
                <div className="boost-tags">
                  {specialties.map((s, i) => (
                    <span key={i} className="boost-tag">{s}</span>
                  ))}
                </div>
              </section>
            )}

            {/* Key Details */}
            <section className="boost-section boost-details">
              <h2>Session Details</h2>
              <div className="boost-details__grid">
                {rate && (
                  <div className="boost-detail">
                    <span className="boost-detail__label">Cost</span>
                    <span className="boost-detail__value">{rate}</span>
                  </div>
                )}
                {sessionType && (
                  <div className="boost-detail">
                    <span className="boost-detail__label">Format</span>
                    <span className="boost-detail__value">{sessionType}</span>
                  </div>
                )}
                {hasInsurance && (
                  <div className="boost-detail">
                    <span className="boost-detail__label">Insurance</span>
                    <span className="boost-detail__value">{insuranceAccepted.slice(0, 3).join(', ')}</span>
                  </div>
                )}
                {hasFreeConsult && (
                  <div className="boost-detail">
                    <span className="boost-detail__label">Free Consultation</span>
                    <span className="boost-detail__value">Yes</span>
                  </div>
                )}
                {method && (
                  <div className="boost-detail">
                    <span className="boost-detail__label">Method</span>
                    <span className="boost-detail__value">{method}</span>
                  </div>
                )}
                {profile.years_experience && (
                  <div className="boost-detail">
                    <span className="boost-detail__label">Experience</span>
                    <span className="boost-detail__value">{profile.years_experience}+ years</span>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right: Contact Form (sticky on desktop) */}
          <div className="boost-content__sidebar" id="boost-contact-form">
            <div className="boost-form-card">
              <h2 className="boost-form-card__title">
                Send a Message to {name.split(' ')[0]}
              </h2>
              <p className="boost-form-card__subtitle">
                Tell them about your wedding plans and what you're looking for in premarital counseling.
              </p>
              <LeadContactForm
                profileId={profile.id}
                professionalName={name}
                isProfileClaimed={Boolean(profile.is_claimed)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <section className="boost-bottom-cta">
        <div className="boost-bottom-cta__inner">
          <h2>Ready to start your marriage preparation?</h2>
          <p>Contact {name.split(' ')[0]} today to schedule your first premarital counseling session.</p>
          <button
            onClick={() => document.getElementById('boost-contact-form')?.scrollIntoView({ behavior: 'smooth' })}
            className="boost-btn boost-btn--primary boost-btn--large"
          >
            Send a Message
          </button>
        </div>
      </section>

      {/* Minimal footer */}
      <footer className="boost-footer">
        <div className="boost-footer__inner">
          <Link to="/" className="boost-footer__link">WeddingCounselors.com</Link>
          <span className="boost-footer__sep">·</span>
          <Link to="/premarital-counseling" className="boost-footer__link">Browse All Counselors</Link>
          <span className="boost-footer__sep">·</span>
          <Link to="/privacy" className="boost-footer__link">Privacy</Link>
        </div>
      </footer>
    </div>
  )
}

export default BoostLandingPage
