import React from 'react'
import SEOHelmet from '../components/analytics/SEOHelmet'

const TermsPage = () => {
  return (
    <div className="page-container">
      <SEOHelmet 
        title="Terms of Service"
        description="Terms governing use of the Wedding Counselors directory for couples and professionals."
        url="/terms"
      />
      <div className="container">
        <div className="page-header">
          <h1>Terms of Service</h1>
          <p className="lead">
            These terms govern your use of our premarital counseling directory. 
            Please read them carefully before using our services.
          </p>
        </div>

        <div className="content-section">
          <div className="policy-content">
            <section className="policy-section">
              <h2>Acceptance of Terms</h2>
              <p>
                By accessing and using the Premarital Counseling Directory, you accept and agree to be 
                bound by the terms and provisions of this agreement. If you do not agree to abide by 
                the above, please do not use this service.
              </p>
            </section>

            <section className="policy-section">
              <h2>Description of Service</h2>
              <p>
                Our directory connects couples seeking premarital counseling with qualified professionals 
                including licensed therapists, certified coaches, and clergy members. We provide a platform 
                for discovery and initial contact but do not provide counseling services directly.
              </p>
            </section>

            <section className="policy-section">
              <h2>User Accounts and Responsibilities</h2>
              <h3>For Couples:</h3>
              <ul>
                <li>You must provide accurate contact information when reaching out to professionals</li>
                <li>You are responsible for evaluating and selecting appropriate counseling services</li>
                <li>You must respect professionals' time and communication preferences</li>
              </ul>
              
              <h3>For Professionals:</h3>
              <ul>
                <li>You must provide accurate information about your credentials and services</li>
                <li>You are responsible for maintaining current licensing and certifications</li>
                <li>You must respond to inquiries in a timely and professional manner</li>
                <li>You are solely responsible for your counseling services and client relationships</li>
              </ul>
            </section>

            <section className="policy-section">
              <h2>Professional Verification</h2>
              <p>
                While we make reasonable efforts to verify professional credentials, we cannot guarantee 
                the accuracy of all information. Users are encouraged to independently verify credentials 
                and qualifications before engaging services.
              </p>
            </section>

            <section className="policy-section">
              <h2>Prohibited Uses</h2>
              <p>You may not use our service:</p>
              <ul>
                <li>For any unlawful purpose or to solicit unlawful activity</li>
                <li>To harass, abuse, or harm another person</li>
                <li>To spam or send unsolicited communications</li>
                <li>To impersonate another person or entity</li>
                <li>To collect or harvest personal information of other users</li>
                <li>To interfere with or disrupt our services</li>
              </ul>
            </section>

            <section className="policy-section">
              <h2>Content and Intellectual Property</h2>
              <p>
                The content, features, and functionality of our directory are owned by us and are 
                protected by copyright, trademark, and other intellectual property laws. You may not 
                reproduce, distribute, or create derivative works without our permission.
              </p>
            </section>

            <section className="policy-section">
              <h2>Third-Party Services</h2>
              <p>
                Our directory may contain links to third-party websites or services. We are not 
                responsible for the content, policies, or practices of these third parties. Your 
                interactions with professionals found through our directory are solely between you and them.
              </p>
            </section>

            <section className="policy-section">
              <h2>Disclaimers and Limitations</h2>
              <p>
                Our directory is provided "as is" without warranties of any kind. We do not guarantee:
              </p>
              <ul>
                <li>The accuracy or completeness of professional information</li>
                <li>The quality or effectiveness of counseling services</li>
                <li>Uninterrupted or error-free service</li>
                <li>That our service will meet your specific needs</li>
              </ul>
              
              <p>
                We are not liable for any direct, indirect, incidental, or consequential damages 
                arising from your use of our service or any counseling services obtained through our platform.
              </p>
            </section>

            <section className="policy-section">
              <h2>Indemnification</h2>
              <p>
                You agree to indemnify and hold us harmless from any claims, damages, or expenses 
                arising from your use of our service, your violation of these terms, or your 
                infringement of any rights of another person or entity.
              </p>
            </section>

            <section className="policy-section">
              <h2>Termination</h2>
              <p>
                We reserve the right to terminate or suspend your access to our service at any time, 
                without prior notice, for any reason including but not limited to breach of these terms.
              </p>
            </section>

            <section className="policy-section">
              <h2>Governing Law</h2>
              <p>
                These terms shall be governed by and construed in accordance with the laws of [Your State/Country], 
                without regard to conflict of law principles.
              </p>
            </section>

            <section className="policy-section">
              <h2>Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. Changes will be effective 
                immediately upon posting. Your continued use of our service constitutes acceptance 
                of the revised terms.
              </p>
            </section>

            <section className="policy-section">
              <h2>Contact Information</h2>
              <p>
                If you have any questions about these terms, please contact us at:
              </p>
              <div className="contact-info">
                <p>Email: legal@premaritalcounselingdirectory.com</p>
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

export default TermsPage
