import React, { useState } from 'react'
import { useLocation, Navigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import SEOHelmet from '../../components/analytics/SEOHelmet'
import './profile-created.css'

const CopyButton = ({ text, label, className, icon = 'fa-copy' }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  return (
    <button onClick={handleCopy} className={className}>
      <i className={`fa ${copied ? 'fa-check' : icon}`} aria-hidden="true"></i>
      {copied ? 'Copied!' : label}
    </button>
  )
}

const ProfileCreatedPage = () => {
  const location = useLocation()
  const { profileUrl } = location.state || {}
  const { profile } = useAuth()

  if (!profileUrl) {
    return <Navigate to="/professional/dashboard" replace />
  }

  const fullProfileUrl = `https://www.weddingcounselors.com${profileUrl}`
  const referralUrl = `https://www.weddingcounselors.com/professional/signup?ref=${profile?.referral_code || profile?.slug || 'friend'}&utm_source=referral&utm_medium=colleague`

  return (
    <div className="pc-page">
      <SEOHelmet
        title="Profile Created Successfully"
        description="Your professional profile is now live on the directory."
        url="/professional/profile-created"
        noindex={true}
      />

      <div className="pc-shell">
        <div className="pc-hero">
          <div className="pc-hero__icon">
            <i className="fa fa-check-circle" aria-hidden="true"></i>
          </div>
          <h1 className="pc-hero__title">You're All Set!</h1>
          <p className="pc-hero__subtitle">
            Your profile is now live. Couples in your area can find you in the directory.
          </p>
        </div>

        <div className="pc-url-card">
          <h3 className="pc-url-card__heading">Your Profile URL</h3>
          <div className="pc-url-card__url">{fullProfileUrl}</div>
          <CopyButton
            text={fullProfileUrl}
            label="Copy Link"
            className="pc-btn pc-btn--outline"
          />
        </div>

        <div className="pc-actions">
          <Link to={profileUrl} className="pc-btn pc-btn--primary pc-btn--large">
            <i className="fa fa-eye" aria-hidden="true"></i> View Your Profile
          </Link>
          <Link to="/professional/dashboard" className="pc-btn pc-btn--outline pc-btn--large">
            <i className="fa fa-dashboard" aria-hidden="true"></i> Go to Dashboard
          </Link>
        </div>

        <div className="pc-referral">
          <h3 className="pc-referral__heading">
            <i className="fa fa-users" aria-hidden="true"></i>
            Know a Colleague Who Should Be Listed?
          </h3>
          <p className="pc-referral__text">
            Share this link with fellow counselors. When they sign up, you both get higher visibility.
          </p>
          <CopyButton
            text={referralUrl}
            label="Copy Invite Link"
            className="pc-btn pc-btn--primary"
            icon="fa-link"
          />
        </div>

        <div className="pc-next-steps">
          <h3 className="pc-next-steps__heading">What Happens Next?</h3>
          <ul className="pc-next-steps__list">
            <li>
              <i className="fa fa-search" aria-hidden="true"></i>
              <span>Couples searching in your city will see your profile</span>
            </li>
            <li>
              <i className="fa fa-envelope" aria-hidden="true"></i>
              <span>You'll receive email notifications when couples reach out</span>
            </li>
            <li>
              <i className="fa fa-line-chart" aria-hidden="true"></i>
              <span>Track your profile views in the dashboard</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default ProfileCreatedPage
