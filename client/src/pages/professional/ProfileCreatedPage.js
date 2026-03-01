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
        noindex={true}
      />

      <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        {/* Success Header */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(14, 94, 94, 0.12) 0%, rgba(14, 94, 94, 0.08) 100%)',
          padding: 'var(--space-12)',
          borderRadius: 'var(--radius-2xl)',
          marginBottom: 'var(--space-8)',
          border: '2px solid var(--ds-border-strong)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>
            <i className="fa fa-check-circle" style={{ color: 'var(--ds-accent)' }} aria-hidden="true"></i>
          </div>
          <h1 style={{ color: 'var(--ds-ink)', marginBottom: 'var(--space-4)' }}>
            You're All Set!
          </h1>
          <p style={{ fontSize: 'var(--text-lg)', color: 'var(--ds-ink-muted)', marginBottom: 'var(--space-6)' }}>
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

        {/* Referral CTA */}
        <div style={{
          marginTop: 'var(--space-8)',
          padding: 'var(--space-6)',
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
          border: '1px solid #86efac',
          borderRadius: 'var(--radius-xl)',
          textAlign: 'center'
        }}>
          <h3 style={{ marginBottom: 'var(--space-2)', color: '#166534' }}>
            <i className="fa fa-users" aria-hidden="true" style={{ marginRight: '8px' }}></i>
            Know a Colleague Who Should Be Listed?
          </h3>
          <p style={{ fontSize: '0.9rem', color: '#15803d', marginBottom: 'var(--space-4)' }}>
            Share this link with fellow counselors. When they sign up, you both get higher visibility.
          </p>
          <button
            onClick={() => {
              const url = `https://www.weddingcounselors.com/professional/signup?ref=new&utm_source=referral&utm_medium=colleague`
              navigator.clipboard.writeText(url).catch(() => {})
            }}
            className="btn btn-primary"
            style={{ fontSize: '0.9rem' }}
          >
            <i className="fa fa-link" aria-hidden="true" style={{ marginRight: '6px' }}></i>
            Copy Invite Link
          </button>
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
