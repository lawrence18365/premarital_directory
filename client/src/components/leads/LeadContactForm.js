import React, { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { trackContactSubmission } from '../analytics/GoogleAnalytics'
import { trackFacebookLead } from '../analytics/FacebookPixel'
import { trackProfessionalContact } from '../analytics/GoogleAds'
import { getAttribution, getSourceLabel } from '../../lib/attribution'

const LeadContactForm = ({ profileId, professionalName, profile, isProfileClaimed = true, isStateMatching, isSpecialtyMatching, isDiscountMatching, stateName, specialtyType, onSuccess }) => {
  const shortName = professionalName?.split(' ')[0] || 'this professional'
  const [formData, setFormData] = useState({
    partner_one_name: '',
    partner_two_name: '',
    couple_email: '',
    couple_phone: '',
    wedding_date: '',
    timeline: '',
    location: '',
    message: '',
    source: 'directory'
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.partner_one_name || !formData.couple_email || !formData.message) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)
    setError('')

    try {
      // ATOMIC LEAD INSERTION & NOTIFICATION
      // By calling a single Edge Function, we guarantee the lead won't be saved without being emailed.
      const attribution = getAttribution()
      const payload = {
        profileId,
        professionalName,
        isProfileClaimed,
        isSpecialtyMatching,
        isDiscountMatching,
        isStateMatching,
        specialtyType,
        stateName,
        source: getSourceLabel(),
        source_page: window.location.pathname,
        attribution,
        coupleData: {
          partner_one_name: formData.partner_one_name,
          partner_two_name: formData.partner_two_name,
          email: formData.couple_email,
          phone: formData.couple_phone,
          wedding_date: formData.wedding_date || undefined,
          timeline: formData.timeline || undefined,
          location: formData.location || undefined,
          message: formData.message
        }
      }

      const { data, error: functionError } = await supabase.functions.invoke('process-lead-submission', {
        body: payload
      })

      if (functionError) {
        console.error('Edge Function failed:', functionError)
        throw new Error('Failed to send your message. Please try again.')
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to send your message.')
      }

      setSuccess(true)

      // Fire conversion tracking events
      trackContactSubmission(professionalName, 'contact_form')
      trackFacebookLead(professionalName)
      trackProfessionalContact(professionalName)

      // Call success callback with returned lead data
      if (onSuccess && data?.lead) {
        onSuccess(data.lead)
      }

      // Auto-hide success message
      setTimeout(() => setSuccess(false), 5000)

    } catch (error) {
      console.error('Error submitting lead:', error)
      setError('Failed to send your message. Please try again.')
    }

    setLoading(false)
  }

  if (success) {
    return (
      <div className="contact-success">
        <div className="success-icon">
          <i className="fa fa-check-circle" aria-hidden="true"></i>
        </div>
        <h3>Message sent</h3>
        <p>
          Your message was delivered to {shortName}. Most professionals reply within 1-2 business days.
          If you do not hear back, contact another counselor in your city.
        </p>
        <button
          className="btn btn-outline"
          onClick={() => setSuccess(false)}
        >
          Send another message
        </button>
      </div>
    )
  }

  return (
    <div className="lead-contact-form">
      <div className="form-header">
        <h3>Contact {shortName}</h3>
        <p>Share your details and what you need help with.</p>
      </div>

      {error && (
        <div className="error-message">
          <i className="fa fa-exclamation-circle" aria-hidden="true"></i>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="partner_one_name">Partner 1 *</label>
            <input
              type="text"
              id="partner_one_name"
              name="partner_one_name"
              value={formData.partner_one_name}
              onChange={handleInputChange}
              placeholder="First partner name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="partner_two_name">Partner 2 (optional)</label>
            <input
              type="text"
              id="partner_two_name"
              name="partner_two_name"
              value={formData.partner_two_name}
              onChange={handleInputChange}
              placeholder="Second partner name"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="couple_email">Email Address *</label>
          <input
            type="email"
            id="couple_email"
            name="couple_email"
            value={formData.couple_email}
            onChange={handleInputChange}
            placeholder="Email address"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="message">Message *</label>
          {!formData.message && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              marginBottom: '8px'
            }}>
              {[
                "We're engaged and exploring premarital counseling options.",
                "We'd like to learn about your availability and pricing.",
                "We're interested in premarital counseling before our wedding.",
              ].map((template) => (
                <button
                  key={template}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, message: template }))}
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.8rem',
                    background: 'var(--gray-100, #f3f4f6)',
                    border: '1px solid var(--gray-300, #d1d5db)',
                    borderRadius: '999px',
                    cursor: 'pointer',
                    color: 'var(--gray-700, #374151)',
                    lineHeight: 1.4,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {template}
                </button>
              ))}
            </div>
          )}
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleInputChange}
            placeholder="Or write your own message..."
            rows={3}
            required
          />
        </div>

        <details className="lead-contact-form-optional">
          <summary>Optional details</summary>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="couple_phone">Phone Number (optional)</label>
              <input
                type="tel"
                id="couple_phone"
                name="couple_phone"
                value={formData.couple_phone}
                onChange={handleInputChange}
                placeholder="Phone number"
              />
            </div>

            <div className="form-group">
              <label htmlFor="wedding_date">Wedding Date (optional)</label>
              <input
                type="date"
                id="wedding_date"
                name="wedding_date"
                value={formData.wedding_date}
                onChange={handleInputChange}
              />
              <small>Month and year are fine if your date is not final.</small>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="location">Your Location (optional)</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="City, state"
            />
          </div>

          <div className="form-group">
            <label htmlFor="timeline">Timeline (optional)</label>
            <select
              id="timeline"
              name="timeline"
              value={formData.timeline}
              onChange={handleInputChange}
            >
              <option value="">Select timeline</option>
              <option value="ASAP">ASAP</option>
              <option value="1-3 months">1-3 months</option>
              <option value="3-6 months">3-6 months</option>
              <option value="6+ months">6+ months</option>
            </select>
          </div>
        </details>

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fa fa-spinner fa-spin" aria-hidden="true"></i>
                Sending...
              </>
            ) : (
              <>
                <i className="fa fa-paper-plane" aria-hidden="true"></i>
                Send message
              </>
            )}
          </button>
        </div>

        <div className="contact-disclaimer">
          <small>
            <i className="fa fa-shield-alt" aria-hidden="true"></i>
            Sent only to this professional. No spam or list sharing. By sending, you agree to our <a href="/privacy">Privacy Policy</a>.
          </small>
        </div>
      </form>
    </div>
  )
}

export default LeadContactForm
