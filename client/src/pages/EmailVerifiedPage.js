import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import SEOHelmet from '../components/analytics/SEOHelmet'
import '../assets/css/email-verified.css'

const EmailVerifiedPage = () => {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()
  const [showConfetti, setShowConfetti] = useState(true)

  // Hide confetti after animation
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 4000)
    return () => clearTimeout(timer)
  }, [])

  // If user already has a profile, redirect to dashboard
  useEffect(() => {
    if (!loading && profile) {
      navigate('/professional/dashboard')
    }
  }, [loading, profile, navigate])

  return (
    <>
      <SEOHelmet
        title="Email Verified - Welcome to Wedding Counselors"
        description="Your email has been verified. Create your professional profile now."
        noIndex={true}
      />

      <div className="email-verified">
        {/* Confetti Animation */}
        {showConfetti && (
          <div className="email-verified__confetti" aria-hidden="true">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="confetti-piece"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  backgroundColor: ['#0e5e5e', '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff'][Math.floor(Math.random() * 5)]
                }}
              />
            ))}
          </div>
        )}

        <div className="email-verified__container">
          {/* Success Card */}
          <div className="email-verified__card">
            <div className="email-verified__badge">
              <div className="email-verified__checkmark">
                <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="26" cy="26" r="25" stroke="currentColor" strokeWidth="2"/>
                  <path d="M14 27L22 35L38 19" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            <h1 className="email-verified__title">You're Verified!</h1>
            <p className="email-verified__subtitle">
              Your email has been confirmed. Welcome to Wedding Counselors!
            </p>

            {/* Progress Indicator */}
            <div className="email-verified__progress">
              <div className="email-verified__progress-step completed">
                <div className="step-icon">
                  <i className="fa fa-check" aria-hidden="true"></i>
                </div>
                <span>Account Created</span>
              </div>
              <div className="email-verified__progress-line completed"></div>
              <div className="email-verified__progress-step completed">
                <div className="step-icon">
                  <i className="fa fa-check" aria-hidden="true"></i>
                </div>
                <span>Email Verified</span>
              </div>
              <div className="email-verified__progress-line"></div>
              <div className="email-verified__progress-step">
                <div className="step-icon">
                  <span>3</span>
                </div>
                <span>Create Profile</span>
              </div>
            </div>

            {/* CTA Section */}
            <div className="email-verified__cta">
              <h2>Ready to connect with couples?</h2>
              <p>
                Complete your profile in just a few minutes. Add your credentials,
                specialties, and start receiving inquiries from engaged couples.
              </p>
              <Link to="/professional/create" className="email-verified__btn email-verified__btn--primary">
                <i className="fa fa-user-plus" aria-hidden="true"></i>
                Create Your Profile
              </Link>
            </div>

            {/* Benefits Preview */}
            <div className="email-verified__benefits">
              <div className="email-verified__benefit">
                <i className="fa fa-search" aria-hidden="true"></i>
                <span>Get found by engaged couples in your area</span>
              </div>
              <div className="email-verified__benefit">
                <i className="fa fa-envelope" aria-hidden="true"></i>
                <span>Receive direct inquiries — no middleman</span>
              </div>
              <div className="email-verified__benefit">
                <i className="fa fa-chart-line" aria-hidden="true"></i>
                <span>Track profile views and engagement</span>
              </div>
            </div>
          </div>

          {/* Already have profile? */}
          {user && (
            <p className="email-verified__alt-link">
              Already listed in the directory?{' '}
              <Link to="/claim-profile">Claim your existing profile</Link>
            </p>
          )}
        </div>
      </div>
    </>
  )
}

export default EmailVerifiedPage
