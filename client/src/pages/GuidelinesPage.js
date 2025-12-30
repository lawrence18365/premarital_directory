import React from 'react'
import { Link } from 'react-router-dom'
import SEOHelmet from '../components/analytics/SEOHelmet'

const GuidelinesPage = () => {
  return (
    <div className="page-container guidelines-page">
      <SEOHelmet
        title="Professional Guidelines"
        description="Standards and best practices for verified professionals in the Wedding Counselors directory."
        url="/guidelines"
      />
      <div className="container">
        <div className="page-header">
          <h1>Professional Guidelines</h1>
          <p className="lead">
            Standards and best practices for professionals listed in our premarital counseling directory.
          </p>
        </div>

        <div className="content-section">
          <div className="guidelines-intro">
            <h2>Our Commitment to Quality</h2>
            <p>
              We maintain high standards for all professionals in our directory to ensure couples 
              receive quality premarital counseling services. These guidelines help maintain the 
              integrity and reputation of our platform.
            </p>
          </div>

          <div className="guidelines-section">
            <h2>Professional Standards</h2>
            
            <div className="guidelines-grid">
              <div className="guideline-card">
                <div className="guideline-icon" aria-hidden="true">
                  <i className="fa fa-graduation-cap"></i>
                </div>
                <h3>Required Credentials</h3>
                <ul>
                  <li>Licensed Marriage and Family Therapists (LMFT)</li>
                  <li>Licensed Clinical Social Workers (LCSW)</li>
                  <li>Licensed Professional Counselors (LPC)</li>
                  <li>Certified Relationship Coaches</li>
                  <li>Ordained Clergy with Counseling Experience</li>
                </ul>
              </div>
              
              <div className="guideline-card">
                <div className="guideline-icon" aria-hidden="true">
                  <i className="fa fa-clipboard-list"></i>
                </div>
                <h3>Profile Requirements</h3>
                <ul>
                  <li>Accurate contact information</li>
                  <li>Valid professional credentials</li>
                  <li>Clear professional photo</li>
                  <li>Detailed bio and specialties</li>
                  <li>Current licensing status</li>
                </ul>
              </div>
              
              <div className="guideline-card">
                <div className="guideline-icon" aria-hidden="true">
                  <i className="fa fa-handshake"></i>
                </div>
                <h3>Ethical Standards</h3>
                <ul>
                  <li>Maintain client confidentiality</li>
                  <li>Follow professional codes of conduct</li>
                  <li>Provide honest and accurate information</li>
                  <li>Respect couples' autonomy and choices</li>
                  <li>Report any changes in credentials</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="guidelines-section">
            <h2>Communication Guidelines</h2>
            
            <div className="communication-rules">
              <div className="rule-item">
                <h3>Response Time</h3>
                <p>
                  Respond to inquiries from couples within 24-48 hours during business days. 
                  Prompt communication builds trust and shows professionalism.
                </p>
              </div>
              
              <div className="rule-item">
                <h3>Professional Communication</h3>
                <p>
                  Maintain a professional tone in all communications. Be respectful, clear, 
                  and helpful. Avoid overly casual language or inappropriate content.
                </p>
              </div>
              
              <div className="rule-item">
                <h3>Transparency</h3>
                <p>
                  Be upfront about your approach, fees, availability, and any limitations. 
                  Honesty helps couples make informed decisions about their care.
                </p>
              </div>
            </div>
          </div>

          <div className="guidelines-section">
            <h2>Profile Management</h2>
            
            <div className="profile-guidelines">
              <div className="profile-item">
                <h3>Keep Information Current</h3>
                <p>
                  Regularly update your profile with current contact information, availability, 
                  and any changes in credentials or specialties. Outdated information can lead 
                  to missed opportunities.
                </p>
              </div>
              
              <div className="profile-item">
                <h3>Accurate Representation</h3>
                <p>
                  Ensure your profile accurately represents your qualifications, experience, 
                  and services. Misrepresentation can lead to removal from the directory.
                </p>
              </div>
              
              <div className="profile-item">
                <h3>Professional Photos</h3>
                <p>
                  Use clear, professional photos that help couples feel comfortable. Avoid 
                  casual or inappropriate images that might detract from your professional image.
                </p>
              </div>
            </div>
          </div>

          <div className="guidelines-section">
            <h2>Service Standards</h2>
            
            <div className="service-standards">
              <div className="standard-item">
                <h3>Premarital Focus</h3>
                <p>
                  Our directory is specifically for premarital counseling services. While 
                  you may offer other services, your profile should emphasize premarital 
                  preparation and relationship skills.
                </p>
              </div>
              
              <div className="standard-item">
                <h3>Evidence-Based Practices</h3>
                <p>
                  When possible, use evidence-based approaches and be prepared to discuss 
                  your methods with couples. This helps build credibility and trust.
                </p>
              </div>
              
              <div className="standard-item">
                <h3>Inclusive Approach</h3>
                <p>
                  Welcome couples from diverse backgrounds, orientations, and beliefs. 
                  Create an inclusive environment where all couples feel valued and respected.
                </p>
              </div>
            </div>
          </div>

          <div className="guidelines-section">
            <h2>Compliance and Monitoring</h2>
            
            <div className="compliance-info">
              <div className="compliance-item">
                <h3>Regular Reviews</h3>
                <p>
                  Profiles are periodically reviewed to ensure compliance with these guidelines. 
                  We may contact you for additional information or verification.
                </p>
              </div>
              
              <div className="compliance-item">
                <h3>Reporting Issues</h3>
                <p>
                  If you become aware of any issues with other professionals in the directory, 
                  please report them to our support team. We take all reports seriously.
                </p>
              </div>
              
              <div className="compliance-item">
                <h3>Policy Violations</h3>
                <p>
                  Serious violations of these guidelines may result in removal from the directory. 
                  We reserve the right to remove any profile that doesn't meet our standards.
                </p>
              </div>
            </div>
          </div>

          <div className="guidelines-cta">
            <h2>Questions or Concerns?</h2>
            <p>
              If you have questions about these guidelines or need help with your profile, 
              our support team is here to help.
            </p>
            <div className="cta-buttons">
              <Link to="/support" className="btn btn-primary">
                Contact Support
              </Link>
              <Link to="/professional/dashboard" className="btn btn-outline">
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GuidelinesPage
