import React from 'react'
import { Link } from 'react-router-dom'
import SEOHelmet from '../components/analytics/SEOHelmet'

const ConfirmEmailPage = () => {
  return (
    <>
      <SEOHelmet
        title="Confirm Your Email - Professional Directory"
        description="Complete your professional account setup"
        noIndex={true}
      />
      
      <div className="page-container">
        <div className="container">
          <div className="confirmation-page">
            <div className="confirmation-card">
              <div className="confirmation-header">
                <div className="success-icon">
                  <i className="fa fa-envelope-open-text fa-3x"></i>
                </div>
                <h1>Check Your Email</h1>
                <p className="lead">We've sent you a confirmation link to complete your account setup</p>
              </div>
              
              <div className="confirmation-content">
                <div className="next-steps-card">
                  <h2>What's Next?</h2>
                  <div className="steps-list">
                    <div className="step">
                      <div className="step-number">1</div>
                      <div className="step-content">
                        <h3>Check Your Email</h3>
                        <p>Look for an email from us with your confirmation link</p>
                      </div>
                    </div>
                    
                    <div className="step">
                      <div className="step-number">2</div>
                      <div className="step-content">
                        <h3>Click to Activate</h3>
                        <p>Click the confirmation link to activate your account</p>
                      </div>
                    </div>
                    
                    <div className="step">
                      <div className="step-number">3</div>
                      <div className="step-content">
                        <h3>Complete Your Profile</h3>
                        <p>Add your credentials, bio, and start connecting with couples</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="help-section">
                  <h3>Don't see the email?</h3>
                  <ul>
                    <li>Check your spam/junk folder</li>
                    <li>Make sure you entered your email correctly</li>
                    <li>The email may take a few minutes to arrive</li>
                  </ul>
                  
                  <div className="action-buttons">
                    <Link to="/professional/login" className="btn btn-primary">
                      I've Confirmed - Let's Login
                    </Link>
                    <Link to="/contact" className="btn btn-outline">
                      Need Help?
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ConfirmEmailPage