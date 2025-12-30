import React from 'react'
import { Link } from 'react-router-dom'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h4>Premarital Counseling Directory</h4>
            <p>
              Connecting couples with qualified premarital counseling professionals
              to help build strong, lasting marriages. Find therapists, coaches,
              and clergy specializing in relationship preparation.
            </p>
            <p style={{ marginTop: '1rem', fontSize: '0.95rem' }}>
              <strong>Contact:</strong>{' '}
              <a href="mailto:hello@weddingcounselors.com" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                hello@weddingcounselors.com
              </a>
            </p>
            <div className="footer-cta">
              <Link to="/claim-profile" className="btn btn-footer">
                Claim Your Profile
              </Link>
            </div>

            <div className="footer-social" aria-label="Social links">
              <span role="link" tabIndex="0" aria-label="LinkedIn" title="LinkedIn" className="footer-social-link">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4V23h-4V8zm7.5 0h3.8v2.05h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V23h-4v-7.6c0-1.82-.03-4.16-2.53-4.16-2.54 0-2.93 1.98-2.93 4.03V23h-4V8z" />
                </svg>
              </span>
              <span role="link" tabIndex="0" aria-label="Instagram" title="Instagram" className="footer-social-link">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M7 2C4.243 2 2 4.243 2 7v10c0 2.757 2.243 5 5 5h10c2.757 0 5-2.243 5-5V7c0-2.757-2.243-5-5-5H7zm10 2a3 3 0 013 3v10a3 3 0 01-3 3H7a3 3 0 01-3-3V7a3 3 0 013-3h10zm-5 3a5 5 0 100 10 5 5 0 000-10zm0 2.2a2.8 2.8 0 110 5.6 2.8 2.8 0 010-5.6zM18 6.5a1 1 0 110 2 1 1 0 010-2z" />
                </svg>
              </span>
              <span role="link" tabIndex="0" aria-label="Twitter" title="Twitter" className="footer-social-link">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M23 3a10.9 10.9 0 01-3.14 1.53A4.48 4.48 0 0012 7.5v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
                </svg>
              </span>
            </div>
          </div>

          <div className="footer-section">
            <h4>For Couples</h4>
            <ul>
              <li><Link to="/premarital-counseling">Find Counselors</Link></li>
              <li><Link to="/therapists">Therapists</Link></li>
              <li><Link to="/coaches">Coaches</Link></li>
              <li><Link to="/clergy">Clergy</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>For Professionals</h4>
            <ul>
              <li><Link to="/claim-profile">Claim Profile</Link></li>
              <li><Link to="/features">Features</Link></li>
              <li><Link to="/support">Support</Link></li>
              <li><Link to="/guidelines">Guidelines</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Company</h4>
            <ul>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms of Service</Link></li>
              <li><Link to="/sitemap">Sitemap</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            © {currentYear} Premarital Counseling Directory. All rights reserved.
            Helping couples build stronger relationships through professional guidance.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
