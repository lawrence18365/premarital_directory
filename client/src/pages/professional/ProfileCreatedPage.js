import React, { useState } from 'react'
import { useLocation, Navigate } from 'react-router-dom'
import SEOHelmet from '../../components/analytics/SEOHelmet'

const ProfileCreatedPage = () => {
  const location = useLocation()
  const { profileUrl, photoUploadError } = location.state || {}
  const [copiedBadge, setCopiedBadge] = useState(false)

  // Redirect if accessed directly without profile data
  if (!profileUrl) {
    return <Navigate to="/professional/create" replace />
  }

  const fullProfileUrl = `https://www.weddingcounselors.com${profileUrl}`

  const badgeSnippet = `<a href="https://www.weddingcounselors.com" target="_blank" rel="noopener">
  <img src="https://www.weddingcounselors.com/badges/featured-premarital-directory.svg"
       alt="Featured on WeddingCounselors.com"
       style="width: 200px; height: auto;">
</a>`

  const handleCopyBadge = () => {
    navigator.clipboard.writeText(badgeSnippet).then(() => {
      setCopiedBadge(true)
      setTimeout(() => setCopiedBadge(false), 3000)
    })
  }

  return (
    <div className="container" style={{ padding: 'var(--space-20) 0' }}>
      <SEOHelmet
        title="Profile Created Successfully"
        description="Your professional profile is now live on Wedding Counselors directory."
        url="/professional/profile-created"
      />

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {photoUploadError && (
          <div style={{
            background: 'linear-gradient(135deg, #fff3cd 0%, #ffe8a1 100%)',
            padding: 'var(--space-6)',
            borderRadius: 'var(--radius-xl)',
            marginBottom: 'var(--space-6)',
            border: '1px solid #ffecb5',
            color: '#856404'
          }}>
            <strong>Photo upload notice:</strong> {photoUploadError} You can add it from your profile editor.
          </div>
        )}

        {/* Success Header */}
        <div style={{
          textAlign: 'center',
          background: 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)',
          padding: 'var(--space-12)',
          borderRadius: 'var(--radius-2xl)',
          marginBottom: 'var(--space-10)',
          border: '2px solid #28a745'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>
            <i className="fa fa-check-circle" style={{ color: '#28a745' }} aria-hidden="true"></i>
          </div>
          <h1 style={{ color: '#155724', marginBottom: 'var(--space-4)' }}>
            Your Profile is Live!
          </h1>
          <p style={{ fontSize: 'var(--text-xl)', color: '#155724', marginBottom: 'var(--space-6)' }}>
            Congratulations! Couples can now find you in the directory.
          </p>
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-large"
            style={{ marginRight: 'var(--space-4)' }}
          >
            <i className="fa fa-external-link" aria-hidden="true"></i> View Your Profile
          </a>
          <a
            href="/professional/profile/edit"
            className="btn btn-outline btn-large"
          >
            <i className="fa fa-edit" aria-hidden="true"></i> Edit Profile
          </a>
        </div>

        {/* Profile Link */}
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
            color: 'var(--primary)'
          }}>
            {fullProfileUrl}
          </div>
          <p className="text-small text-muted mt-2">
            Share this link with clients or add it to your website.
          </p>
        </div>

        {/* Next Steps Checklist */}
        <div style={{
          background: 'var(--white)',
          padding: 'var(--space-8)',
          borderRadius: 'var(--radius-xl)',
          marginBottom: 'var(--space-8)',
          border: '1px solid var(--gray-200)',
          boxShadow: 'var(--shadow-md)'
        }}>
          <h2 style={{ marginBottom: 'var(--space-6)', color: 'var(--primary)' }}>
            Make Your Profile Stand Out
          </h2>
          <p className="text-secondary mb-6">
            Complete these steps to attract more couples:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <ChecklistItem
              icon="fa-camera"
              title="Add a professional photo"
              description="Profiles with photos get 3x more views"
              link="/professional/profile/edit"
              linkText="Upload Photo"
            />
            <ChecklistItem
              icon="fa-file-text"
              title="Write your bio"
              description="Tell couples about your approach and experience"
              link="/professional/profile/edit"
              linkText="Add Bio"
            />
            <ChecklistItem
              icon="fa-dollar"
              title="Add pricing information"
              description="Help couples know what to expect"
              link="/professional/profile/edit"
              linkText="Set Pricing"
            />
            <ChecklistItem
              icon="fa-calendar"
              title="Add booking link"
              description="Make it easy for couples to schedule with you"
              link="/professional/profile/edit"
              linkText="Add Link"
            />
            <ChecklistItem
              icon="fa-star"
              title="List your specialties"
              description="Help couples find the right fit"
              link="/professional/profile/edit"
              linkText="Add Specialties"
            />
          </div>

          <div style={{ marginTop: 'var(--space-8)', textAlign: 'center' }}>
            <a href="/professional/profile/edit" className="btn btn-primary">
              Complete Your Profile
            </a>
          </div>
        </div>

        {/* Badge Section */}
        <div style={{
          background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)',
          padding: 'var(--space-8)',
          borderRadius: 'var(--radius-xl)',
          marginBottom: 'var(--space-8)',
          border: '2px solid #ffc107'
        }}>
          <h2 style={{ marginBottom: 'var(--space-4)', color: '#856404' }}>
            <i className="fa fa-trophy" aria-hidden="true"></i> Add a Badge to Your Website
          </h2>
          <p style={{ color: '#856404', marginBottom: 'var(--space-6)' }}>
            Show visitors you're a verified premarital counselor. Add this badge to your website to build credibility and get backlinks.
          </p>

          <div style={{
            background: 'var(--white)',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 'var(--space-4)',
            textAlign: 'center'
          }}>
            <p className="text-small text-muted mb-2">Preview:</p>
            <div style={{
              background: 'var(--gray-100)',
              padding: 'var(--space-6)',
              borderRadius: 'var(--radius-md)',
              display: 'inline-block'
            }}>
              <img
                src="/badges/featured-premarital-directory.svg"
                alt="Featured on WeddingCounselors.com"
                style={{ width: '200px', height: 'auto' }}
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.parentElement.innerHTML = '<div style="padding: 20px; border: 2px dashed #ccc; border-radius: 8px;"><strong>Featured on WeddingCounselors.com</strong><br/><small>Badge image will appear here</small></div>'
                }}
              />
            </div>
          </div>

          <div style={{
            background: 'var(--gray-800)',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-4)',
            position: 'relative'
          }}>
            <pre style={{
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              color: '#a3e635',
              fontSize: 'var(--text-xs)',
              fontFamily: 'monospace'
            }}>
              {badgeSnippet}
            </pre>
            <button
              onClick={handleCopyBadge}
              style={{
                position: 'absolute',
                top: 'var(--space-2)',
                right: 'var(--space-2)',
                background: copiedBadge ? '#28a745' : 'var(--white)',
                color: copiedBadge ? 'var(--white)' : 'var(--gray-800)',
                border: 'none',
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--font-weight-semibold)'
              }}
            >
              {copiedBadge ? 'Copied!' : 'Copy Code'}
            </button>
          </div>

          <p className="text-small" style={{ color: '#856404' }}>
            Paste this HTML code into your website's footer or sidebar.
          </p>
        </div>

        {/* Quick Links */}
        <div style={{
          background: 'var(--gray-50)',
          padding: 'var(--space-6)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--gray-200)'
        }}>
          <h3 style={{ marginBottom: 'var(--space-4)' }}>Quick Links</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-4)'
          }}>
            <QuickLink
              href="/professional/dashboard"
              icon="fa-dashboard"
              title="Dashboard"
              description="View your profile stats"
            />
            <QuickLink
              href="/professional/leads"
              icon="fa-users"
              title="Leads"
              description="See couple inquiries"
            />
            <QuickLink
              href="/professional/subscription"
              icon="fa-star"
              title="Upgrade"
              description="Get featured placement"
            />
            <QuickLink
              href="/support"
              icon="fa-question-circle"
              title="Support"
              description="Get help & resources"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

