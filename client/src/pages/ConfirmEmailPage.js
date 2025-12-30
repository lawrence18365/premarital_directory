import React from 'react'
import { Link } from 'react-router-dom'
import SEOHelmet from '../components/analytics/SEOHelmet'
import '../assets/css/confirm-email.css'

const ConfirmEmailPage = () => {
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
                We've sent a confirmation link to complete your account setup
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
                  <p>Add your credentials and start connecting with couples</p>
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

          {/* Help Card */}
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
                  <i className="fa fa-at" aria-hidden="true"></i>
                  Make sure you entered your email correctly
                </li>
                <li>
                  <i className="fa fa-clock" aria-hidden="true"></i>
                  The email may take a few minutes to arrive
                </li>
              </ul>
              <Link to="/support" className="confirm-email__help-link">
                Still need help? Contact support
                <i className="fa fa-arrow-right" aria-hidden="true"></i>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ConfirmEmailPage
