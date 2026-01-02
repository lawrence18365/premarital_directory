import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, Navigate } from 'react-router-dom';
import SEOHelmet from '../../components/analytics/SEOHelmet';

/**
 * Professional Subscription Management Page
 * Shows current plan, what's included, and upgrade options (coming soon)
 */
const SubscriptionPage = () => {
  const { user, profile, loading: authLoading } = useAuth();

  // Current plan features based on tier
  const getPlanDetails = (tier) => {
    const plans = {
      community: {
        name: 'Community',
        price: 'Free',
        description: 'Everything you need to get started and connect with couples.',
        features: [
          'Listed in the directory',
          'Basic profile with bio and contact info',
          'Receive leads from couples',
          'View profile analytics',
          'Email notifications for new inquiries'
        ],
        limitations: [
          'Standard placement in search results',
          'Basic analytics only'
        ]
      },
      featured: {
        name: 'Featured',
        price: '$29/month',
        description: 'Stand out and get more visibility with premium placement.',
        features: [
          'Everything in Community, plus:',
          'Priority placement in city search results',
          'Featured badge on your profile',
          'Enhanced profile with photos and video',
          'Advanced analytics and insights',
          'Priority email support'
        ],
        limitations: []
      },
      premium: {
        name: 'Premium',
        price: '$79/month',
        description: 'Maximum visibility and exclusive features for top professionals.',
        features: [
          'Everything in Featured, plus:',
          'Top placement in all searches',
          'Highlighted profile card design',
          'Lead priority notifications',
          'Dedicated account manager',
          'Custom profile URL',
          'Monthly performance reports'
        ],
        limitations: []
      }
    };

    return plans[tier] || plans.community;
  };

  // Wait for auth to load
  if (authLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Redirect users without profiles to create profile
  if (user && !profile) {
    return <Navigate to="/professional/create" replace />;
  }

  const currentTier = profile?.tier || 'community';
  const currentPlan = getPlanDetails(currentTier);
  const userEmail = profile?.email || user?.email;

  return (
    <>
      <SEOHelmet
        title="Subscription Management"
        description="Manage your Wedding Counselors subscription and billing"
        noindex={true}
      />

      <div className="subscription-container">
        {/* Header */}
        <div className="subscription-header">
          <div className="dashboard-title">
            <h1>Subscription & Billing</h1>
            <p>Manage your plan and see what's included</p>
          </div>
          <div className="dashboard-actions">
            <Link to="/professional/dashboard" className="btn btn-outline">
              <i className="fa fa-arrow-left" aria-hidden="true"></i>
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Current Plan Section */}
        <div className="dashboard-section">
          <h2>Your Current Plan</h2>
          <div style={{
            background: 'linear-gradient(135deg, var(--teal) 0%, var(--teal-dark, #0d9488) 100%)',
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

          {/* Plan Features */}
          <div style={{
            background: 'white',
            padding: 'var(--space-6)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--gray-200)'
          }}>
            <h4 style={{ marginBottom: 'var(--space-4)', color: 'var(--text-primary)' }}>
              What's Included in Your Plan
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
                    style={{ color: 'var(--success, #22c55e)', marginTop: '2px' }}
                    aria-hidden="true"
                  ></i>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Upgrade Options */}
        <div className="dashboard-section" style={{ marginTop: 'var(--space-8)' }}>
          <h2>Upgrade Options</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
            Get more visibility and features to grow your practice
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 'var(--space-6)'
          }}>
            {/* Featured Plan */}
            {currentTier !== 'featured' && currentTier !== 'premium' && (
              <div style={{
                background: 'white',
                borderRadius: 'var(--radius-lg)',
                border: '2px solid var(--gray-200)',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'var(--warning, #f59e0b)',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  textTransform: 'uppercase'
                }}>
                  Coming Soon
                </div>
                <div style={{ padding: 'var(--space-6)' }}>
                  <h3 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
                    Featured
                  </h3>
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    color: 'var(--teal)',
                    marginBottom: 'var(--space-2)'
                  }}>
                    $29<span style={{ fontSize: '1rem', fontWeight: '400', color: 'var(--text-secondary)' }}>/month</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
                    Stand out with premium placement and enhanced features
                  </p>
                  <ul style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: '0 0 var(--space-4) 0',
                    display: 'grid',
                    gap: 'var(--space-2)',
                    fontSize: '0.95rem'
                  }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <i className="fa fa-star" style={{ color: 'var(--warning, #f59e0b)' }} aria-hidden="true"></i>
                      Priority search placement
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <i className="fa fa-star" style={{ color: 'var(--warning, #f59e0b)' }} aria-hidden="true"></i>
                      Featured badge
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <i className="fa fa-star" style={{ color: 'var(--warning, #f59e0b)' }} aria-hidden="true"></i>
                      Enhanced profile options
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <i className="fa fa-star" style={{ color: 'var(--warning, #f59e0b)' }} aria-hidden="true"></i>
                      Advanced analytics
                    </li>
                  </ul>
                  <button
                    disabled
                    style={{
                      width: '100%',
                      padding: 'var(--space-3)',
                      background: 'var(--gray-200)',
                      color: 'var(--text-secondary)',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: '600',
                      cursor: 'not-allowed'
                    }}
                  >
                    Available Soon
                  </button>
                </div>
              </div>
            )}

            {/* Premium Plan */}
            {currentTier !== 'premium' && (
              <div style={{
                background: 'white',
                borderRadius: 'var(--radius-lg)',
                border: '2px solid var(--gray-200)',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'var(--warning, #f59e0b)',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  textTransform: 'uppercase'
                }}>
                  Coming Soon
                </div>
                <div style={{ padding: 'var(--space-6)' }}>
                  <h3 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
                    Premium
                  </h3>
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    color: 'var(--teal)',
                    marginBottom: 'var(--space-2)'
                  }}>
                    $79<span style={{ fontSize: '1rem', fontWeight: '400', color: 'var(--text-secondary)' }}>/month</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
                    Maximum visibility with exclusive premium features
                  </p>
                  <ul style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: '0 0 var(--space-4) 0',
                    display: 'grid',
                    gap: 'var(--space-2)',
                    fontSize: '0.95rem'
                  }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <i className="fa fa-crown" style={{ color: 'var(--accent, #8b5cf6)' }} aria-hidden="true"></i>
                      Top placement everywhere
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <i className="fa fa-crown" style={{ color: 'var(--accent, #8b5cf6)' }} aria-hidden="true"></i>
                      Highlighted profile design
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <i className="fa fa-crown" style={{ color: 'var(--accent, #8b5cf6)' }} aria-hidden="true"></i>
                      Priority lead notifications
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <i className="fa fa-crown" style={{ color: 'var(--accent, #8b5cf6)' }} aria-hidden="true"></i>
                      Dedicated account manager
                    </li>
                  </ul>
                  <button
                    disabled
                    style={{
                      width: '100%',
                      padding: 'var(--space-3)',
                      background: 'var(--gray-200)',
                      color: 'var(--text-secondary)',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: '600',
                      cursor: 'not-allowed'
                    }}
                  >
                    Available Soon
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Early Access Section */}
        <div style={{
          marginTop: 'var(--space-12)',
          padding: 'var(--space-8)',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 'var(--radius-lg)',
          color: 'white',
          textAlign: 'center'
        }}>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <i
              className="fa fa-bell"
              style={{ fontSize: '2.5rem', marginBottom: 'var(--space-4)', opacity: 0.9 }}
              aria-hidden="true"
            ></i>
            <h3 style={{ color: 'white', marginBottom: 'var(--space-3)' }}>
              Want Early Access to Premium Features?
            </h3>
            <p style={{ opacity: 0.9, marginBottom: 'var(--space-4)' }}>
              We're working on exciting new features to help you grow your practice.
              You'll be the first to know when they launch!
            </p>
            <div style={{
              background: 'rgba(255,255,255,0.15)',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-3)'
            }}>
              <i className="fa fa-envelope" style={{ opacity: 0.9 }} aria-hidden="true"></i>
              <span>
                We'll notify you at <strong>{userEmail}</strong> when upgrades are available
              </span>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="dashboard-section" style={{ marginTop: 'var(--space-8)' }}>
          <h2>Questions About Plans?</h2>
          <div style={{
            background: 'var(--bg-secondary, #f9fafb)',
            padding: 'var(--space-6)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--gray-200)'
          }}>
            <p style={{ marginBottom: 'var(--space-4)' }}>
              Have questions about which plan is right for you? We're here to help!
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <a
                href="mailto:hello@weddingcounselors.com?subject=Question about subscription plans"
                className="btn btn-outline"
              >
                <i className="fa fa-envelope" aria-hidden="true"></i>
                Contact Support
              </a>
              <Link to="/support" className="btn btn-ghost">
                <i className="fa fa-question-circle" aria-hidden="true"></i>
                Visit Help Center
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SubscriptionPage;
