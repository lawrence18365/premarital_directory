import React from 'react'
import { useLocation, Navigate, Link } from 'react-router-dom'
import SEOHelmet from '../../components/analytics/SEOHelmet'

const ProfileCreatedPage = () => {
  const location = useLocation()
  const { profileUrl } = location.state || {}

  // Redirect if accessed directly without profile data
  if (!profileUrl) {
    return <Navigate to="/professional/dashboard" replace />
  }

  const fullProfileUrl = `https://www.weddingcounselors.com${profileUrl}`

  return (
    <div className="container" style={{ padding: 'var(--space-20) 0' }}>
      <SEOHelmet
        title="Profile Created Successfully"
        description="Your professional profile is now live on Wedding Counselors directory."
        url="/professional/profile-created"
        noIndex={true}
      />

      <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        {/* Success Header */}
        <div style={{
          background: 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)',
          padding: 'var(--space-12)',
          borderRadius: 'var(--radius-2xl)',
          marginBottom: 'var(--space-8)',
          border: '2px solid #28a745'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>
            <i className="fa fa-check-circle" style={{ color: '#28a745' }} aria-hidden="true"></i>
          </div>
          <h1 style={{ color: '#155724', marginBottom: 'var(--space-4)' }}>
            You're All Set!
          </h1>
          <p style={{ fontSize: 'var(--text-lg)', color: '#155724', marginBottom: 'var(--space-6)' }}>
            Your profile is now live. Couples in your area can find you in the directory.
          </p>
        </div>

        {/* Profile URL */}
        <div style={{
          background: 'var(--white)',
          padding: 'var(--space-6)',
          borderRadius: 'var(--radius-xl)',
          marginBottom: 'var(--space-8)',
          border: '1px solid var(--gray-200)',
          boxShadow: 'var(--shadow-md)'
        }}>
          <h3 style={{ marginBottom: 'var(--space-3)' }}>Your Profile URL</h3>
          <div style={{
            background: 'var(--gray-50)',
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'monospace',
            fontSize: 'var(--text-sm)',
            wordBreak: 'break-all',
            color: 'var(--primary)',
            marginBottom: 'var(--space-4)'
          }}>
            {fullProfileUrl}
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(fullProfileUrl)}
            className="btn btn-outline btn-small"
          >
            <i className="fa fa-copy" aria-hidden="true"></i> Copy Link
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Link
            to={profileUrl}
            className="btn btn-primary btn-large"
            style={{ width: '100%' }}
          >
            <i className="fa fa-eye" aria-hidden="true"></i> View Your Profile
          </Link>
          <Link
            to="/professional/dashboard"
            className="btn btn-outline btn-large"
            style={{ width: '100%' }}
          >
            <i className="fa fa-dashboard" aria-hidden="true"></i> Go to Dashboard
          </Link>
        </div>

        {/* What's Next */}
        <div style={{
          marginTop: 'var(--space-10)',
          padding: 'var(--space-6)',
          background: 'var(--gray-50)',
          borderRadius: 'var(--radius-xl)',
          textAlign: 'left'
        }}>
          <h3 style={{ marginBottom: 'var(--space-4)', textAlign: 'center' }}>What Happens Next?</h3>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)'
          }}>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
              <i className="fa fa-search" style={{ color: 'var(--primary)', marginTop: '4px' }} aria-hidden="true"></i>
              <span>Couples searching in your city will see your profile</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
              <i className="fa fa-envelope" style={{ color: 'var(--primary)', marginTop: '4px' }} aria-hidden="true"></i>
              <span>You'll receive email notifications when couples reach out</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
              <i className="fa fa-line-chart" style={{ color: 'var(--primary)', marginTop: '4px' }} aria-hidden="true"></i>
              <span>Track your profile views in the dashboard</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default ProfileCreatedPage
