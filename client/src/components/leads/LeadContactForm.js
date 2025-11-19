import React, { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

const LeadContactForm = ({ profileId, professionalName, profile, isProfileClaimed = true, onSuccess }) => {
  const [formData, setFormData] = useState({
    couple_name: '',
    couple_email: '',
    couple_phone: '',
    wedding_date: '',
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

    if (!formData.couple_name || !formData.couple_email || !formData.message) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Determine lead status based on profile claim status
      const leadStatus = isProfileClaimed ? 'new' : 'pending_claim'

      // Save lead to database
      const { data: leadData, error: leadError } = await supabase
        .from('profile_leads')
        .insert([{
          profile_id: profileId,
          couple_name: formData.couple_name,
          couple_email: formData.couple_email,
          couple_phone: formData.couple_phone,
          wedding_date: formData.wedding_date || null,
          location: formData.location,
          message: formData.message,
          source: formData.source,
          status: leadStatus
        }])
        .select()

      if (leadError) throw leadError

      // Send email notification based on claim status
      try {
        if (isProfileClaimed) {
          // Standard notification for claimed profiles
          await supabase.functions.invoke('send-lead-notification', {
            body: {
              leadId: leadData[0].id,
              profileId: profileId,
              coupleData: {
                name: formData.couple_name,
                email: formData.couple_email,
                phone: formData.couple_phone,
                wedding_date: formData.wedding_date,
                location: formData.location,
                message: formData.message
              }
            }
          })
        } else {
          // Trojan horse email for UNCLAIMED profiles
          await supabase.functions.invoke('email-unclaimed-profile-owner', {
            body: {
              profileEmail: profile?.email,
              professionalName: professionalName,
              coupleName: formData.couple_name,
              coupleEmail: formData.couple_email,
              coupleLocation: formData.location,
              city: profile?.city,
              state: profile?.state_province,
              claimUrl: `${window.location.origin} /claim-profile/${profile?.slug || profileId}?utm_source = email & utm_medium=lead_intercept & utm_campaign=claim_profile`,
              profileSlug: profile?.slug || profileId
            }
          })
        }
      } catch (emailError) {
        console.warn('Email notification failed:', emailError)
        // Don't fail the whole process if email fails
      }

      setSuccess(true)

      // Reset form
      setFormData({
        couple_name: '',
        couple_email: '',
        couple_phone: '',
        wedding_date: '',
        location: '',
        message: '',
        source: 'directory'
      })

      // Call success callback
      if (onSuccess) {
        onSuccess(leadData[0])
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
        <h3>Message Sent Successfully!</h3>
        <p>
          Thank you for reaching out. {professionalName} will receive your message
          and respond directly to your email address within 24-48 hours.
        </p>
        <div className="next-steps">
          <h4>What happens next?</h4>
          <ul>
            <li>
              <i className="fa fa-envelope" aria-hidden="true"></i>
              {professionalName} will review your message and respond via email
            </li>
            <li>
              <i className="fa fa-phone" aria-hidden="true"></i>
              You may receive a phone call if you provided your number
            </li>
            <li>
              <i className="fa fa-calendar" aria-hidden="true"></i>
              They'll likely suggest scheduling an initial consultation
            </li>
          </ul>
        </div>
        <button
          className="btn btn-outline"
          onClick={() => setSuccess(false)}
        >
          Send Another Message
        </button>
      </div>
    )
  }

  return (
    <div className="lead-contact-form">
      <div className="form-header">
        <h3>Contact {professionalName}</h3>
        <p>Send a message to get started with your premarital counseling journey</p>
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
            <label htmlFor="couple_name">Your Names *</label>
            <input
              type="text"
              id="couple_name"
              name="couple_name"
              value={formData.couple_name}
              onChange={handleInputChange}
              placeholder="John & Jane Smith"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="couple_email">Email Address *</label>
            <input
              type="email"
              id="couple_email"
              name="couple_email"
              value={formData.couple_email}
              onChange={handleInputChange}
              placeholder="your.email@example.com"
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="couple_phone">Phone Number</label>
            <input
              type="tel"
              id="couple_phone"
              name="couple_phone"
              value={formData.couple_phone}
              onChange={handleInputChange}
              placeholder="(555) 123-4567"
            />
          </div>

          <div className="form-group">
            <label htmlFor="wedding_date">Wedding Date</label>
            <input
              type="date"
              id="wedding_date"
              name="wedding_date"
              value={formData.wedding_date}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="location">Your Location</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            placeholder="Austin, Texas"
          />
        </div>

        <div className="form-group">
          <label htmlFor="message">Message *</label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleInputChange}
            placeholder="Tell us about yourselves, your relationship goals, and what you're looking for in premarital counseling..."
            rows={4}
            required
          />
          <small>Share your story, timeline, and any specific areas you'd like to focus on</small>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fa fa-spinner fa-spin" aria-hidden="true"></i>
                Sending Message...
              </>
            ) : (
              <>
                <i className="fa fa-paper-plane" aria-hidden="true"></i>
                Send Message
              </>
            )}
          </button>
        </div>

        <div className="contact-disclaimer">
          <small>
            <i className="fa fa-shield-alt" aria-hidden="true"></i>
            Your information is secure and will only be shared with the professional you're contacting.
            By submitting this form, you agree to our <a href="/privacy">Privacy Policy</a>.
          </small>
        </div>
      </form>
    </div>
  )
}

export default LeadContactForm