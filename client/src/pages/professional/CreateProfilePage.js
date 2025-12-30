import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { profileOperations, supabase } from '../../lib/supabaseClient'
import { trackProfileClaim } from '../../components/analytics/GoogleAnalytics'
import SEOHelmet from '../../components/analytics/SEOHelmet'
import { STATE_CONFIG } from '../../data/locationConfig'
import { sendProfileCreatedEmail } from '../../lib/emailNotifications'
import '../../assets/css/professional-signup.css'

const CreateProfilePage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, refreshProfile } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 3 // Reduced from 4 for faster completion

  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    full_name: '',
    email: '',
    phone: '',
    website: '',
    profession: '',
    pronouns: '',

    // Step 2: Professional Details
    years_experience: '',
    credentials: [],
    education: '',
    bio: '',
    profile_intro: '', // NEW: Short 200-char hook
    intro_video_url: '', // NEW: YouTube/Vimeo link
    languages: [], // NEW: Languages spoken

    // Step 3: Services & Pricing
    offers_free_consultation: false,
    session_fee_min: '',
    session_fee_max: '',
    payment_methods: [],
    insurance_accepted: [],
    booking_url: '', // NEW: Calendly/Acuity link
    typical_sessions: '', // NEW: Program structure
    assessment_tools: [], // NEW: Prepare/Enrich, etc.

    // Step 4: Specialties & Availability
    specialties: [],
    treatment_approaches: [],
    client_focus: [],
    session_types: [],
    accepting_new_clients: true,
    approach_type: '', // NEW: Faith-based vs secular
    city: '',
    state_province: '',
    country: 'United States'
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [utmParams, setUtmParams] = useState({})
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [photoError, setPhotoError] = useState('')

  // Capture UTM parameters on load
  useEffect(() => {
    const params = {
      utm_source: searchParams.get('utm_source') || '',
      utm_medium: searchParams.get('utm_medium') || '',
      utm_campaign: searchParams.get('utm_campaign') || '',
      signup_source: searchParams.get('source') || 'organic'
    }
    setUtmParams(params)
  }, [searchParams])

  // Pre-fill email from auth
  useEffect(() => {
    if (user?.email) {
      setFormData(prev => ({ ...prev, email: user.email }))
    }
  }, [user])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setPhotoError('Please select a valid image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Image file must be smaller than 5MB')
      return
    }

    setPhotoFile(file)
    setPhotoError('')
    setError('')

    const reader = new FileReader()
    reader.onload = (e) => {
      setPhotoPreview(e.target.result)
    }
    reader.readAsDataURL(file)
  }

  const handlePhotoRemove = () => {
    setPhotoFile(null)
    setPhotoPreview('')
    setPhotoError('')
    setError('')
  }

  const handleArrayToggle = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }))
  }

  const generateSlug = (name, city, state) => {
    const baseSlug = `${name}-${city}-${state}`
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
    const timestamp = Date.now().toString(36)
    return `${baseSlug}-${timestamp}`
  }

  const getStateSlug = (stateName) => {
    for (const [slug, config] of Object.entries(STATE_CONFIG)) {
      if (config.name === stateName || config.abbr === stateName) {
        return slug
      }
    }
    return stateName.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '')
  }

  const getCitySlug = (cityName) => {
    return cityName.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '')
  }

  const validateStep = (step) => {
    setError('')

    if (step === 1) {
      // Essential fields - these determine where profile appears
      if (!formData.full_name.trim()) {
        setError('Please enter your full name')
        return false
      }
      if (!formData.profession) {
        setError('Please select your profession')
        return false
      }
      if (!formData.email.trim()) {
        setError('Please enter your email address')
        return false
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address')
        return false
      }
      // City/State moved to Step 1 - critical for SEO
      if (!formData.city.trim()) {
        setError('Please enter your city')
        return false
      }
      if (!formData.state_province.trim()) {
        setError('Please enter your state/province')
        return false
      }
      if (formData.session_types.length === 0) {
        setError('Please select at least one session type (in-person, online, or both)')
        return false
      }
      if (photoError) {
        setError(photoError)
        return false
      }
    }

    // Steps 2 and 3 are now optional - can be skipped
    // Validation only runs if user clicks "Continue" not "Skip"

    return true
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps))
    }
  }

  const handleSkip = () => {
    // Skip to next step without validation (for optional steps)
    setError('')
    setCurrentStep(prev => Math.min(prev + 1, totalSteps))
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (photoError) {
      setError(photoError)
      return
    }

    if (!validateStep(currentStep)) return

    if (!user) {
      setError('You must be logged in to create a profile')
      return
    }

    setLoading(true)
    setError('')

    try {
      const slug = generateSlug(formData.full_name, formData.city, formData.state_province)

      const profileData = {
        user_id: user.id,
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        website: formData.website.trim() || null,
        profession: formData.profession,
        pronouns: formData.pronouns || null,
        bio: formData.bio.trim() || null,
        years_experience: formData.years_experience ? parseInt(formData.years_experience) : null,
        credentials: formData.credentials.length > 0 ? formData.credentials : null,
        education: formData.education ? [formData.education] : null,
        offers_free_consultation: formData.offers_free_consultation,
        session_fee_min: formData.session_fee_min ? parseInt(formData.session_fee_min) * 100 : null, // Convert to cents
        session_fee_max: formData.session_fee_max ? parseInt(formData.session_fee_max) * 100 : null,
        pricing_range: formData.session_fee_min && formData.session_fee_max
          ? `$${formData.session_fee_min}-$${formData.session_fee_max}`
          : null,
        payment_methods: formData.payment_methods.length > 0 ? formData.payment_methods : null,
        insurance_accepted: formData.insurance_accepted.length > 0 ? formData.insurance_accepted : null,
        specialties: formData.specialties,
        treatment_approaches: formData.treatment_approaches.length > 0 ? formData.treatment_approaches : null,
        client_focus: formData.client_focus.length > 0 ? formData.client_focus : null,
        session_types: formData.session_types,
        accepting_new_clients: formData.accepting_new_clients,
        city: formData.city.trim(),
        state_province: formData.state_province.trim(),
        country: formData.country,
        slug: slug,
        is_claimed: true,
        claimed_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
        tier: 'community',
        contact_reveals_count: 0,
        // Attribution fields
        signup_source: utmParams.signup_source || 'organic',
        utm_source: utmParams.utm_source || null,
        utm_medium: utmParams.utm_medium || null,
        utm_campaign: utmParams.utm_campaign || null
      }

      const { data: profile, error: createError } = await profileOperations.createProfile(profileData)

      if (createError) {
        throw createError
      }

      let photoUploadError = null
      if (photoFile) {
        const { data: uploadData, error: uploadError } = await profileOperations.uploadPhoto(
          photoFile,
          profile.id
        )

        if (uploadError) {
          console.error('Photo upload failed:', uploadError)
          photoUploadError = 'We created your profile, but the photo upload failed.'
        } else {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ photo_url: uploadData.publicUrl })
            .eq('id', profile.id)

          if (updateError) {
            console.error('Photo URL update failed:', updateError)
            photoUploadError = 'We uploaded your photo, but could not attach it to your profile yet.'
          }
        }
      }

      trackProfileClaim(profile.id, 'self_service')
      await refreshProfile()

      const stateSlug = getStateSlug(formData.state_province)
      const citySlug = getCitySlug(formData.city)
      const profileUrl = `/premarital-counseling/${stateSlug}/${citySlug}/${slug}`
      const fullProfileUrl = `${window.location.origin}${profileUrl}`
      const dashboardUrl = window.location.origin

      // Send welcome email (non-blocking)
      try {
        await sendProfileCreatedEmail(
          formData.email.trim(),
          { full_name: formData.full_name },
          fullProfileUrl,
          dashboardUrl
        )
      } catch (emailError) {
        console.error('Welcome email failed:', emailError)
      }

      navigate('/professional/profile-created', {
        state: {
          profileUrl,
          profileId: profile.id,
          profileName: formData.full_name,
          photoUploadError
        }
      })

    } catch (err) {
      console.error('Error creating profile:', err)

      if (err.code === '23505') {
        setError('A profile with this email already exists. Please try logging in instead.')
      } else if (err.message) {
        setError(`Unable to create profile: ${err.message}`)
      } else {
        setError('There was an error creating your profile. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Options for dropdowns and multi-selects
  const professionOptions = [
    'Licensed Therapist',
    'Marriage & Family Therapist',
    'Licensed Clinical Social Worker',
    'Psychologist',
    'Relationship Coach',
    'Life Coach',
    'Clergy/Pastor',
    'Chaplain',
    'Counselor'
  ]

  const yearsExperienceOptions = [
    { value: '1', label: 'Less than 1 year' },
    { value: '2', label: '1-3 years' },
    { value: '5', label: '4-6 years' },
    { value: '8', label: '7-10 years' },
    { value: '12', label: '10-15 years' },
    { value: '20', label: '15+ years' }
  ]

  const sessionTypeOptions = [
    { value: 'in-person', label: 'In-Person' },
    { value: 'online', label: 'Online/Virtual' },
    { value: 'hybrid', label: 'Hybrid (Both)' }
  ]

  const heroStats = [
    { value: '12+', label: 'Active city directories' },
    { value: '0%', label: 'Commission or lead fees' },
    { value: '5 min', label: 'Average setup time' }
  ]

  if (!user) {
    return (
      <div className="professional-signup">
        <SEOHelmet
          title="Join the Directory"
          description="Create your free account to list your premarital counseling services."
          url="/professional/create"
        />
        <section className="professional-signup__hero">
          <div className="professional-signup__hero-content">
            <p className="section-eyebrow">For premarital counselors</p>
            <h1>Join the directory in two steps</h1>
            <p className="professional-signup__hero-subtitle">
              Create a free account, add your profile, and start receiving direct inquiries from engaged couples.
            </p>
            <div className="professional-signup__metrics">
              {heroStats.map((stat) => (
                <div className="professional-signup__metric" key={stat.label}>
                  <span className="professional-signup__metric-value">{stat.value}</span>
                  <span className="professional-signup__metric-label">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="professional-signup__hero-panel">
            <h3>Create your account to continue</h3>
            <p>We'll guide you through adding your practice details once you're signed in.</p>
            <a href="/professional/signup" className="professional-signup__button professional-signup__button--primary">
              Create Account
            </a>
            <p className="professional-signup__panel-note">
              Already have an account? <a href="/professional/login">Sign in</a>
            </p>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="professional-signup">
      <SEOHelmet
        title="Create Your Professional Profile - Wedding Counselors"
        description="Join the Wedding Counselors directory for free. Create your professional profile and start receiving leads from engaged couples seeking premarital counseling."
        url="/professional/create"
      />

      <section className="professional-signup__hero">
        <div className="professional-signup__hero-content">
          <p className="section-eyebrow">For premarital counselors</p>
          <h1>Create your professional profile</h1>
          <p className="professional-signup__hero-subtitle">
            Complete your profile to help engaged couples find you. The more details you provide, the better matches you'll receive.
          </p>
          <div className="professional-signup__metrics">
            {heroStats.map((stat) => (
              <div className="professional-signup__metric" key={stat.label}>
                <span className="professional-signup__metric-value">{stat.value}</span>
                <span className="professional-signup__metric-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="professional-signup__hero-panel">
          <h3>Step {currentStep} of {totalSteps}</h3>
          <div className="professional-signup__progress">
            <div
              className="professional-signup__progress-bar"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
          <ul>
            <li className={currentStep >= 1 ? 'active' : ''}>
              <i className={currentStep > 1 ? 'fa fa-check' : 'fa fa-map-marker'} aria-hidden="true" style={{ marginRight: '8px', fontSize: '0.8em' }}></i>
              Get Listed
            </li>
            <li className={currentStep >= 2 ? 'active' : ''}>
              <i className={currentStep > 2 ? 'fa fa-check' : 'fa fa-user'} aria-hidden="true" style={{ marginRight: '8px', fontSize: '0.8em' }}></i>
              Your Profile <span style={{ fontSize: '0.75em', opacity: 0.7 }}>(optional)</span>
            </li>
            <li className={currentStep >= 3 ? 'active' : ''}>
              <i className="fa fa-dollar" aria-hidden="true" style={{ marginRight: '8px', fontSize: '0.8em' }}></i>
              Pricing <span style={{ fontSize: '0.75em', opacity: 0.7 }}>(optional)</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="professional-signup__form-section" id="create-profile">
        <div className="professional-signup__form-wrapper">
          <div className="professional-signup__form-card">
            {error && (
              <div className="professional-signup__alert" role="alert">
                <i className="fa fa-exclamation-circle" aria-hidden="true"></i>
                <span>{error}</span>
              </div>
            )}
            <form onSubmit={handleSubmit}>
              {/* Step 1: Essentials - Get Listed Fast */}
              {currentStep === 1 && (
                <div className="professional-signup__fieldset">
                  <div className="professional-signup__fieldset-header">
                    <h3>Get Listed in 60 Seconds</h3>
                    <p>Enter the essentials to publish your free profile. You can add more details later.</p>
                  </div>

                  {/* Name and Profession - The basics */}
                  <div className="professional-signup__grid professional-signup__grid--2">
                    <div className="form-group">
                      <label htmlFor="full_name">Your Name *</label>
                      <input
                        type="text"
                        id="full_name"
                        className="form-control"
                        required
                        value={formData.full_name}
                        onChange={(e) => handleInputChange('full_name', e.target.value)}
                        placeholder="Dr. Jane Smith, LMFT"
                      />
                      <small>Include credentials (PhD, LMFT, LPC)</small>
                    </div>
                    <div className="form-group">
                      <label htmlFor="profession">I am a... *</label>
                      <select
                        id="profession"
                        className="form-control"
                        required
                        value={formData.profession}
                        onChange={(e) => handleInputChange('profession', e.target.value)}
                      >
                        <option value="">Select your role</option>
                        {professionOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Location - Critical for SEO, moved to Step 1 */}
                  <div className="professional-signup__grid professional-signup__grid--2">
                    <div className="form-group">
                      <label htmlFor="city">City *</label>
                      <input
                        type="text"
                        id="city"
                        className="form-control"
                        required
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="Austin"
                      />
                      <small>Where should couples find you?</small>
                    </div>
                    <div className="form-group">
                      <label htmlFor="state_province">State *</label>
                      <input
                        type="text"
                        id="state_province"
                        className="form-control"
                        required
                        value={formData.state_province}
                        onChange={(e) => handleInputChange('state_province', e.target.value)}
                        placeholder="Texas"
                      />
                    </div>
                  </div>

                  {/* Session Types - Important for filtering */}
                  <div className="form-group">
                    <label>How do you meet with clients? *</label>
                    <div className="professional-signup__pill-group">
                      {sessionTypeOptions.map((option) => (
                        <button
                          type="button"
                          key={option.value}
                          className={`professional-signup__pill ${formData.session_types.includes(option.value) ? 'is-selected' : ''}`}
                          onClick={() => handleArrayToggle('session_types', option.value)}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Email - Pre-filled from auth */}
                  <div className="form-group">
                    <label htmlFor="email">Contact Email *</label>
                    <input
                      type="email"
                      id="email"
                      className="form-control"
                      required
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="you@practice.com"
                    />
                    <small>Couples will contact you here</small>
                  </div>

                  {/* Photo - Encouraged but not blocking */}
                  <div className="form-group">
                    <label>Profile Photo <span style={{color: 'var(--slate)', fontWeight: 'normal'}}>(recommended)</span></label>
                    <div className={`photo-upload ${photoPreview ? 'has-photo' : ''}`}>
                      <div className="photo-preview">
                        {photoPreview ? (
                          <img src={photoPreview} alt="Profile preview" />
                        ) : (
                          <div className="photo-placeholder">
                            <i className="fa fa-camera" aria-hidden="true"></i>
                          </div>
                        )}
                      </div>
                      <div className="photo-controls">
                        <h4>{photoPreview ? 'Looking great!' : 'Add your headshot'}</h4>
                        <p>
                          {photoPreview
                            ? 'Couples can now see who they\'ll be working with.'
                            : 'Profiles with photos get 3x more inquiries.'}
                        </p>
                        <label className="btn-upload">
                          <i className="fa fa-cloud-upload" aria-hidden="true"></i>
                          {photoPreview ? 'Change Photo' : 'Upload Photo'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoChange}
                            style={{ display: 'none' }}
                          />
                        </label>
                        {photoPreview && (
                          <button
                            type="button"
                            className="btn-remove"
                            onClick={handlePhotoRemove}
                          >
                            <i className="fa fa-trash" aria-hidden="true"></i>
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                    {photoError && (
                      <div className="field-error">{photoError}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Make Your Profile Stand Out (Optional) */}
              {currentStep === 2 && (
                <div className="professional-signup__fieldset">
                  <div className="professional-signup__fieldset-header">
                    <h3>Make Your Profile Stand Out</h3>
                    <p>These details help couples choose you over others. <strong>You can skip this and add later.</strong></p>
                  </div>

                  {/* Bio - Most important for conversions */}
                  <div className="form-group">
                    <label htmlFor="bio">Tell couples about yourself</label>
                    <textarea
                      id="bio"
                      className="form-control"
                      rows="4"
                      value={formData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      placeholder="What's your approach to premarital counseling? What can couples expect working with you?"
                    />
                    <small>Profiles with bios get 2x more inquiries. Even 2-3 sentences helps.</small>
                  </div>

                  {/* Specialties - Simplified, top options only */}
                  <div className="form-group">
                    <label>What do you specialize in?</label>
                    <div className="professional-signup__pill-group">
                      {['Premarital Counseling', 'Communication Skills', 'Conflict Resolution', 'Faith-Based Counseling', 'Blended Families', 'LGBTQ+ Affirming'].map(specialty => (
                        <button
                          type="button"
                          key={specialty}
                          className={`professional-signup__pill ${formData.specialties.includes(specialty) ? 'is-selected' : ''}`}
                          onClick={() => handleArrayToggle('specialties', specialty)}
                        >
                          {specialty}
                        </button>
                      ))}
                    </div>
                    <small>Select all that apply. You can add more from your dashboard.</small>
                  </div>

                  {/* Experience - Quick select */}
                  <div className="form-group">
                    <label htmlFor="years_experience">Years of experience</label>
                    <select
                      id="years_experience"
                      className="form-control"
                      value={formData.years_experience}
                      onChange={(e) => handleInputChange('years_experience', e.target.value)}
                    >
                      <option value="">Select (optional)</option>
                      {yearsExperienceOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Website/Phone - Optional contact methods */}
                  <div className="professional-signup__grid professional-signup__grid--2">
                    <div className="form-group">
                      <label htmlFor="phone">Phone (optional)</label>
                      <input
                        type="tel"
                        id="phone"
                        className="form-control"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="website">Website (optional)</label>
                      <input
                        type="url"
                        id="website"
                        className="form-control"
                        value={formData.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        placeholder="https://yourpractice.com"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Pricing & Final Details (Optional - Last Step) */}
              {currentStep === 3 && (
                <div className="professional-signup__fieldset">
                  <div className="professional-signup__fieldset-header">
                    <h3>Almost Done! Add Pricing</h3>
                    <p>Pricing info helps couples budget. <strong>Skip to publish now, or add these details.</strong></p>
                  </div>

                  {/* Free Consultation - High impact toggle */}
                  <div className="form-group" style={{ background: 'var(--ivory)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-6)' }}>
                    <label className="professional-signup__toggle-label" style={{ margin: 0 }}>
                      <input
                        type="checkbox"
                        checked={formData.offers_free_consultation}
                        onChange={(e) => handleInputChange('offers_free_consultation', e.target.checked)}
                      />
                      <span><strong>I offer free consultations</strong></span>
                    </label>
                    <small style={{ display: 'block', marginTop: 'var(--space-2)' }}>Providers with free consultations get 40% more inquiries</small>
                  </div>

                  {/* Session Fee Range - Simplified */}
                  <div className="form-group">
                    <label>Session fee range (optional)</label>
                    <div className="professional-signup__grid professional-signup__grid--2">
                      <div>
                        <input
                          type="number"
                          id="session_fee_min"
                          className="form-control"
                          min="0"
                          step="10"
                          value={formData.session_fee_min}
                          onChange={(e) => handleInputChange('session_fee_min', e.target.value)}
                          placeholder="Min ($)"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          id="session_fee_max"
                          className="form-control"
                          min="0"
                          step="10"
                          value={formData.session_fee_max}
                          onChange={(e) => handleInputChange('session_fee_max', e.target.value)}
                          placeholder="Max ($)"
                        />
                      </div>
                    </div>
                    <small>Example: $100 - $175 per session</small>
                  </div>

                  {/* Booking URL - High value for conversions */}
                  <div className="form-group">
                    <label htmlFor="booking_url">Booking link (optional)</label>
                    <input
                      type="url"
                      id="booking_url"
                      className="form-control"
                      value={formData.booking_url}
                      onChange={(e) => handleInputChange('booking_url', e.target.value)}
                      placeholder="https://calendly.com/yourname"
                    />
                    <small>Calendly, Acuity, or your booking page. Makes scheduling easy for couples.</small>
                  </div>

                  {/* Quick credential check - Top 4 only */}
                  <div className="form-group">
                    <label>Credentials (select if applicable)</label>
                    <div className="professional-signup__pill-group">
                      {['Licensed Marriage and Family Therapist (LMFT)', 'Licensed Professional Counselor (LPC)', 'Certified Gottman Therapist', 'Ordained Minister'].map(credential => (
                        <button
                          type="button"
                          key={credential}
                          className={`professional-signup__pill ${formData.credentials.includes(credential) ? 'is-selected' : ''}`}
                          onClick={() => handleArrayToggle('credentials', credential)}
                        >
                          {credential.replace('Licensed ', '').replace('Certified ', '').replace(' (LMFT)', '').replace(' (LPC)', '')}
                        </button>
                      ))}
                    </div>
                    <small>Add more credentials from your dashboard after signup.</small>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="professional-signup__actions">
                {currentStep > 1 && (
                  <button
                    type="button"
                    className="professional-signup__button professional-signup__button--secondary"
                    onClick={handleBack}
                  >
                    Back
                  </button>
                )}

                {/* Steps 2 and 3 are skippable */}
                {currentStep > 1 && currentStep < totalSteps && (
                  <button
                    type="button"
                    className="professional-signup__button professional-signup__button--ghost"
                    onClick={handleSkip}
                    style={{ color: 'var(--slate)' }}
                  >
                    Skip for now →
                  </button>
                )}

                {currentStep < totalSteps ? (
                  <button
                    type="button"
                    className="professional-signup__button professional-signup__button--primary"
                    onClick={handleNext}
                  >
                    {currentStep === 1 ? 'Continue' : 'Save & Continue'}
                  </button>
                ) : (
                  <>
                    {/* On final step, offer both Skip to Publish and Save & Publish */}
                    <button
                      type="submit"
                      className="professional-signup__button professional-signup__button--ghost"
                      disabled={loading}
                      style={{ color: 'var(--slate)' }}
                    >
                      Skip & Publish
                    </button>
                    <button
                      type="submit"
                      className="professional-signup__submit"
                      disabled={loading}
                    >
                      {loading ? 'Creating Profile...' : 'Publish My Profile'}
                    </button>
                  </>
                )}
              </div>
              {currentStep === totalSteps && (
                <p className="professional-signup__terms">
                  By creating a profile, you agree to our{' '}
                  <a href="/terms" target="_blank" rel="noreferrer">Terms of Service</a> and{' '}
                  <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>.
                </p>
              )}
            </form>
          </div>

          <aside className="professional-signup__benefits-card">
            <h3>Why complete your profile?</h3>
            <ul>
              <li><strong>More visibility:</strong> Complete profiles rank higher in search results</li>
              <li><strong>Better matches:</strong> Couples filter by specialties, insurance, and approach</li>
              <li><strong>Trust signals:</strong> Credentials and experience build credibility</li>
              <li><strong>More inquiries:</strong> Free consultations increase lead conversion by 40%</li>
              <li><strong>Professional image:</strong> Detailed profiles reflect your expertise</li>
            </ul>
            <div className="professional-signup__completeness">
              <strong>Profile Completeness</strong>
              <div className="professional-signup__completeness-bar">
                <div
                  className="professional-signup__completeness-fill"
                  style={{
                    width: `${Math.min(100,
                      (formData.full_name ? 10 : 0) +
                      (photoPreview ? 10 : 0) +
                      (formData.email ? 10 : 0) +
                      (formData.profession ? 10 : 0) +
                      (formData.years_experience ? 10 : 0) +
                      (formData.bio ? 15 : 0) +
                      (formData.credentials.length > 0 ? 10 : 0) +
                      (formData.specialties.length > 0 ? 10 : 0) +
                      (formData.session_fee_min ? 10 : 0) +
                      (formData.city ? 10 : 0) +
                      (formData.session_types.length > 0 ? 5 : 0)
                    )}%`
                  }}
                />
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  )
}

export default CreateProfilePage
