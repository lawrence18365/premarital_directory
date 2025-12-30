import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import SEOHelmet from '../components/analytics/SEOHelmet'
import { supabase } from '../lib/supabaseClient'

const ContactPage = () => {
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    type: 'general'
  })
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      // Call the SMTP2GO contact email function
      const { error } = await supabase.functions.invoke('send-contact-email', {
        body: {
          name: contactForm.name,
          email: contactForm.email,
          subject: contactForm.subject,
          message: contactForm.message,
          type: contactForm.type
        }
      })

      if (error) {
        throw error
      }

      setSubmitted(true)
      setTimeout(() => {
        setSubmitted(false)
        setContactForm({
          name: '',
          email: '',
          subject: '',
          message: '',
          type: 'general'
        })
      }, 5000)

    } catch (err) {
      console.error('Contact form submission error:', err)
      setError('Failed to send message. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field, value) => {
    setContactForm(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div style={{ padding: 'var(--space-20) 0', background: 'var(--gray-50)' }}>
      <SEOHelmet 
        title="Contact Us - Premarital Counseling Directory"
        description="Get in touch with our team. We help couples find qualified premarital counselors and support professionals in growing their practice."
        url="/contact"
        keywords="contact, premarital counseling, customer support, help"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'ContactPage',
          name: 'Contact Us',
          description: 'Get in touch with our team for support and inquiries'
        }}
      />
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-16)' }}>
          <h1>Contact Us</h1>
          <p className="text-large text-secondary">
            We're here to help couples and professionals connect
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-12)', maxWidth: '1000px', margin: '0 auto' }}>
          {/* Contact Form */}
          <div style={{ 
            background: 'var(--white)', 
            padding: 'var(--space-8)', 
            borderRadius: 'var(--radius-2xl)',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--gray-200)'
          }}>
            <h2>Send Us a Message</h2>
            
            {error && (
              <div style={{ 
                background: 'var(--error)',
                backgroundImage: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                color: 'var(--white)', 
                padding: 'var(--space-4)', 
                borderRadius: 'var(--radius-lg)',
                textAlign: 'center',
                marginTop: 'var(--space-4)'
              }}>
                <strong>Error:</strong> {error}
              </div>
            )}

            {submitted ? (
              <div style={{ 
                background: 'var(--success)',
                backgroundImage: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: 'var(--white)', 
                padding: 'var(--space-4)', 
                borderRadius: 'var(--radius-lg)',
                textAlign: 'center',
                marginTop: 'var(--space-4)'
              }}>
                <strong>Message Sent!</strong><br />
                We'll get back to you within 24 hours.
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ marginTop: 'var(--space-4)' }}>
                <div className="form-group">
                  <label htmlFor="contact-type">I am a...</label>
                  <select
                    id="contact-type"
                    className="form-control"
                    value={contactForm.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                  >
                    <option value="general">General Inquiry</option>
                    <option value="couple">Couple Seeking Counseling</option>
                    <option value="professional">Mental Health Professional</option>
                    <option value="support">Technical Support</option>
                    <option value="partnership">Partnership Opportunity</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label htmlFor="contact-name">Name *</label>
                    <input
                      type="text"
                      id="contact-name"
                      className="form-control"
                      required
                      value={contactForm.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="contact-email">Email *</label>
                    <input
                      type="email"
                      id="contact-email"
                      className="form-control"
                      required
                      value={contactForm.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="contact-subject">Subject *</label>
                  <input
                    type="text"
                    id="contact-subject"
                    className="form-control"
                    required
                    placeholder="What can we help you with?"
                    value={contactForm.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contact-message">Message *</label>
                  <textarea
                    id="contact-message"
                    className="form-control"
                    rows="5"
                    placeholder="Please provide details about your inquiry..."
                    required
                    value={contactForm.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>

          {/* Contact Information */}
          <div>
            <div style={{ 
              background: 'var(--white)', 
              padding: 'var(--space-8)', 
              borderRadius: 'var(--radius-2xl)',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--gray-200)',
              marginBottom: 'var(--space-6)'
            }}>
              <h3>Get in Touch</h3>
              <div style={{ marginTop: 'var(--space-4)' }}>
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <h5>For Couples</h5>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-600)' }}>
                    Need help finding the right counselor? We're here to guide you to the 
                    perfect professional for your relationship needs.
                  </p>
                </div>
                
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <h5>For Professionals</h5>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-600)' }}>
                    Interested in joining our directory? Learn about our verification 
                    process and how to maximize your profile visibility.
                  </p>
                </div>

                <div>
                  <h5>Technical Support</h5>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-600)' }}>
                    Having trouble with the platform? Our technical team is ready 
                    to help you navigate any issues.
                  </p>
                </div>
              </div>
            </div>

            <div style={{ 
              background: 'var(--white)', 
              padding: 'var(--space-8)', 
              borderRadius: 'var(--radius-2xl)',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--gray-200)'
            }}>
              <h3>Frequently Asked Questions</h3>
              <div style={{ marginTop: 'var(--space-4)' }}>
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <h6>How do I find the right counselor?</h6>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-600)' }}>
                    Use our search filters to find professionals by location, specialty, 
                    and approach. Read their profiles to understand their methods.
                  </p>
                </div>
                
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <h6>Are all professionals verified?</h6>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-600)' }}>
                    Yes, we verify all professional credentials before listing counselors 
                    in our directory.
                  </p>
                </div>

                <div>
                  <h6>How much does counseling cost?</h6>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-600)' }}>
                    Costs vary by professional and location. Contact counselors directly 
                    for pricing information and insurance acceptance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div style={{ textAlign: 'center', marginTop: 'var(--space-16)' }}>
          <h2>Ready to Get Started?</h2>
          <p className="text-large text-secondary mb-8">
            Browse our directory or join as a professional
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/" className="btn btn-primary btn-large">
              Find Counselors
            </Link>
            <Link to="/claim-profile" className="btn btn-secondary btn-large">
              Join Directory
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContactPage