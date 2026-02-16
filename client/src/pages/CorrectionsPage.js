import React from 'react'
import { Link } from 'react-router-dom'
import SEOHelmet from '../components/analytics/SEOHelmet'

const CorrectionsPage = () => {
  return (
    <div className="page-container about-page">
      <SEOHelmet
        title="Request a Correction or Removal | Premarital Counseling Directory"
        description="Request corrections to inaccurate listings or removal from the Premarital Counseling Directory. We respond to all requests within 5 business days."
        url="/corrections"
        canonicalUrl="https://www.weddingcounselors.com/corrections"
      />
      <div className="container">
        <div className="container-narrow">
          <div className="page-header">
            <h1>Corrections & Removal Requests</h1>
            <p className="lead">
              We are committed to maintaining accurate listings. Here is how to request changes.
            </p>
          </div>

          <div className="content-section">
            <h2>For Professionals</h2>

            <h3>Update Your Information</h3>
            <p>
              The fastest way to correct your listing is to{' '}
              <Link to="/claim-profile">claim your profile</Link>. Once claimed, you can update
              your bio, credentials, pricing, availability, and all other details directly from
              your dashboard. Changes take effect immediately.
            </p>

            <h3>Request Removal</h3>
            <p>
              If you would like your profile removed from our directory entirely, please email us
              at{' '}
              <a href="mailto:hello@weddingcounselors.com">hello@weddingcounselors.com</a>{' '}
              with the subject line "Profile Removal Request" and include:
            </p>
            <ul>
              <li>Your full name as it appears on the listing</li>
              <li>The URL of your profile page</li>
              <li>Your professional email address for verification</li>
            </ul>
            <p>
              We will process removal requests within 5 business days. Once removed, your profile
              will no longer appear in search results or directory listings, and your email will
              be added to our do-not-contact list to prevent future outreach.
            </p>

            <h2>For Couples</h2>

            <h3>Report Inaccurate Information</h3>
            <p>
              If you have found incorrect information on a listing — such as outdated contact
              details, wrong credentials, or a professional who is no longer practicing — please
              let us know through our <Link to="/contact">contact form</Link>. Include:
            </p>
            <ul>
              <li>The name or URL of the profile</li>
              <li>What information is incorrect</li>
              <li>The correct information, if you know it</li>
            </ul>

            <h3>Report a Concern</h3>
            <p>
              If you have a concern about a professional's conduct or qualifications, please
              email us at{' '}
              <a href="mailto:hello@weddingcounselors.com">hello@weddingcounselors.com</a>.
              We take all reports seriously and will investigate promptly.
            </p>

            <h2>Email Removal</h2>
            <p>
              If you are receiving unwanted emails from our directory, you can unsubscribe using
              the link at the bottom of any email. You can also email us to be permanently added
              to our do-not-contact list.
            </p>

            <h2>Our Response Timeline</h2>
            <ul>
              <li><strong>Profile corrections:</strong> Updated within 2 business days</li>
              <li><strong>Profile removal:</strong> Processed within 5 business days</li>
              <li><strong>Email removal:</strong> Immediate upon unsubscribe; manual requests within 2 business days</li>
              <li><strong>Concern reports:</strong> Acknowledged within 2 business days, investigated promptly</li>
            </ul>

            <div className="about-cta" style={{ marginTop: 'var(--space-12)' }}>
              <h2>Need Help?</h2>
              <p className="lead">
                We are here to help with any corrections or concerns.
              </p>
              <div className="cta-actions">
                <Link to="/contact" className="btn btn-primary btn-large">
                  Contact Us
                </Link>
                <Link to="/claim-profile" className="btn btn-secondary btn-large">
                  Claim Your Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CorrectionsPage
