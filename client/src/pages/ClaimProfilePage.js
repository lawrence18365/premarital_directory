import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import SEOHelmet from '../components/analytics/SEOHelmet'
import '../assets/css/claim-wizard.css'

import { profileOperations } from '../lib/supabaseClient'
import { sendClaimSubmittedEmail } from '../lib/emailNotifications'

const ClaimProfilePage = () => {
  const { id } = useParams() // Optional - for claiming specific profile
  const navigate = useNavigate()
  const [existingProfile, setExistingProfile] = useState(null)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    website: '',
    bio: '',
    profession: '',
    specialties: [],
    address_line1: '',
    city: '',
    state_province: '',
    postal_code: '',
    country: 'United States',
    keep_listed: 'yes'
  })
  const [currentStep, setCurrentStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkingDuplicate, setCheckingDuplicate] = useState(false)

  useEffect(() => {
    if (id) {
      loadExistingProfile()
    }
  }, [id])

  const loadExistingProfile = async () => {
    try {
      const { data, error } = await profileOperations.getProfile(id)
      if (data && !error) {
        setExistingProfile(data)
        setFormData({
          full_name: data.full_name || '',
          email: data.email || '',
          phone: data.phone || '',
          website: data.website || '',
          bio: data.bio || '',
          profession: data.profession || '',
          specialties: data.specialties || [],
          address_line1: data.address_line1 || '',
          city: data.city || '',
          state_province: data.state_province || '',
          postal_code: data.postal_code || '',
          country: data.country || 'United States'
        })
      }
    } catch (err) {
      console.error('Error loading profile:', err)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSpecialtyToggle = (specialty) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }))
  }

  // Validate current step before proceeding
  const validateStep = (step) => {
    setError('')

    if (step === 1) {
      if (!formData.full_name || !formData.full_name.trim()) {
        setError('Please enter your full name')
        return false
      }
      if (!formData.profession) {
        setError('Please select your profession')
        return false
      }
      if (!formData.email || !formData.email.trim()) {
        setError('Please enter your email address')
        return false
      }
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address')
        return false
      }
    }

    if (step === 3) {
      if (!formData.city || !formData.city.trim()) {
        setError('Please enter your city')
        return false
      }
      if (!formData.state_province || !formData.state_province.trim()) {
        setError('Please enter your state/province')
        return false
      }
    }

    return true
  }

  // Check for duplicate claims
  const checkDuplicateClaim = async () => {
    if (!existingProfile || !formData.email) return true

    setCheckingDuplicate(true)

    try {
      const { data, error } = await profileOperations.checkDuplicateClaim(
        existingProfile.id,
        formData.email
      )

      if (error) {
        console.error('Error checking duplicate:', error)
        return true // Allow submission if check fails
      }

      if (data && data.length > 0) {
        setError('You have already submitted a claim for this profile. Please check your email for updates.')
        return false
      }

      return true
    } catch (err) {
      console.error('Error checking duplicate:', err)
      return true // Allow submission if check fails
    } finally {
      setCheckingDuplicate(false)
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    setError('')
    setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('')

    // Validate final step
    if (!validateStep(3)) {
      return
    }

    // Check for duplicates
    const isDuplicateOk = await checkDuplicateClaim()
    if (!isDuplicateOk) {
      return
    }

    setLoading(true);

    try {
      if (existingProfile) {
        // Claiming existing profile
        const claimData = {
          profile_id: existingProfile.id,
          submitted_by_email: formData.email.trim(),
          claim_data: formData,
          status: 'pending',
        };

        const { data, error } = await profileOperations.createProfileClaim(claimData);

        if (error) {
          throw error;
        }
      } else {
        // Creating new profile via claim system
        const claimData = {
          profile_id: null, // No existing profile
          submitted_by_email: formData.email.trim(),
          claim_data: {
            ...formData,
            tier: 'community',
            is_claimed: false
          },
          status: 'pending'
        };

        const { data, error } = await profileOperations.createProfileClaim(claimData);

        if (error) {
          throw error;
        }
      }

      // Send confirmation email (non-blocking)
      try {
        await sendClaimSubmittedEmail(formData.email.trim(), formData)
      } catch (emailError) {
        console.error('Email notification failed:', emailError)
        // Don't block success on email failure
      }

      // Show success page
      setSubmitted(true);
      setLoading(false);

    } catch (err) {
      console.error('Error submitting:', err);
      setLoading(false);

      // Handle specific error types
      if (err.code === '23505') {
        setError('A claim with this email already exists. Please check your inbox for confirmation.')
      } else if (err.code === '23503') {
        setError('Profile not found. Please contact support at hello@weddingcounselors.com')
      } else if (err.message?.includes('JWT')) {
        setError('Session expired. Please refresh the page and try again.')
      } else if (err.message) {
        setError(`Unable to submit: ${err.message}`)
      } else {
        setError('There was an error submitting your claim. Please try again or contact support.')
      }
    }
  };

  const professionOptions = [
    'Licensed Therapist',
    'Marriage & Family Therapist',
    'Licensed Clinical Social Worker',
    'Relationship Coach',
    'Life Coach',
    'Clergy/Pastor',
    'Chaplain',
    'Counselor'
  ]

  const specialtyOptions = [
    'Communication Skills',
    'Conflict Resolution',
    'Financial Planning',
    'Intimacy & Sexuality',
    'Family Planning',
    'Religious Counseling',
    'Emotional Intelligence',
    'Pre-Cana',
    'Christian Counseling',
    'Gottman Method',
    'EFT (Emotionally Focused Therapy)',
    'Prepare/Enrich',
    'SYMBIS Assessment',
    'Blended Families',
    'Interfaith Relationships',
    'LGBTQ+ Affirming',
    'Multicultural Counseling'
  ]

  if (submitted) {
    return (
      <div className="container" style={{ padding: 'var(--space-20) 0' }}>
        <SEOHelmet
          title="Profile Submitted - Wedding Counselors"
          description="Thanks for sending in your profile. Our team will follow up shortly."
          url="/claim-profile"
        />
        <div className="claim-wizard">
          <div className="claim-wizard__success">
            <div className="claim-wizard__success-icon">
              <i className="fa fa-check-circle" aria-hidden="true"></i>
            </div>
            <p className="section-eyebrow">Next steps</p>
            <h2>{existingProfile ? 'Claim submitted!' : 'Profile received!'}</h2>
            <p>
              {existingProfile
                ? 'Our team will review your claim within 1–2 business days and email you at '
                : 'We’re reviewing your details and will email updates to '}
              <strong>{formData.email}</strong>.
            </p>
            <div className="claim-wizard__success-note">
              <h4>What happens now?</h4>
              <ul>
                <li>We verify your information manually.</li>
                <li>You’ll get an approval email with login instructions.</li>
                <li>Once live, you can edit your listing anytime.</li>
              </ul>
            </div>
            <a href="/" className="btn btn-primary btn-large">Return to Directory</a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{ padding: 'var(--space-12) 0' }}>
      <SEOHelmet
        title={existingProfile ? 'Claim Your Profile' : 'Join Our Free Directory'}
        description={existingProfile ? 'Claim your profile to connect with couples seeking premarital counseling.' : 'Join our free directory and connect with engaged couples seeking premarital counseling.'}
        url="/claim-profile"
      />
      <div className="claim-wizard">
        <section className="claim-wizard__hero">
          <p className="section-eyebrow">Professional onboarding</p>
          <h1>{existingProfile ? 'Claim Your Profile' : 'Create Your Free Profile'}</h1>
          <p className="claim-wizard__hero-subtitle">
            {existingProfile
              ? 'Verify and manage your listing so engaged couples can contact you directly.'
              : 'List your premarital counseling services, highlight specialties, and start receiving direct inquiries.'
            }
          </p>
        </section>

        {existingProfile && (
          <section className="claim-wizard__profile-preview">
            <p className="section-eyebrow">Is this you?</p>
            <div className="claim-wizard__profile-card">
              <div>
                <h3>{existingProfile.full_name}</h3>
                <p>{existingProfile.profession}</p>
                <p className="claim-wizard__profile-location">{existingProfile.city}, {existingProfile.state_province}</p>
              </div>
            </div>
          </section>
        )}

        <div className="claim-wizard__steps">
          {[1, 2, 3].map(step => (
            <div key={step} className={`claim-wizard__step ${currentStep >= step ? 'is-complete' : ''}`}>
              <div className="claim-wizard__step-number">{step}</div>
              <span className="claim-wizard__step-label">
                {step === 1 && 'Basics'}
                {step === 2 && 'Professional Details'}
                {step === 3 && 'Location'}
              </span>
            </div>
          ))}
        </div>

        {error && (
          <div className="claim-wizard__alert">
            <i className="fa fa-exclamation-circle" aria-hidden="true"></i>
            <span>{error}</span>
          </div>
        )}

        <div className="claim-wizard__card">
          <form onSubmit={handleSubmit}>
            {currentStep === 1 && (
              <div className="claim-wizard__fieldset">
                <h2>Basic Information</h2>
                <p className="claim-wizard__fieldset-subtitle">Tell us who you are and how couples can reach you.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label htmlFor="full_name">Full Name *</label>
                    <input
                      type="text"
                      id="full_name"
                      className="form-control"
                      required
                      value={formData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="profession">Profession *</label>
                    <select
                      id="profession"
                      className="form-control"
                      required
                      value={formData.profession}
                      onChange={(e) => handleInputChange('profession', e.target.value)}
                    >
                      <option value="">Select profession...</option>
                      {professionOptions.map(profession => (
                        <option key={profession} value={profession}>{profession}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label htmlFor="email">Email *</label>
                    <input
                      type="email"
                      id="email"
                      className="form-control"
                      required
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">Phone</label>
                    <input
                      type="tel"
                      id="phone"
                      className="form-control"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="website">Website</label>
                  <input
                    type="url"
                    id="website"
                    className="form-control"
                    placeholder="https://yourwebsite.com"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="claim-wizard__fieldset">
                <h2>Professional Details</h2>
                <p className="claim-wizard__fieldset-subtitle">Share your approach, specialties, and what makes you a great fit.</p>
                <div className="form-group">
                  <label htmlFor="bio">Professional Bio</label>
                  <textarea
                    id="bio"
                    className="form-control"
                    rows="5"
                    placeholder="Tell couples about your background, approach, and what makes you unique..."
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Specialties & Areas of Expertise</label>
                  <p className="text-small text-muted mb-4">
                    Select all that apply to help couples find the right fit.
                  </p>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: 'var(--space-3)'
                  }}>
                    {specialtyOptions.map(specialty => (
                      <label key={specialty} style={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        padding: 'var(--space-2)',
                        borderRadius: 'var(--radius-md)',
                        transition: 'background-color var(--transition-normal)'
                      }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--gray-50)'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        <input
                          type="checkbox"
                          checked={formData.specialties.includes(specialty)}
                          onChange={() => handleSpecialtyToggle(specialty)}
                          style={{ marginRight: 'var(--space-2)' }}
                        />
                        {specialty}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="claim-wizard__fieldset">
                <h2>Practice Location</h2>
                <p className="claim-wizard__fieldset-subtitle">Let couples know where you serve so we can place you in the right directories.</p>
                <div className="form-group">
                  <label htmlFor="address_line1">Address</label>
                  <input
                    type="text"
                    id="address_line1"
                    className="form-control"
                    value={formData.address_line1}
                    onChange={(e) => handleInputChange('address_line1', e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 150px', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label htmlFor="city">City *</label>
                    <input
                      type="text"
                      id="city"
                      className="form-control"
                      required
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="state_province">State/Province *</label>
                    <input
                      type="text"
                      id="state_province"
                      className="form-control"
                      required
                      value={formData.state_province}
                      onChange={(e) => handleInputChange('state_province', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="postal_code">ZIP Code</label>
                    <input
                      type="text"
                      id="postal_code"
                      className="form-control"
                      value={formData.postal_code}
                      onChange={(e) => handleInputChange('postal_code', e.target.value)}
                    />
                  </div>
                </div>

                {/* Only show listing preferences if claiming existing profile */}
                {existingProfile && (
                  <div style={{ marginTop: 'var(--space-8)', padding: 'var(--space-6)', background: 'var(--neutral-light)', borderRadius: 'var(--radius-xl)' }}>
                    <h3 style={{ marginBottom: 'var(--space-4)' }}>Listing Preferences</h3>

                    <div className="form-group">
                      <label style={{ fontWeight: 'var(--font-weight-semibold)', display: 'block', marginBottom: 'var(--space-2)' }}>
                        Do you want to keep this listing active?
                      </label>
                      <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="keep_listed"
                            value="yes"
                            checked={formData.keep_listed === 'yes'}
                            onChange={(e) => handleInputChange('keep_listed', e.target.value)}
                          />
                          <span>Yes, keep my listing active</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="keep_listed"
                            value="no"
                            checked={formData.keep_listed === 'no'}
                            onChange={(e) => handleInputChange('keep_listed', e.target.value)}
                          />
                          <span>No, please remove my listing</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="claim-wizard__button-row">
              {currentStep > 1 ? (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handlePrevious}
                  disabled={loading || checkingDuplicate}
                >
                  Previous
                </button>
              ) : (
                <span />
              )}

              {currentStep < 3 ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleNext}
                  disabled={loading}
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || checkingDuplicate}
                >
                  {checkingDuplicate ? 'Checking…' : loading ? 'Submitting…' : 'Submit Profile Claim'}
                </button>
              )}
            </div>
          </form>
        </div>

        <section className="claim-wizard__benefits">
          <h3>Why join our directory?</h3>
          <div className="claim-wizard__benefits-grid">
            <div>
              <h4>Targeted exposure</h4>
              <p>Connect with couples actively searching for premarital counseling.</p>
            </div>
            <div>
              <h4>Direct leads</h4>
              <p>Couples email or call you directly—no referral fees or middlemen.</p>
            </div>
            <div>
              <h4>Professional credibility</h4>
              <p>Verified profiles give engaged couples confidence in your services.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default ClaimProfilePage
