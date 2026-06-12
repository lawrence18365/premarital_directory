import React from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import SEOHelmet from '../../components/analytics/SEOHelmet'
import {
  CONTACT_EMAIL,
  DIRECTORY_PLAN_DETAILS,
  FOUNDING_PACKAGES,
  FOUNDING_PAGE_PATH,
  UPGRADE_OFFER,
  buildFoundingInquiryPath
} from '../../lib/providerOffers'
import UpgradeCTA from '../../components/monetization/UpgradeCTA'

const SubscriptionPage = () => {
  const { user, profile, loading: authLoading } = useAuth()

  if (authLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  if (user && !profile) {
    return <Navigate to="/professional/onboarding" replace />
  }

  const currentTier = profile?.tier || 'community'
  const currentPlan = DIRECTORY_PLAN_DETAILS[currentTier] || DIRECTORY_PLAN_DETAILS.community
  const hasManagedUpgrade = currentTier !== 'community'
  const userEmail = profile?.email || user?.email
  const manualPackages = UPGRADE_OFFER.checkoutUrl
    ? FOUNDING_PACKAGES.filter((pkg) => pkg.id !== 'founding-listing')
    : FOUNDING_PACKAGES

  return (
    <>
      <SEOHelmet
        title="Subscription Management"
        description="Manage your Wedding Counselors listing and visibility options."
        noindex={true}
      />

      <div className="subscription-container">
        <div className="subscription-header">
          <div className="dashboard-title">
            <h1>Visibility & Billing</h1>
            <p>See your current listing status and the paid options that are actually live.</p>
          </div>
          <div className="dashboard-actions">
            <Link to="/professional/dashboard" className="btn btn-outline">
              <i className="fa fa-arrow-left" aria-hidden="true"></i>
              Back to Dashboard
            </Link>
          </div>
        </div>

        <div className="dashboard-section">
          <h2>Your Current Plan</h2>
          <div style={{
            background: 'linear-gradient(135deg, var(--teal) 0%, var(--teal-dark, #0e5e5e) 100%)',
            padding: 'var(--space-6)',
            borderRadius: 'var(--radius-lg)',
            color: 'white',
            marginBottom: 'var(--space-6)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 'var(--space-4)'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <h3 style={{ color: 'white', margin: 0, fontSize: '1.75rem' }}>
                    {currentPlan.name}
                  </h3>
                  <span style={{
                    background: 'rgba(255,255,255,0.2)',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: '600'
                  }}>
                    {currentPlan.price}
                  </span>
                </div>
                <p style={{ opacity: 0.9, marginTop: 'var(--space-2)', marginBottom: 0 }}>
                  {currentPlan.description}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ opacity: 0.8, fontSize: '0.9rem' }}>
                  Member since
                </div>
                <div style={{ fontWeight: '600' }}>
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric'
                      })
                    : 'N/A'
                  }
                </div>
              </div>
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: 'var(--space-6)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--gray-200)'
          }}>
            <h4 style={{ marginBottom: 'var(--space-4)', color: 'var(--text-primary)' }}>
              Included with your current plan
            </h4>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'grid',
              gap: 'var(--space-3)'
            }}>
              {currentPlan.features.map((feature, index) => (
                <li key={index} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--space-3)'
                }}>
                  <i
                    className="fa fa-check-circle"
                    style={{ color: 'var(--success, #0e5e5e)', marginTop: '2px' }}
                    aria-hidden="true"
                  ></i>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <UpgradeCTA
          profile={profile}
          surface="subscription_page"
          variant="compact"
        />

        <div className="dashboard-section" style={{ marginTop: 'var(--space-8)' }}>
          <h2>Paid Options That Are Live</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)', maxWidth: '780px' }}>
            {UPGRADE_OFFER.checkoutUrl
              ? `The active self-serve offer is ${UPGRADE_OFFER.label} at ${UPGRADE_OFFER.price} ${UPGRADE_OFFER.billingNote}. Larger placements are reviewed manually so city and specialty inventory stays limited.`
              : 'Self-serve checkout is not active yet. If you want better placement or help tightening your profile, use a one-time founder package and we will activate it manually.'}
          </p>

          {manualPackages.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 'var(--space-6)'
            }}>
              {manualPackages.map((pkg) => (
              <div key={pkg.id} style={{
                background: 'white',
                borderRadius: 'var(--radius-lg)',
                border: pkg.highlight ? '2px solid var(--teal)' : '1px solid var(--gray-200)',
                boxShadow: pkg.highlight ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
                padding: 'var(--space-6)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
              }}>
                {pkg.highlight && (
                  <div style={{
                    position: 'absolute',
                    top: '-12px',
                    left: 'var(--space-6)',
                    background: 'var(--teal)',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    textTransform: 'uppercase'
                  }}>
                    Best First Paid Offer
                  </div>
                )}
                <h3 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
                  {pkg.name}
                </h3>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: 'var(--teal)',
                  marginBottom: 'var(--space-2)'
                }}>
                  {pkg.price}
                  <span style={{ fontSize: '1rem', fontWeight: '400', color: 'var(--text-secondary)' }}>
                    {' '}{pkg.priceSuffix}
                  </span>
                </div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
                  {pkg.summary}
                </p>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '0 0 var(--space-5) 0',
                  display: 'grid',
                  gap: 'var(--space-2)',
                  fontSize: '0.95rem',
                  flex: 1
                }}>
                  {pkg.features.map((feature) => (
                    <li key={feature} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
                      <i className="fa fa-check" style={{ color: 'var(--teal)', marginTop: '4px' }} aria-hidden="true"></i>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={buildFoundingInquiryPath(pkg)}
                  className="btn btn-primary"
                  style={{ width: '100%', textAlign: 'center' }}
                >
                  {pkg.cta}
                </Link>
              </div>
              ))}
            </div>
          )}
        </div>

        <div style={{
          marginTop: 'var(--space-12)',
          padding: 'var(--space-8)',
          background: 'linear-gradient(135deg, #0e5e5e 0%, #1a7373 100%)',
          borderRadius: 'var(--radius-lg)',
          color: 'white'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--space-5)'
          }}>
            <div style={{ maxWidth: '640px' }}>
              <h3 style={{ color: 'white', marginBottom: 'var(--space-3)' }}>
                {hasManagedUpgrade ? 'Need changes to your current placement?' : 'Need help choosing the right founder package?'}
              </h3>
              <p style={{ opacity: 0.9, marginBottom: 0 }}>
                {hasManagedUpgrade
                  ? 'Managed upgrades are handled directly by the team right now. Tell us what you want to change and we will review it manually.'
                  : `If you reply from ${userEmail || 'your professional email'}, we can recommend the right city or specialty package for your profile.`}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <Link to={FOUNDING_PAGE_PATH} className="btn btn-outline" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.8)' }}>
                View Founder Offer
              </Link>
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(hasManagedUpgrade ? 'Placement update request' : 'Founder package recommendation')}`}
                className="btn btn-primary"
              >
                Email Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default SubscriptionPage
