import React, { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import '../../assets/css/concierge-form.css'

const ConciergeLeadForm = ({ isOpen, onClose, defaultLocation = '', sourceUrl = '' }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        timeline: '',
        preference: 'Not Sure',
        message: ''
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.name || !formData.email) {
            setError('Name and email are required.')
            return
        }

        setLoading(true)
        setError('')

        try {
            // Typically the location passed down is "Dallas, TX" or similar.
            // We will blindly try to split it into a city and state for the schema, or just shove the whole thing into city.
            const locationParts = defaultLocation.split(',').map(s => s.trim())
            const city = locationParts[0] || defaultLocation
            const state = locationParts[1] || ''

            const payload = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone || undefined,
                timeline: formData.timeline || undefined,
                preference: formData.preference || undefined,
                message: formData.message,
                city: city,
                state: state,
                sourceUrl: sourceUrl || window.location.href
            }

            const { data, error: functionError } = await supabase.functions.invoke('process-concierge-lead', {
                body: payload
            })

            if (functionError) {
                console.error('Edge function error:', functionError)
                throw new Error('Failed to process your request. Please try again or contact support.')
            }

            if (!data?.success) {
                throw new Error(data?.error || 'Failed to submit the matchmaking request.')
            }

            setSuccess(true)

            // Reset form (optional, could just leave success message displayed)
            setFormData({
                name: '',
                email: '',
                phone: '',
                timeline: '',
                preference: 'Not Sure',
                message: ''
            })

            // Auto close after 5 seconds on success
            setTimeout(() => {
                onClose()
                setSuccess(false)
            }, 5000)

        } catch (err) {
            console.error('Submission error:', err)
            setError(err.message || 'An unexpected error occurred. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="concierge-modal-overlay" onClick={onClose}>
            <div className="concierge-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="concierge-modal-close" onClick={onClose} aria-label="Close modal">
                    &times;
                </button>

                {success ? (
                    <div className="concierge-success-state">
                        <div className="concierge-success-icon">
                            <i className="fa fa-check-circle"></i>
                        </div>
                        <h3>Request Received!</h3>
                        <p>
                            Thank you! Our matchmaker is reviewing your needs and will connect you with a qualified premarital counselor in {defaultLocation ? defaultLocation : 'your area'} shortly.
                        </p>
                        <p className="concierge-success-subtext">Check your email within 24 hours.</p>
                        <button className="btn btn-outline" onClick={onClose} style={{ marginTop: '20px' }}>
                            Close
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="concierge-modal-header">
                            <h3>Get Matched with a Counselor</h3>
                            <p>Tell us what you're looking for, and we'll connect you with a verified premarital counselor {defaultLocation ? `in ${defaultLocation}` : 'near you'}.</p>
                        </div>

                        {error && (
                            <div className="concierge-error-message">
                                <i className="fa fa-exclamation-triangle"></i>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="concierge-form">
                            <div className="form-group">
                                <label htmlFor="concierge_preference">What type of counselor do you prefer?</label>
                                <select
                                    id="concierge_preference"
                                    name="preference"
                                    value={formData.preference}
                                    onChange={handleInputChange}
                                >
                                    <option value="Not Sure">Not Sure / Open</option>
                                    <option value="Standard Licensed Therapist">Licensed Therapist (Non-religious)</option>
                                    <option value="Christian/Faith-Based">Christian / Faith-Based</option>
                                    <option value="LGBTQ+ Affirming">LGBTQ+ Affirming</option>
                                    <option value="Gottman Method trained">Gottman Method trained</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="concierge_timeline">When do you want to start?</label>
                                <select
                                    id="concierge_timeline"
                                    name="timeline"
                                    value={formData.timeline}
                                    onChange={handleInputChange}
                                >
                                    <option value="">Select a timeline</option>
                                    <option value="ASAP">As soon as possible</option>
                                    <option value="Within 1 month">Within a month</option>
                                    <option value="1-3 months">1-3 months</option>
                                    <option value="Just browsing">Just browsing for later</option>
                                </select>
                            </div>

                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div className="form-group">
                                    <label htmlFor="concierge_name">Your Name *</label>
                                    <input
                                        type="text"
                                        id="concierge_name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Jane & John"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="concierge_email">Email Address *</label>
                                    <input
                                        type="email"
                                        id="concierge_email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="you@email.com"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="concierge_phone">Phone Number (optional)</label>
                                <input
                                    type="tel"
                                    id="concierge_phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder="(555) 123-4567"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="concierge_message">Any specific goals or needs? (optional)</label>
                                <textarea
                                    id="concierge_message"
                                    name="message"
                                    value={formData.message}
                                    onChange={handleInputChange}
                                    rows={3}
                                    placeholder="e.g. We want to work on communication and finances."
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary btn-large concierge-submit"
                                disabled={loading}
                            >
                                {loading ? 'Submitting...' : 'Find My Counselor'}
                            </button>

                            <p className="concierge-privacy-note">
                                Your information is 100% secure. We only share this with 1-3 counselors who meet your criteria.
                            </p>
                        </form>
                    </>
                )}
            </div>
        </div>
    )
}

export default ConciergeLeadForm
