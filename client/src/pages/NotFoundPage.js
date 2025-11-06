import React from 'react'
import { Link } from 'react-router-dom'

const NotFoundPage = () => {
  return (
    <div style={{ padding: 'var(--space-20) 0', background: 'var(--gray-50)', minHeight: '60vh' }}>
      <div className="container">
        <div style={{ 
          textAlign: 'center', 
          maxWidth: '600px', 
          margin: '0 auto',
          background: 'var(--white)',
          padding: 'var(--space-12)',
          borderRadius: 'var(--radius-2xl)',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--gray-200)'
        }}>
          <div style={{ 
            fontSize: 'var(--text-6xl)', 
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--primary)',
            marginBottom: 'var(--space-4)'
          }}>
            404
          </div>
          
          <h1 style={{ marginBottom: 'var(--space-4)' }}>Page Not Found</h1>
          
          <p className="text-large text-secondary mb-8">
            The page you're looking for doesn't exist or may have been moved. 
            Let's get you back on track to finding the perfect premarital counselor.
          </p>
          
          <div style={{ 
            display: 'flex', 
            gap: 'var(--space-4)', 
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: 'var(--space-8)'
          }}>
            <Link to="/" className="btn btn-primary btn-large">
              Browse Counselors
            </Link>
            <Link to="/about" className="btn btn-secondary btn-large">
              Learn More
            </Link>
          </div>

          <div style={{ 
            background: 'var(--gray-50)', 
            padding: 'var(--space-6)', 
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--gray-200)'
          }}>
            <h3 style={{ marginBottom: 'var(--space-4)' }}>Popular Pages</h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: 'var(--space-4)',
              textAlign: 'left'
            }}>
              <div>
                <h5>For Couples</h5>
                <ul style={{ 
                  listStyle: 'none', 
                  fontSize: 'var(--text-sm)',
                  marginTop: 'var(--space-2)'
                }}>
                  <li style={{ marginBottom: 'var(--space-1)' }}>
                    <Link to="/" className="text-primary">Find Counselors</Link>
                  </li>
                  <li style={{ marginBottom: 'var(--space-1)' }}>
                    <Link to="/therapists" className="text-primary">Therapists</Link>
                  </li>
                  <li style={{ marginBottom: 'var(--space-1)' }}>
                    <Link to="/coaches" className="text-primary">Coaches</Link>
                  </li>
                  <li style={{ marginBottom: 'var(--space-1)' }}>
                    <Link to="/clergy" className="text-primary">Clergy</Link>
                  </li>
                </ul>
              </div>
              
              <div>
                <h5>For Professionals</h5>
                <ul style={{ 
                  listStyle: 'none', 
                  fontSize: 'var(--text-sm)',
                  marginTop: 'var(--space-2)'
                }}>
                  <li style={{ marginBottom: 'var(--space-1)' }}>
                    <Link to="/claim-profile" className="text-primary">Claim Profile</Link>
                  </li>
                  <li style={{ marginBottom: 'var(--space-1)' }}>
                    <Link to="/pricing" className="text-primary">Pricing</Link>
                  </li>
                  <li style={{ marginBottom: 'var(--space-1)' }}>
                    <Link to="/features" className="text-primary">Features</Link>
                  </li>
                  <li style={{ marginBottom: 'var(--space-1)' }}>
                    <Link to="/support" className="text-primary">Support</Link>
                  </li>
                </ul>
              </div>
              
              <div>
                <h5>Information</h5>
                <ul style={{ 
                  listStyle: 'none', 
                  fontSize: 'var(--text-sm)',
                  marginTop: 'var(--space-2)'
                }}>
                  <li style={{ marginBottom: 'var(--space-1)' }}>
                    <Link to="/about" className="text-primary">About Us</Link>
                  </li>
                  <li style={{ marginBottom: 'var(--space-1)' }}>
                    <Link to="/contact" className="text-primary">Contact</Link>
                  </li>
                  <li style={{ marginBottom: 'var(--space-1)' }}>
                    <Link to="/privacy" className="text-primary">Privacy</Link>
                  </li>
                  <li style={{ marginBottom: 'var(--space-1)' }}>
                    <Link to="/terms" className="text-primary">Terms</Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage