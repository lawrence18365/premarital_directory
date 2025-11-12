import React from 'react'
import { Link } from 'react-router-dom'
import SEOHelmet from '../components/analytics/SEOHelmet'

const PricingPage = () => {
  return (
    <div className="page-container pricing-page">
      <SEOHelmet
        title="Free Listing for Premarital Counselors"
        description="Join our directory for free. Connect with engaged couples seeking premarital counseling. No setup fees, no monthly charges."
        url="/pricing"
      />
      <div className="container">
        <div className="page-header">
          <h1>Free Listing for Premarital Counselors</h1>
          <p className="lead">
            Join our directory at no cost and start connecting with engaged couples seeking premarital counseling.
          </p>
        </div>

        <div className="content-section">
          <div className="pricing-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '600px', margin: '0 auto' }}>
            <div className="pricing-card featured">
              <div className="featured-badge">100% Free</div>
              <div className="pricing-header">
                <h3>Professional Directory Listing</h3>
                <div className="price">
                  <span className="currency">$</span>
                  <span className="amount">0</span>
                  <span className="period">/forever</span>
                </div>
                <p className="pricing-description">
                  Everything you need to connect with engaged couples
                </p>
              </div>

              <div className="pricing-features">
                <ul>
                  <li>✓ Complete profile listing</li>
                  <li>✓ Contact information display</li>
                  <li>✓ Specialty tags & credentials</li>
                  <li>✓ Location-based search visibility</li>
                  <li>✓ Profile photo upload</li>
                  <li>✓ Professional bio & description</li>
                  <li>✓ Direct lead inquiries from couples</li>
                  <li>✓ Mobile-friendly profile page</li>
                  <li>✓ SEO-optimized listing</li>
                  <li>✓ Email notifications for new leads</li>
                </ul>
              </div>

              <div className="pricing-action">
                <Link to="/professional/signup" className="btn btn-primary btn-large">
                  Join Free Today
                </Link>
              </div>
            </div>
          </div>

          <div className="pricing-faq">
            <h2>Frequently Asked Questions</h2>

            <div className="faq-item">
              <h3>Is this really free?</h3>
              <p>
                Yes! There are no setup fees, no monthly charges, and no hidden costs.
                We believe in helping counselors connect with couples who need their services.
              </p>
            </div>

            <div className="faq-item">
              <h3>How do I get started?</h3>
              <p>
                Simply sign up with your email, complete your professional profile, and start
                receiving inquiries from engaged couples in your area. The entire process takes
                less than 10 minutes.
              </p>
            </div>

            <div className="faq-item">
              <h3>What information will appear in my listing?</h3>
              <p>
                Your listing includes your name, credentials, professional bio, specialties,
                location, contact information, and any additional details you choose to share.
                You have full control over your profile.
              </p>
            </div>

            <div className="faq-item">
              <h3>How will couples find me?</h3>
              <p>
                Couples search by location, specialty, and counseling approach. Your profile
                appears in relevant search results, and couples can contact you directly through
                our platform.
              </p>
            </div>

            <div className="faq-item">
              <h3>Can I update my profile anytime?</h3>
              <p>
                Absolutely! You can log in anytime to update your bio, specialties, contact
                information, photos, and availability.
              </p>
            </div>

            <div className="faq-item">
              <h3>How do I receive leads?</h3>
              <p>
                When couples are interested in working with you, they'll send an inquiry through
                your profile. You'll receive an email notification with their contact information
                and message.
              </p>
            </div>
          </div>

          <div className="pricing-cta">
            <h2>Ready to Connect with Engaged Couples?</h2>
            <p>
              Join premarital counselors across the country who are helping couples prepare
              for strong, lasting marriages.
            </p>
            <div className="cta-buttons">
              <Link to="/professional/signup" className="btn btn-primary btn-large">
                Create Free Profile
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
