import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useStripe } from '../../contexts/StripeContext'
import { Link } from 'react-router-dom'

const SubscriptionPage = () => {
  const { profile } = useAuth()
  const { 
    createCheckoutSession, 
    createPortalSession, 
    getSubscriptionPlans, 
    getCurrentSubscription,
    loading 
  } = useStripe()
  
  const [plans, setPlans] = useState([])
  const [currentSubscription, setCurrentSubscription] = useState(null)
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    loadSubscriptionData()
  }, [profile])

  const loadSubscriptionData = async () => {
    if (!profile) return

    setPageLoading(true)

    try {
      // Load subscription plans
      const { data: plansData, error: plansError } = await getSubscriptionPlans()
      if (plansError) throw plansError
      setPlans(plansData || [])

      // Load current subscription
      const { data: subscriptionData } = await getCurrentSubscription(profile.id)
      setCurrentSubscription(subscriptionData)

    } catch (error) {
      console.error('Error loading subscription data:', error)
    }

    setPageLoading(false)
  }

  const handleUpgrade = async (priceId) => {
    if (!profile) return

    const { error } = await createCheckoutSession(priceId, profile.id)
    
    if (error) {
      alert('Error creating checkout session. Please try again.')
    }
  }

  const handleManageSubscription = async () => {
    const { error } = await createPortalSession()
    
    if (error) {
      alert('Error accessing subscription management. Please try again.')
    }
  }

  const formatPrice = (priceInCents) => {
    return `$${(priceInCents / 100).toFixed(0)}`
  }

  const isCurrentPlan = (planId) => {
    return currentSubscription?.plan?.id === planId
  }

  const getPlanFeatures = (plan) => {
    const features = []
    
    if (plan.name === 'Free') {
      features.push('Basic profile listing')
      features.push('Contact form inquiries')
      features.push('1 profile photo')
      features.push('Basic support')
    }
    
    if (plan.name === 'Featured') {
      features.push('Everything in Free')
      features.push('Featured placement in search')
      features.push('Premium badge on profile')
      features.push('Up to 5 profile photos')
      features.push('Lead analytics dashboard')
      features.push('Priority support')
    }
    
    if (plan.name === 'Premium') {
      features.push('Everything in Featured')
      features.push('Top placement in search results')
      features.push('Premium professional badge')
      features.push('Unlimited profile photos')
      features.push('Advanced lead analytics')
      features.push('Calendar integration')
      features.push('Custom profile branding')
      features.push('Dedicated account manager')
    }
    
    return features
  }

  if (pageLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading subscription options...</p>
      </div>
    )
  }

  return (
    <div className="subscription-container">
      {/* Header */}
      <div className="subscription-header">
        <Link to="/professional/dashboard" className="back-link">
          <i className="fa fa-arrow-left" aria-hidden="true"></i>
          Back to Dashboard
        </Link>
        
        <div className="header-content">
          <h1>Subscription Plans</h1>
          <p>Choose the plan that works best for your practice</p>
        </div>
      </div>

      {/* Current Subscription Status */}
      {currentSubscription && (
        <div className="current-subscription">
          <div className="subscription-card">
            <h3>Current Plan: {currentSubscription.plan.name}</h3>
            <p>
              {currentSubscription.plan.price_monthly > 0 
                ? `${formatPrice(currentSubscription.plan.price_monthly)}/month`
                : 'Free forever'
              }
            </p>
            {currentSubscription.status === 'active' && currentSubscription.current_period_end && (
              <p className="billing-info">
                Next billing date: {new Date(currentSubscription.current_period_end).toLocaleDateString()}
              </p>
            )}
            
            {currentSubscription.plan.name !== 'Free' && (
              <button 
                onClick={handleManageSubscription}
                className="btn btn-outline"
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Manage Subscription'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Subscription Plans */}
      <div className="plans-grid">
        {plans.map(plan => {
          const isCurrent = isCurrentPlan(plan.id)
          const isUpgrade = currentSubscription && 
                           plan.price_monthly > currentSubscription.plan.price_monthly
          
          return (
            <div 
              key={plan.id} 
              className={`plan-card ${isCurrent ? 'plan-current' : ''} ${plan.name === 'Featured' ? 'plan-popular' : ''}`}
            >
              {plan.name === 'Featured' && (
                <div className="plan-badge">Most Popular</div>
              )}
              
              <div className="plan-header">
                <h3>{plan.name}</h3>
                <div className="plan-price">
                  {plan.price_monthly === 0 ? (
                    <span className="price">Free</span>
                  ) : (
                    <>
                      <span className="price">{formatPrice(plan.price_monthly)}</span>
                      <span className="period">/month</span>
                    </>
                  )}
                </div>
              </div>

              <div className="plan-features">
                {getPlanFeatures(plan).map((feature, index) => (
                  <div key={index} className="feature-item">
                    <i className="fa fa-check" aria-hidden="true"></i>
                    {feature}
                  </div>
                ))}
              </div>

              <div className="plan-action">
                {isCurrent ? (
                  <button className="btn btn-outline btn-full" disabled>
                    <i className="fa fa-check" aria-hidden="true"></i>
                    Current Plan
                  </button>
                ) : isUpgrade ? (
                  <button 
                    className="btn btn-primary btn-full"
                    onClick={() => handleUpgrade(plan.stripe_price_id)}
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : 'Upgrade Now'}
                  </button>
                ) : plan.price_monthly === 0 ? (
                  <button className="btn btn-outline btn-full" disabled>
                    Basic Plan
                  </button>
                ) : (
                  <button 
                    className="btn btn-outline btn-full"
                    onClick={() => handleUpgrade(plan.stripe_price_id)}
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : 'Downgrade'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Benefits Section */}
      <div className="benefits-section">
        <h2>Why Upgrade?</h2>
        <div className="benefits-grid">
          <div className="benefit-item">
            <div className="benefit-icon">
              <i className="fa fa-star" aria-hidden="true"></i>
            </div>
            <h4>Get More Leads</h4>
            <p>Featured and premium placements result in 3x more couple inquiries on average.</p>
          </div>
          
          <div className="benefit-item">
            <div className="benefit-icon">
              <i className="fa fa-chart-bar" aria-hidden="true"></i>
            </div>
            <h4>Track Your Success</h4>
            <p>Advanced analytics show you exactly how your profile is performing.</p>
          </div>
          
          <div className="benefit-item">
            <div className="benefit-icon">
              <i className="fa fa-calendar" aria-hidden="true"></i>
            </div>
            <h4>Streamline Booking</h4>
            <p>Calendar integration makes it easy for couples to schedule consultations.</p>
          </div>
          
          <div className="benefit-item">
            <div className="benefit-icon">
              <i className="fa fa-headset" aria-hidden="true"></i>
            </div>
            <h4>Priority Support</h4>
            <p>Get faster response times and dedicated support for your account.</p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="faq-section">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-grid">
          <div className="faq-item">
            <h4>Can I cancel anytime?</h4>
            <p>Yes, you can cancel your subscription at any time. Your account will remain active until the end of your billing period.</p>
          </div>
          
          <div className="faq-item">
            <h4>What happens if I downgrade?</h4>
            <p>Your account will be downgraded at the end of your current billing period. Premium features will be removed, but your profile will remain active.</p>
          </div>
          
          <div className="faq-item">
            <h4>Do you offer refunds?</h4>
            <p>We offer a 30-day money-back guarantee. If you're not satisfied, contact our support team for a full refund.</p>
          </div>
          
          <div className="faq-item">
            <h4>How quickly will I see results?</h4>
            <p>Most professionals see an increase in leads within the first week of upgrading to a featured or premium plan.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SubscriptionPage