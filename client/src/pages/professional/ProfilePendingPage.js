import React from 'react'
import { useLocation, Navigate, Link } from 'react-router-dom'
import SEOHelmet from '../../components/analytics/SEOHelmet'

const ProfilePendingPage = () => {
  const location = useLocation()
  const { profileName, profileEmail } = location.state || {}

  // Redirect if accessed directly without profile data
  if (!profileName) {
    return <Navigate to="/professional/dashboard" replace />
  }

  return (
    <div className="container" style={{ padding: 'var(--space-20) 0' }}>
      <SEOHelmet
        title="Profile Submitted - Awaiting Review"
        description="Your professional profile has been submitted and is awaiting review."
        url="/professional/profile-pending"
        noIndex={true}
      />

      <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        {/* Pending Header */}
        <div style={{
          background: 'linear-gradient(135deg, #fff3cd 0%, #ffeeba 100%)',
          padding: 'var(--space-12)',
          borderRadius: 'var(--radius-2xl)',
          marginBottom: 'var(--space-8)',
          border: '2px solid #ffc107'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>
            <i className="fa fa-clock-o" style={{ color: '#856404' }} aria-hidden="true"></i>
          </div>
          <h1 style={{ color: '#856404', marginBottom: 'var(--space-4)' }}>
            Profile Submitted!
          </h1>
          <p style={{ fontSize: 'var(--text-lg)', color: '#856404', marginBottom: 'var(--space-2)' }}>
            Thanks, {profileName.split(' ')[0]}! Your profile is now being reviewed.
          </p>
          <p style={{ fontSize: 'var(--text-md)', color: '#856404' }}>
            We review all new profiles to ensure quality for couples searching our directory.
          </p>
        </div>

        {/* What Happens Next */}
        <div style={{
          background: 'var(--white)',
          padding: 'var(--space-6)',
          borderRadius: 'var(--radius-xl)',
          marginBottom: 'var(--space-8)',
          border: '1px solid var(--gray-200)',
          boxShadow: 'var(--shadow-md)',
          textAlign: 'left'
        }}>
          <h3 style={{ marginBottom: 'var(--space-4)', textAlign: 'center' }}>What Happens Next?</h3>
          <ol style={{
            padding: '0 0 0 var(--space-6)',
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)'
          }}>
            <li style={{ paddingLeft: 'var(--space-2)' }}>
              <strong>We review your profile</strong>
              <p style={{ margin: 'var(--space-1) 0 0', color: 'var(--slate)', fontSize: 'var(--text-sm)' }}>
                Our team will review your submission within 24-48 hours.
              </p>
            </li>
            <li style={{ paddingLeft: 'var(--space-2)' }}>
              <strong>You'll get an email</strong>
              <p style={{ margin: 'var(--space-1) 0 0', color: 'var(--slate)', fontSize: 'var(--text-sm)' }}>
                We'll notify you at <strong>{profileEmail}</strong> once your profile is approved.
              </p>
            </li>
            <li style={{ paddingLeft: 'var(--space-2)' }}>
              <strong>Your profile goes live</strong>
              <p style={{ margin: 'var(--space-1) 0 0', color: 'var(--slate)', fontSize: 'var(--text-sm)' }}>
                Once approved, couples in your area can find you in the directory.
              </p>
            </li>
          </ol>
        </div>

        {/* Status Box */}
        <div style={{
          background: 'var(--gray-50)',
          padding: 'var(--space-4)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 'var(--space-8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-3)'
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: '#ffc107',
            animation: 'pulse 2s infinite'
          }}></div>
          <span style={{ fontWeight: '600', color: 'var(--slate)' }}>
            Status: Pending Review
          </span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Link
            to="/professional/dashboard"
            className="btn btn-primary btn-large"
            style={{ width: '100%' }}
          >
            <i className="fa fa-dashboard" aria-hidden="true"></i> Go to Dashboard
          </Link>
          <Link
            to="/"
            className="btn btn-outline btn-large"
            style={{ width: '100%' }}
          >
            <i className="fa fa-home" aria-hidden="true"></i> Back to Home
          </Link>
        </div>

        {/* Questions */}
        <p style={{ marginTop: 'var(--space-8)', color: 'var(--slate)', fontSize: 'var(--text-sm)' }}>
          Questions? Contact us at <a href="mailto:support@weddingcounselors.com">support@weddingcounselors.com</a>
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

export default ProfilePendingPage
