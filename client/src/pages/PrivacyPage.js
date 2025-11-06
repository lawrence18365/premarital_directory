import React from 'react'
import SEOHelmet from '../components/analytics/SEOHelmet'

const PrivacyPage = () => {
  return (
    <div className="page-container privacy-page">
      <SEOHelmet 
        title="Privacy Policy"
        description="How Wedding Counselors collects, uses, and protects your information."
        url="/privacy"
      />
      <div className="container">
        <div className="page-header">
          <h1>Privacy Policy</h1>
          <p className="lead">
            Your privacy is important to us. This policy explains how we collect, use, and protect your information.
          </p>
        </div>

        <div className="content-section">
          <div className="policy-content">
            <section className="policy-section">
              <h2>Information We Collect</h2>
              <p>
                We collect information you provide directly to us, such as when you create an account, 
                update your profile, contact us, or use our services. This may include:
              </p>
              <ul>
                <li>Name, email address, and contact information</li>
                <li>Professional credentials and practice information</li>
                <li>Location and service area details</li>
                <li>Communication preferences</li>
              </ul>
            </section>

            <section className="policy-section">
              <h2>How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul>
                <li>Provide and maintain our directory services</li>
                <li>Connect couples with qualified counseling professionals</li>
                <li>Communicate with you about our services</li>
                <li>Improve and personalize your experience</li>
                <li>Ensure the security and integrity of our platform</li>
              </ul>
            </section>

            <section className="policy-section">
              <h2>Information Sharing</h2>
              <p>
                We do not sell, trade, or otherwise transfer your personal information to third parties 
                without your consent, except as described in this policy. We may share information:
              </p>
              <ul>
                <li>With couples seeking counseling services (public profile information only)</li>
                <li>With service providers who assist in operating our platform</li>
                <li>When required by law or to protect our rights</li>
                <li>In connection with a business transfer or merger</li>
              </ul>
            </section>

            <section className="policy-section">
              <h2>Data Security</h2>
              <p>
                We implement appropriate security measures to protect your personal information against 
                unauthorized access, alteration, disclosure, or destruction. However, no method of 
                transmission over the internet is 100% secure.
              </p>
            </section>

            <section className="policy-section">
              <h2>Your Rights</h2>
              <p>You have the right to:</p>
              <ul>
                <li>Access, update, or delete your personal information</li>
                <li>Opt out of marketing communications</li>
                <li>Request a copy of your data</li>
                <li>Withdraw consent where processing is based on consent</li>
              </ul>
            </section>

            <section className="policy-section">
              <h2>Cookies and Tracking</h2>
              <p>
                We use cookies and similar technologies to enhance your experience, analyze usage, 
                and provide personalized content. You can control cookie settings through your browser.
              </p>
            </section>

            <section className="policy-section">
              <h2>Children's Privacy</h2>
              <p>
                Our services are not intended for children under 13. We do not knowingly collect 
                personal information from children under 13.
              </p>
            </section>

            <section className="policy-section">
              <h2>Changes to This Policy</h2>
              <p>
                We may update this privacy policy from time to time. We will notify you of any 
                changes by posting the new policy on this page and updating the effective date.
              </p>
            </section>

            <section className="policy-section">
              <h2>Contact Us</h2>
              <p>
                If you have any questions about this privacy policy, please contact us at:
              </p>
              <div className="contact-info">
                <p>Email: privacy@premaritalcounselingdirectory.com</p>
                <p>Address: [Your Business Address]</p>
              </div>
            </section>

            <div className="policy-footer">
              <p><strong>Effective Date:</strong> June 11, 2025</p>
              <p><strong>Last Updated:</strong> June 11, 2025</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPage
