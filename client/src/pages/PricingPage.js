import React from 'react'
import { Link } from 'react-router-dom'
import SEOHelmet from '../components/analytics/SEOHelmet'

const PricingPage = () => {
  return (
    <div className="page-container pricing-page">
      <SEOHelmet
        title="Pricing for Professionals"
        description="Simple, transparent plans for premarital counseling professionals. Start with a free listing and upgrade as you grow."
        url="/pricing"
      />
      <div className="container">
        <div className="page-header">
          <h1>Pricing for Professionals</h1>
          <p className="lead">
            Simple, transparent pricing to help you grow your premarital counseling practice. 
            Choose the plan that fits your needs.
          </p>
        </div>

        <div className="content-section">
          <div className="pricing-grid">
            <div className="pricing-card">
              <div className="pricing-header">
                <h3>Basic Listing</h3>
                <div className="price">
                  <span className="currency">$</span>
                  <span className="amount">0</span>
                  <span className="period">/month</span>
                </div>
                <p className="pricing-description">
                  Perfect for professionals just starting out
                </p>
              </div>
              
              <div className="pricing-features">
                <ul>
                  <li>✓ Basic profile listing</li>
                  <li>✓ Contact information display</li>
                  <li>✓ Specialty tags</li>
                  <li>✓ Location-based search</li>
                  <li>✓ Basic profile verification</li>
                  <li>✗ No priority placement</li>
                  <li>✗ No featured badge</li>
                  <li>✗ Limited profile customization</li>
                </ul>
              </div>
              
              <div className="pricing-action">
                <Link to="/claim-profile" className="btn btn-outline">
                  Claim Your Profile
                </Link>
              </div>
            </div>

            <div className="pricing-card featured">
              <div className="featured-badge">Most Popular</div>
              <div className="pricing-header">
                <h3>Professional</h3>
                <div className="price">
                  <span className="currency">$</span>
                  <span className="amount">29</span>
                  <span className="period">/month</span>
                </div>
                <p className="pricing-description">
                  Enhanced visibility and professional features
                </p>
              </div>
              
              <div className="pricing-features">
                <ul>
                  <li>✓ Everything in Basic</li>
                  <li>✓ Priority search placement</li>
                  <li>✓ Professional badge</li>
                  <li>✓ Enhanced profile customization</li>
                  <li>✓ Photo gallery (up to 5 images)</li>
                  <li>✓ Detailed service descriptions</li>
                  <li>✓ Client testimonials section</li>
                  <li>✓ Advanced analytics</li>
                </ul>
              </div>
              
              <div className="pricing-action">
                <Link to="/contact" className="btn btn-primary">
                  Get Started
                </Link>
              </div>
            </div>

            <div className="pricing-card">
              <div className="pricing-header">
                <h3>Premium</h3>
                <div className="price">
                  <span className="currency">$</span>
                  <span className="amount">59</span>
                  <span className="period">/month</span>
                </div>
                <p className="pricing-description">
                  Maximum exposure and advanced features
                </p>
              </div>
              
              <div className="pricing-features">
                <ul>
                  <li>✓ Everything in Professional</li>
                  <li>✓ Top search results placement</li>
                  <li>✓ Featured on homepage</li>
                  <li>✓ Custom profile URL</li>
                  <li>✓ Unlimited photo gallery</li>
                  <li>✓ Video introduction</li>
                  <li>✓ Direct booking integration</li>
                  <li>✓ Priority customer support</li>
                </ul>
              </div>
              
              <div className="pricing-action">
                <Link to="/contact" className="btn btn-primary">
                  Contact Sales
                </Link>
              </div>
            </div>
          </div>

          <div className="pricing-faq">
            <h2>Frequently Asked Questions</h2>
            
            <div className="faq-item">
              <h3>How do I get started?</h3>
              <p>
                Simply claim your profile for free, then upgrade to a paid plan when you're ready 
                for enhanced features and visibility.
              </p>
            </div>
            
            <div className="faq-item">
              <h3>Can I change plans anytime?</h3>
              <p>
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect 
                immediately, and billing is prorated.
              </p>
            </div>
            
            <div className="faq-item">
              <h3>What payment methods do you accept?</h3>
              <p>
                We accept all major credit cards (Visa, MasterCard, American Express) and PayPal. 
                All payments are processed securely.
              </p>
            </div>
            
            <div className="faq-item">
              <h3>Is there a setup fee?</h3>
              <p>
                No setup fees! You only pay the monthly subscription fee for your chosen plan.
              </p>
            </div>
            
            <div className="faq-item">
              <h3>How does profile verification work?</h3>
              <p>
                We verify your professional credentials, licensing information, and contact details 
                to ensure the quality and trustworthiness of our directory.
              </p>
            </div>
            
            <div className="faq-item">
              <h3>Can I cancel anytime?</h3>
              <p>
                Yes, you can cancel your subscription at any time. Your profile will remain active 
                until the end of your current billing period.
              </p>
            </div>
          </div>

          <div className="pricing-guarantee">
            <h2>Our Guarantee</h2>
            <p>
              We're confident in the quality of our directory and the value it provides. 
              If you're not satisfied with your results in the first 30 days, we'll refund 
              your subscription fee, no questions asked.
            </p>
          </div>

          <div className="pricing-cta">
            <h2>Ready to Grow Your Practice?</h2>
            <p>
              Join hundreds of professionals who are connecting with couples seeking 
              premarital counseling through our directory.
            </p>
            <div className="cta-buttons">
              <Link to="/claim-profile" className="btn btn-primary">
                Start Free Today
              </Link>
              <Link to="/contact" className="btn btn-outline">
                Have Questions?
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PricingPage