const ChecklistItem = ({ icon, title, description, link, linkText }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    padding: 'var(--space-4)',
    background: 'var(--gray-50)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--gray-200)'
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      borderRadius: 'var(--radius-full)',
      background: 'var(--primary-light)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 'var(--space-4)',
      flexShrink: 0
    }}>
      <i className={`fa ${icon}`} style={{ color: 'var(--primary)' }} aria-hidden="true"></i>
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-1)' }}>
        {title}
      </div>
      <div className="text-small text-muted">{description}</div>
    </div>
    <a
      href={link}
      className="btn btn-outline btn-small"
      style={{ flexShrink: 0 }}
    >
      {linkText}
    </a>
  </div>
)

const QuickLink = ({ href, icon, title, description }) => (
  <a
    href={href}
    style={{
      display: 'block',
      padding: 'var(--space-4)',
      background: 'var(--white)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--gray-200)',
      textDecoration: 'none',
      color: 'inherit',
      transition: 'all var(--transition-normal)'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = 'var(--primary)'
      e.currentTarget.style.boxShadow = 'var(--shadow-md)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = 'var(--gray-200)'
      e.currentTarget.style.boxShadow = 'none'
    }}
  >
    <div style={{
      display: 'flex',
      alignItems: 'center',
      marginBottom: 'var(--space-2)'
    }}>
      <i className={`fa ${icon}`} style={{ color: 'var(--primary)', marginRight: 'var(--space-2)' }} aria-hidden="true"></i>
      <strong>{title}</strong>
    </div>
    <div className="text-small text-muted">{description}</div>
  </a>
)

export default ProfileCreatedPage
