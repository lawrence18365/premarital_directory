import React from 'react'
import { Link } from 'react-router-dom'
import SEOHelmet from '../components/analytics/SEOHelmet'

const SupportPage = () => {
  return (
    <div className="page-container support-page">
      <SEOHelmet
        title="Support Center"
        description="Get help with your account, profile management, and general questions about the Wedding Counselors directory."
        url="/support"
      />
      <div className="container">
        <div className="page-header">
          <h1>Support Center</h1>
          <p className="lead">
            Get help with your account, profile management, or general questions about 
            our premarital counseling directory.
          </p>
        </div>

        <div className="content-section">
          <div className="support-options">
            <div className="support-grid">
              <div className="support-card">
                <div className="support-icon">📧</div>
                <h3>Email Support</h3>
                <p>
                  Get detailed help with your questions. We typically respond within 24 hours 
                  during business days.
                </p>
                <a href="mailto:support@premaritalcounselingdirectory.com" className="btn btn-outline">
                  Email Us
                </a>
              </div>
              
              <div className="support-card">
                <div className="support-icon">💬</div>
                <h3>Contact Form</h3>
                <p>
                  Send us a message with your specific questions or concerns. We'll get back 
                  to you promptly.
                </p>
                <Link to="/contact" className="btn btn-outline">
                  Contact Form
                </Link>
              </div>
              
              <div className="support-card">
                <div className="support-icon">📞</div>
                <h3>Phone Support</h3>
                <p>
                  Speak with our support team directly for urgent issues or complex questions.
                </p>
                <div className="phone-info">
                  <p><strong>Phone:</strong> (555) 123-4567</p>
                  <p><strong>Hours:</strong> Mon-Fri, 9 AM - 5 PM EST</p>
                </div>
              </div>
            </div>
          </div>

          <div className="faq-section">
            <h2>Frequently Asked Questions</h2>
            
            <div className="faq-category">
              <h3>For Couples</h3>
              
              <div className="faq-item">
                <h4>How do I find counselors in my area?</h4>
                <p>
                  Use our search function on the homepage. Enter your city, state, or zip code 
                  to find local professionals. You can also filter by specialty and profession type.
                </p>
              </div>
              
              <div className="faq-item">
                <h4>How do I contact a counselor?</h4>
                <p>
                  Visit the counselor's profile page and use the contact form, or click on their 
                  website, phone, or email links if available. Each professional sets their 
                  preferred contact methods.
                </p>
              </div>
              
              <div className="faq-item">
                <h4>Are all professionals verified?</h4>
                <p>
                  Yes, we verify credentials, licensing, and contact information for all 
                  professionals in our directory to ensure quality and legitimacy.
                </p>
              </div>
              
              <div className="faq-item">
                <h4>Is using the directory free for couples?</h4>
                <p>
                  Absolutely! Our directory is completely free for couples to search and 
                  connect with counseling professionals.
                </p>
              </div>
            </div>

            <div className="faq-category">
              <h3>For Professionals</h3>
              
              <div className="faq-item">
                <h4>How do I claim my profile?</h4>
                <p>
                  Visit our <Link to="/claim-profile">Claim Profile</Link> page and search for 
                  your existing listing, or create a new one. You'll need to verify your 
                  credentials during the process.
                </p>
              </div>
              
              <div className="faq-item">
                <h4>How much does it cost to be listed?</h4>
                <p>
                  Basic listings are free! We also offer enhanced visibility options with 
                  our Professional and Premium plans. View our <Link to="/pricing">pricing page</Link> for details.
                </p>
              </div>
              
              <div className="faq-item">
                <h4>How do I update my profile information?</h4>
                <p>
                  After claiming your profile, you'll receive login credentials to access your 
                  dashboard where you can update information, view analytics, and manage inquiries.
                </p>
              </div>
              
              <div className="faq-item">
                <h4>What credentials do you accept?</h4>
                <p>
                  We accept licensed therapists (LMFT, LCSW, LPC), certified coaches (with 
                  recognized certifications), and ordained clergy or religious counselors.
                </p>
              </div>
              
              <div className="faq-item">
                <h4>How quickly will my profile be approved?</h4>
                <p>
                  Profile verification typically takes 1-3 business days. We'll email you 
                  once your profile is live and provide access to your dashboard.
                </p>
              </div>
            </div>

            <div className="faq-category">
              <h3>Technical Support</h3>
              
              <div className="faq-item">
                <h4>The website isn't working properly</h4>
                <p>
                  Try refreshing the page or clearing your browser cache. If problems persist, 
                  email us with details about your browser, device, and the specific issue.
                </p>
              </div>
              
              <div className="faq-item">
                <h4>I'm not receiving emails from the platform</h4>
                <p>
                  Check your spam folder first. If you still don't see our emails, add 
                  support@premaritalcounselingdirectory.com to your contacts and contact us.
                </p>
              </div>
              
              <div className="faq-item">
                <h4>The search isn't returning results</h4>
                <p>
                  Try broadening your search criteria or check your spelling. If you're 
                  searching a very specific location, try nearby cities or the full state name.
                </p>
              </div>
            </div>
          </div>

          <div className="support-resources">
            <h2>Additional Resources</h2>
            <div className="resources-grid">
              <div className="resource-item">
                <h3>📚 Getting Started Guide</h3>
                <p>
                  New to the platform? Our comprehensive guide walks you through all the 
                  features and how to make the most of your directory experience.
                </p>
              </div>
              
              <div className="resource-item">
                <h3>Best Practices</h3>
                <p>
                  Tips for professionals on creating compelling profiles and effective 
                  communication with potential clients.
                </p>
              </div>
              
              <div className="resource-item">
                <h3>🔐 Privacy & Security</h3>
                <p>
                  Learn about how we protect your data and maintain privacy for both 
                  couples and professionals using our platform.
                </p>
              </div>
            </div>
          </div>

          <div className="support-emergency">
            <h2>Emergency or Crisis Support</h2>
            <div className="emergency-notice">
              <p>
                <strong>Important:</strong> Our directory provides information about premarital 
                counseling professionals but is not equipped to handle crisis situations.
              </p>
              
              <p>If you or someone you know is in crisis, please contact:</p>
              
              <ul>
                <li><strong>National Suicide Prevention Lifeline:</strong> 988</li>
                <li><strong>Crisis Text Line:</strong> Text HOME to 741741</li>
                <li><strong>National Domestic Violence Hotline:</strong> 1-800-799-7233</li>
                <li><strong>Emergency Services:</strong> 911</li>
              </ul>
            </div>
          </div>

          <div className="support-feedback">
            <h2>Feedback & Suggestions</h2>
            <p>
              We're always looking to improve our platform. If you have suggestions, 
              feature requests, or feedback about your experience, we'd love to hear from you.
            </p>
            <Link to="/contact" className="btn btn-primary">
              Share Feedback
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SupportPage
