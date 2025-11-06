import React from 'react'
import { Link } from 'react-router-dom'
import SEOHelmet from '../components/analytics/SEOHelmet'

const ThankYouPage = () => {
  return (
    <div className="container" style={{ padding: 'var(--space-16) 0', textAlign: 'center' }}>
      <SEOHelmet 
        title="Thank You"
        description="Thanks for getting in touch. We’ll reply shortly."
      />
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--teal)' }}>Thank You</h1>
      <p className="lead" style={{ margin: 'var(--space-4) 0 var(--space-8)' }}>
        Your submission was received. We typically respond within 1 business day.
      </p>
      <div style={{ marginBottom: 'var(--space-12)' }}>
        <Link className="btn btn-primary btn-large" to="/">Back to Home</Link>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--teal)', marginBottom: 'var(--space-8)' }}>While you wait, here are some popular resources:</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-8)' }}>
          <div style={{ background: 'var(--white)', padding: 'var(--space-8)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--teal)' }}>Explore Our Blog</h3>
            <p style={{ marginBottom: 'var(--space-4)' }}>Read articles on communication, finances, and more.</p>
            <Link to="/blog" className="btn btn-secondary">Read Now</Link>
          </div>
          <div style={{ background: 'var(--white)', padding: 'var(--space-8)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--teal)' }}>Browse Counselors</h3>
            <p style={{ marginBottom: 'var(--space-4)' }}>Find the perfect premarital counselor for you.</p>
            <Link to="/" className="btn btn-secondary">Browse Now</Link>
          </div>
          <div style={{ background: 'var(--white)', padding: 'var(--space-8)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--teal)' }}>Learn About Us</h3>
            <p style={{ marginBottom: 'var(--space-4)' }}>Discover our mission and how we can help you.</p>
            <Link to="/about" className="btn btn-secondary">Learn More</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ThankYouPage