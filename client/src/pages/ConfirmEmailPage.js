import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import SEOHelmet from '../components/analytics/SEOHelmet'
import '../assets/css/confirm-email.css'

const ConfirmEmailPage = () => {
  const location = useLocation()
  const emailFromState = location.state?.email || ''

  const [resendEmail, setResendEmail] = useState(emailFromState)
  const [resendStatus, setResendStatus] = useState(null) // 'sending', 'success', 'error'
  const [resendMessage, setResendMessage] = useState('')
  const [showResendForm, setShowResendForm] = useState(!emailFromState)

  const handleResend = async (e) => {
    e.preventDefault()

    if (!resendEmail.trim()) {
      setResendStatus('error')
      setResendMessage('Please enter your email address')
      return
    }

    setResendStatus('sending')
    setResendMessage('')

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: resendEmail.trim()
      })

      if (error) {
        setResendStatus('error')
        setResendMessage(error.message)
      } else {
        setResendStatus('success')
        setResendMessage('Confirmation email sent! Check your inbox.')
      }
    } catch (err) {
      setResendStatus('error')
      setResendMessage('Failed to resend. Please try again.')
    }
  }

  return (
    <>
      <SEOHelmet
        title="Check Your Email - Wedding Counselors"
        description="Complete your professional account setup by confirming your email"
        noIndex={true}
      />

      <div className="confirm-email">
        <div className="confirm-email__container">
          {/* Main Card */}
          <div className="confirm-email__card">
            {/* Header with Icon */}
            <div className="confirm-email__header">
              <div className="confirm-email__icon-wrapper">
                <div className="confirm-email__icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 8L10.89 13.26C11.2187 13.4793 11.6049 13.5963 12 13.5963C12.3951 13.5963 12.7813 13.4793 13.11 13.26L21 8M5 19H19C19.5304 19 20.0391 18.7893 20.4142 18.4142C20.7893 18.0391 21 17.5304 21 17V7C21 6.46957 20.7893 5.96086 20.4142 5.58579C20.0391 5.21071 19.5304 5 19 5H5C4.46957 5 3.96086 5.21071 3.58579 5.58579C3.21071 5.96086 3 6.46957 3 7V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="confirm-email__icon-ring"></div>
              </div>

              <h1 className="confirm-email__title">Check Your Email</h1>
              <p className="confirm-email__subtitle">
                {emailFromState ? (
                  <>We've sent a confirmation link to <strong>{emailFromState}</strong></>
                ) : (
                  <>We've sent a confirmation link to complete your account setup</>
                )}
              </p>
            </div>

            {/* Steps */}
            <div className="confirm-email__steps">
              <div className="confirm-email__step">
                <div className="confirm-email__step-number">1</div>
                <div className="confirm-email__step-content">
                  <h3>Open Your Inbox</h3>
                  <p>Look for an email from <strong>Wedding Counselors</strong></p>
                </div>
                <div className="confirm-email__step-icon">
                  <i className="fa fa-inbox" aria-hidden="true"></i>
                </div>
              </div>

              <div className="confirm-email__step">
                <div className="confirm-email__step-number">2</div>
                <div className="confirm-email__step-content">
                  <h3>Click to Activate</h3>
                  <p>Click the confirmation link to verify your email</p>
                </div>
                <div className="confirm-email__step-icon">
                  <i className="fa fa-mouse-pointer" aria-hidden="true"></i>
                </div>
              </div>

              <div className="confirm-email__step">
                <div className="confirm-email__step-number">3</div>
                <div className="confirm-email__step-content">
                  <h3>Complete Your Profile</h3>
                  <p>Add your credentials and submit for review</p>
                </div>
                <div className="confirm-email__step-icon">
                  <i className="fa fa-heart" aria-hidden="true"></i>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="confirm-email__actions">
              <Link to="/professional/login" className="confirm-email__btn confirm-email__btn--primary">
                <i className="fa fa-sign-in" aria-hidden="true"></i>
                I've Confirmed — Sign In
              </Link>
            </div>
          </div>

          {/* Help Card with Resend */}
          <div className="confirm-email__help">
            <div className="confirm-email__help-icon">
              <i className="fa fa-question-circle" aria-hidden="true"></i>
            </div>
            <div className="confirm-email__help-content">
              <h3>Don't see the email?</h3>
              <ul>
                <li>
                  <i className="fa fa-folder" aria-hidden="true"></i>
                  Check your spam or junk folder
                </li>
                <li>
                  <i className="fa fa-clock" aria-hidden="true"></i>
                  The email may take a few minutes to arrive
                </li>
              </ul>

              {/* Resend Section */}
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                {!showResendForm && emailFromState ? (
                  <button
                    onClick={() => handleResend({ preventDefault: () => {} })}
                    disabled={resendStatus === 'sending'}
                    style={{
                      background: 'none',
                      border: '1px solid var(--primary)',
                      color: 'var(--primary)',
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      cursor: resendStatus === 'sending' ? 'not-allowed' : 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      width: '100%'
                    }}
                  >
                    {resendStatus === 'sending' ? 'Sending...' : 'Resend Confirmation Email'}
                  </button>
                ) : (
                  <form onSubmit={handleResend}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                      Resend to:
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="email"
                        value={resendEmail}
                        onChange={(e) => setResendEmail(e.target.value)}
                        placeholder="your@email.com"
                        style={{
                          flex: 1,
                          padding: '0.5rem 0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '0.9rem'
                        }}
                      />
                      <button
                        type="submit"
                        disabled={resendStatus === 'sending'}
                        style={{
                          background: 'var(--primary)',
                          color: 'white',
                          border: 'none',
                          padding: '0.5rem 1rem',
                          borderRadius: '6px',
                          cursor: resendStatus === 'sending' ? 'not-allowed' : 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: '500'
                        }}
                      >
                        {resendStatus === 'sending' ? '...' : 'Send'}
                      </button>
                    </div>
                  </form>
                )}

                {resendStatus === 'success' && (
                  <p style={{ color: '#059669', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    <i className="fa fa-check-circle" aria-hidden="true"></i> {resendMessage}
                  </p>
                )}
                {resendStatus === 'error' && (
                  <p style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    <i className="fa fa-exclamation-circle" aria-hidden="true"></i> {resendMessage}
                  </p>
                )}

                {emailFromState && !showResendForm && (
                  <button
                    onClick={() => setShowResendForm(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--slate)',
                      fontSize: '0.8rem',
                      marginTop: '0.5rem',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Wrong email? Enter a different one
                  </button>
                )}
              </div>

              <div style={{ marginTop: '1rem' }}>
                <Link to="/professional/signup" className="confirm-email__help-link">
                  Start over with a different email
                  <i className="fa fa-arrow-right" aria-hidden="true"></i>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ConfirmEmailPage
