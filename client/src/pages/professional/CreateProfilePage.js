import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { profileOperations, supabase } from '../../lib/supabaseClient'
import { trackProfileClaim } from '../../components/analytics/GoogleAnalytics'
import SEOHelmet from '../../components/analytics/SEOHelmet'
import { STATE_CONFIG } from '../../data/locationConfig'
import { sendProfileCreatedEmail } from '../../lib/emailNotifications'
import { compressImage, validateImage } from '../../utils/imageUtils'
import '../../assets/css/professional-signup.css'

const CreateProfilePage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, refreshProfile } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 4

  const [formData, setFormData] = useState({
    // Step 1: Who are you?
    full_name: '',
    profession: '',

    // Step 2: Where do you practice?
    city: '',
    state_province: '',
    session_types: [],

    // Step 3: About you (optional)
    bio: '',
    specialties: [],
    years_experience: '',
    treatment_approaches: [],
    client_focus: [],

    // Step 4: Pricing & Contact (optional)
    offers_free_consultation: false,
    session_fee_min: '',
    session_fee_max: '',
    phone: '',
    website: '',
    insurance_accepted: [],
    payment_methods: [],
    languages: [],

    // Auto-filled
    email: '',
    country: 'United States'
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [utmParams, setUtmParams] = useState({})
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')

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
    // Pre-fill from user metadata if available (from previous signup)
    if (user?.user_metadata) {
      const meta = user.user_metadata
      setFormData(prev => ({
        ...prev,
        full_name: meta.full_name || prev.full_name,
        profession: meta.profession || prev.profession,
        phone: meta.phone || prev.phone
      }))
    }
  }, [user])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate image
    const validation = validateImage(file)
    if (!validation.valid) {
      setError(validation.error)
      return
    }

    setError('')

    // Show preview immediately (before compression)
    const reader = new FileReader()
    reader.onload = (e) => setPhotoPreview(e.target.result)
    reader.readAsDataURL(file)

    // Store original file - compression happens on submit
    setPhotoFile(file)
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
      if (!formData.full_name.trim()) {
        setError('Please enter your name')
        return false
      }
      if (!formData.profession) {
        setError('Please select what type of professional you are')
        return false
      }
    }

    if (step === 2) {
      if (!formData.city.trim()) {
        setError('Please enter your city')
        return false
      }
      if (!formData.state_province.trim()) {
        setError('Please enter your state')
        return false
      }
      if (formData.session_types.length === 0) {
        setError('Please select how you meet with clients')
        return false
      }
    }

    // Steps 3 and 4 are optional - no validation required

    return true
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleSkip = () => {
    setError('')
    setCurrentStep(prev => Math.min(prev + 1, totalSteps))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

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
        email: formData.email.trim() || user.email,
        phone: formData.phone.trim() || null,
        website: formData.website.trim() || null,
        profession: formData.profession,
        bio: formData.bio.trim() || null,
        years_experience: formData.years_experience ? parseInt(formData.years_experience) : null,
        offers_free_consultation: formData.offers_free_consultation,
        session_fee_min: formData.session_fee_min ? parseInt(formData.session_fee_min) * 100 : null,
        session_fee_max: formData.session_fee_max ? parseInt(formData.session_fee_max) * 100 : null,
        pricing_range: formData.session_fee_min && formData.session_fee_max
          ? `$${formData.session_fee_min}-$${formData.session_fee_max}`
          : null,
        specialties: formData.specialties.length > 0 ? formData.specialties : null,
        session_types: formData.session_types,
        // New PT-style fields
        treatment_approaches: formData.treatment_approaches.length > 0 ? formData.treatment_approaches : null,
        client_focus: formData.client_focus.length > 0 ? formData.client_focus : null,
        insurance_accepted: formData.insurance_accepted.length > 0 ? formData.insurance_accepted : null,
        payment_methods: formData.payment_methods.length > 0 ? formData.payment_methods : null,
        languages: formData.languages.length > 0 ? formData.languages : null,
        // Standard fields
        accepting_new_clients: true,
        city: formData.city.trim(),
        state_province: formData.state_province.trim(),
        country: formData.country,
        slug: slug,
        is_claimed: true,
        claimed_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
        tier: 'community',
        contact_reveals_count: 0,
        signup_source: utmParams.signup_source || 'organic',
        utm_source: utmParams.utm_source || null,
        utm_medium: utmParams.utm_medium || null,
        utm_campaign: utmParams.utm_campaign || null
      }

      const { data: profile, error: createError } = await profileOperations.createProfile(profileData)

      if (createError) throw createError

      // Upload photo if provided (compress first)
      if (photoFile) {
        try {
          // Compress image before upload (max 800x800, ~500KB)
          const compressedFile = await compressImage(photoFile, {
            maxWidth: 800,
            maxHeight: 800,
            quality: 0.85,
            maxSizeKB: 500
          })

          const { data: uploadData, error: uploadError } = await profileOperations.uploadPhoto(
            compressedFile,
            profile.id
          )

          if (!uploadError && uploadData?.publicUrl) {
            await supabase
              .from('profiles')
              .update({ photo_url: uploadData.publicUrl })
              .eq('id', profile.id)
          }
        } catch (photoErr) {
          console.error('Photo upload failed:', photoErr)
        }
      }

      trackProfileClaim(profile.id, 'self_service')
      await refreshProfile()

      const stateSlug = getStateSlug(formData.state_province)
      const citySlug = getCitySlug(formData.city)
      const profileUrl = `/premarital-counseling/${stateSlug}/${citySlug}/${slug}`
      const fullProfileUrl = `${window.location.origin}${profileUrl}`

      // Send welcome email
      try {
        await sendProfileCreatedEmail(
          formData.email.trim() || user.email,
          { full_name: formData.full_name },
          fullProfileUrl,
          window.location.origin
        )
      } catch (emailError) {
        console.error('Welcome email failed:', emailError)
      }

      navigate('/professional/profile-created', {
        state: {
          profileUrl,
          profileId: profile.id,
          profileName: formData.full_name
        }
      })

    } catch (err) {
      console.error('Error creating profile:', err)

      if (err.code === '23505') {
        setError('A profile with this email already exists. Please try logging in instead.')
      } else {
        setError(err.message || 'There was an error creating your profile. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Options
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

  const sessionTypeOptions = [
    { value: 'in-person', label: 'In-Person', icon: 'fa-building' },
    { value: 'online', label: 'Online/Video', icon: 'fa-video-camera' },
    { value: 'hybrid', label: 'Both', icon: 'fa-exchange' }
  ]

  const specialtyOptions = [
    'Premarital Counseling',
    'Communication Skills',
    'Conflict Resolution',
    'Faith-Based Counseling',
    'Blended Families',
    'LGBTQ+ Affirming',
    'Interfaith Couples',
    'Second Marriages'
  ]

  const yearsOptions = [
    { value: '1', label: 'Less than 1 year' },
    { value: '3', label: '1-3 years' },
    { value: '5', label: '4-6 years' },
    { value: '10', label: '7-10 years' },
    { value: '15', label: '10-15 years' },
    { value: '20', label: '15+ years' }
  ]

  // PT-style treatment approaches
  const treatmentApproachOptions = [
    'Gottman Method',
    'Emotionally Focused (EFT)',
    'Cognitive Behavioral (CBT)',
    'Prepare/Enrich',
    'Solution-Focused',
    'Faith-Based',
    'Attachment-Based',
    'Psychodynamic'
  ]

  // Who they work with
  const clientFocusOptions = [
    'Engaged Couples',
    'Newlyweds',
    'Adults (20s-30s)',
    'Adults (40s+)',
    'Second Marriages',
    'Blended Families',
    'LGBTQ+ Couples',
    'Military Couples'
  ]

  // Insurance options
  const insuranceOptions = [
    'Out of Pocket Only',
    'Sliding Scale Available',
    'Aetna',
    'Blue Cross Blue Shield',
    'Cigna',
    'United Healthcare',
    'Other Insurance'
  ]

  // Payment methods
  const paymentMethodOptions = [
    'Cash',
    'Credit Card',
    'Check',
    'HSA/FSA',
    'Venmo/PayPal'
  ]

  // Languages
  const languageOptions = [
    'English',
    'Spanish',
    'Mandarin',
    'French',
    'Vietnamese',
    'Korean',
    'ASL'
  ]

  const stepLabels = [
    'Who are you?',
    'Where do you practice?',
    'About you',
    'Pricing'
  ]

  // Not logged in state
  if (!user) {
    return (
      <div className="professional-signup">
        <SEOHelmet
          title="Create Your Profile - Wedding Counselors"
          description="Join the directory and start receiving inquiries from engaged couples."
          url="/professional/create"
          noIndex={true}
        />
        <section className="professional-signup__hero" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center' }}>
          <div className="professional-signup__hero-content">
            <h1>Create your profile</h1>
            <p className="professional-signup__hero-subtitle">
              You need to create an account first. It only takes 30 seconds.
            </p>
            <a href="/professional/signup" className="professional-signup__button professional-signup__button--primary">
              Create Free Account
            </a>
            <p style={{ marginTop: '1rem', color: 'var(--slate)' }}>
              Already have an account? <a href="/professional/login">Sign in</a>
            </p>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="professional-signup professional-signup--quiz">
      <SEOHelmet
        title="Complete Your Profile - Wedding Counselors"
        description="Finish setting up your profile to start receiving inquiries from engaged couples."
        url="/professional/create"
        noIndex={true}
      />

      {/* Progress Header */}
      <header className="quiz-header">
        <div className="quiz-header__inner">
          <div className="quiz-header__progress">
            <div className="quiz-header__progress-bar">
              <div
                className="quiz-header__progress-fill"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
            <span className="quiz-header__step-text">Step {currentStep} of {totalSteps}</span>
          </div>
          <div className="quiz-header__steps">
            {stepLabels.map((label, i) => (
              <div
                key={label}
                className={`quiz-header__step ${currentStep > i + 1 ? 'completed' : ''} ${currentStep === i + 1 ? 'active' : ''}`}
              >
                <span className="quiz-header__step-num">{currentStep > i + 1 ? '✓' : i + 1}</span>
                <span className="quiz-header__step-label">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Quiz Content */}
      <main className="quiz-main">
        <div className="quiz-card">
          {error && (
            <div className="quiz-alert" role="alert">
              <i className="fa fa-exclamation-circle" aria-hidden="true"></i>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Step 1: Who are you? */}
            {currentStep === 1 && (
              <div className="quiz-step">
                <div className="quiz-step__header">
                  <h1>Let's start with the basics</h1>
                  <p>How should couples know you?</p>
                </div>

                <div className="quiz-field">
                  <label htmlFor="full_name">Your name (with credentials)</label>
                  <input
                    type="text"
                    id="full_name"
                    className="quiz-input quiz-input--large"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    placeholder="Dr. Sarah Mitchell, LMFT"
                    autoFocus
                  />
                  <small>Include your title and credentials (PhD, LMFT, LPC, etc.)</small>
                </div>

                <div className="quiz-field">
                  <label>I am a...</label>
                  <div className="quiz-options quiz-options--grid">
                    {professionOptions.map(option => (
                      <button
                        type="button"
                        key={option}
                        className={`quiz-option ${formData.profession === option ? 'is-selected' : ''}`}
                        onClick={() => handleInputChange('profession', option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional photo on step 1 */}
                <div className="quiz-field quiz-field--photo">
                  <label>Add a photo <span className="optional">(optional but recommended)</span></label>
                  <div className="quiz-photo">
                    {photoPreview ? (
                      <div className="quiz-photo__preview">
                        <img src={photoPreview} alt="Preview" />
                        <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(''); }}>
                          <i className="fa fa-times" aria-hidden="true"></i>
                        </button>
                      </div>
                    ) : (
                      <label className="quiz-photo__upload">
                        <i className="fa fa-camera" aria-hidden="true"></i>
                        <span>Upload headshot</span>
                        <input type="file" accept="image/*" onChange={handlePhotoChange} />
                      </label>
                    )}
                    <small>Profiles with photos get 3x more inquiries</small>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Where do you practice? */}
            {currentStep === 2 && (
              <div className="quiz-step">
                <div className="quiz-step__header">
                  <h1>Where do you practice?</h1>
                  <p>This helps couples in your area find you</p>
                </div>

                <div className="quiz-field-row">
                  <div className="quiz-field">
                    <label htmlFor="city">City</label>
                    <input
                      type="text"
                      id="city"
                      className="quiz-input"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="Austin"
                      autoFocus
                    />
                  </div>
                  <div className="quiz-field">
                    <label htmlFor="state">State</label>
                    <input
                      type="text"
                      id="state"
                      className="quiz-input"
                      value={formData.state_province}
                      onChange={(e) => handleInputChange('state_province', e.target.value)}
                      placeholder="Texas"
                    />
                  </div>
                </div>

                <div className="quiz-field">
                  <label>How do you meet with clients?</label>
                  <div className="quiz-options quiz-options--session">
                    {sessionTypeOptions.map(option => (
                      <button
                        type="button"
                        key={option.value}
                        className={`quiz-option quiz-option--icon ${formData.session_types.includes(option.value) ? 'is-selected' : ''}`}
                        onClick={() => handleArrayToggle('session_types', option.value)}
                      >
                        <i className={`fa ${option.icon}`} aria-hidden="true"></i>
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                  <small>Select all that apply</small>
                </div>
              </div>
            )}

            {/* Step 3: About you (optional) */}
            {currentStep === 3 && (
              <div className="quiz-step">
                <div className="quiz-step__header">
                  <h1>Tell couples about yourself</h1>
                  <p>This helps you stand out. <strong>You can skip this for now.</strong></p>
                </div>

                <div className="quiz-field">
                  <label htmlFor="bio">About your practice <span className="optional">(optional)</span></label>
                  <textarea
                    id="bio"
                    className="quiz-textarea"
                    rows="4"
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="What's your approach to premarital counseling? What can couples expect working with you?"
                  />
                  <small>Even 2-3 sentences helps couples connect with you</small>
                </div>

                <div className="quiz-field">
                  <label>What do you specialize in? <span className="optional">(optional)</span></label>
                  <div className="quiz-pills">
                    {specialtyOptions.map(specialty => (
                      <button
                        type="button"
                        key={specialty}
                        className={`quiz-pill ${formData.specialties.includes(specialty) ? 'is-selected' : ''}`}
                        onClick={() => handleArrayToggle('specialties', specialty)}
                      >
                        {specialty}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="quiz-field">
                  <label>Therapeutic approach <span className="optional">(optional)</span></label>
                  <div className="quiz-pills">
                    {treatmentApproachOptions.map(approach => (
                      <button
                        type="button"
                        key={approach}
                        className={`quiz-pill ${formData.treatment_approaches.includes(approach) ? 'is-selected' : ''}`}
                        onClick={() => handleArrayToggle('treatment_approaches', approach)}
                      >
                        {approach}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="quiz-field">
                  <label>Who do you work with? <span className="optional">(optional)</span></label>
                  <div className="quiz-pills">
                    {clientFocusOptions.map(focus => (
                      <button
                        type="button"
                        key={focus}
                        className={`quiz-pill ${formData.client_focus.includes(focus) ? 'is-selected' : ''}`}
                        onClick={() => handleArrayToggle('client_focus', focus)}
                      >
                        {focus}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="quiz-field quiz-field--narrow">
                  <label htmlFor="experience">Years of experience <span className="optional">(optional)</span></label>
                  <select
                    id="experience"
                    className="quiz-select"
                    value={formData.years_experience}
                    onChange={(e) => handleInputChange('years_experience', e.target.value)}
                  >
                    <option value="">Select...</option>
                    {yearsOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Step 4: Pricing & Details (optional) */}
            {currentStep === 4 && (
              <div className="quiz-step">
                <div className="quiz-step__header">
                  <h1>Final details</h1>
                  <p>Help couples understand your practice. <strong>All optional - skip or edit later.</strong></p>
                </div>

                <div className="quiz-field quiz-field--highlight">
                  <label className="quiz-toggle">
                    <input
                      type="checkbox"
                      checked={formData.offers_free_consultation}
                      onChange={(e) => handleInputChange('offers_free_consultation', e.target.checked)}
                    />
                    <span className="quiz-toggle__switch"></span>
                    <span className="quiz-toggle__label">
                      <strong>I offer free consultations</strong>
                      <small>Providers with free consults get 40% more inquiries</small>
                    </span>
                  </label>
                </div>

                <div className="quiz-field">
                  <label>Session fee range <span className="optional">(optional)</span></label>
                  <div className="quiz-field-row">
                    <div className="quiz-input-group">
                      <span className="quiz-input-prefix">$</span>
                      <input
                        type="number"
                        className="quiz-input"
                        min="0"
                        step="10"
                        value={formData.session_fee_min}
                        onChange={(e) => handleInputChange('session_fee_min', e.target.value)}
                        placeholder="100"
                      />
                    </div>
                    <span className="quiz-field-sep">to</span>
                    <div className="quiz-input-group">
                      <span className="quiz-input-prefix">$</span>
                      <input
                        type="number"
                        className="quiz-input"
                        min="0"
                        step="10"
                        value={formData.session_fee_max}
                        onChange={(e) => handleInputChange('session_fee_max', e.target.value)}
                        placeholder="175"
                      />
                    </div>
                  </div>
                </div>

                <div className="quiz-field">
                  <label>Insurance & Payment <span className="optional">(optional)</span></label>
                  <div className="quiz-pills">
                    {insuranceOptions.map(ins => (
                      <button
                        type="button"
                        key={ins}
                        className={`quiz-pill ${formData.insurance_accepted.includes(ins) ? 'is-selected' : ''}`}
                        onClick={() => handleArrayToggle('insurance_accepted', ins)}
                      >
                        {ins}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="quiz-field">
                  <label>Payment methods <span className="optional">(optional)</span></label>
                  <div className="quiz-pills">
                    {paymentMethodOptions.map(method => (
                      <button
                        type="button"
                        key={method}
                        className={`quiz-pill ${formData.payment_methods.includes(method) ? 'is-selected' : ''}`}
                        onClick={() => handleArrayToggle('payment_methods', method)}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="quiz-field">
                  <label>Languages spoken <span className="optional">(optional)</span></label>
                  <div className="quiz-pills">
                    {languageOptions.map(lang => (
                      <button
                        type="button"
                        key={lang}
                        className={`quiz-pill ${formData.languages.includes(lang) ? 'is-selected' : ''}`}
                        onClick={() => handleArrayToggle('languages', lang)}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="quiz-field-row">
                  <div className="quiz-field">
                    <label htmlFor="phone">Phone <span className="optional">(optional)</span></label>
                    <input
                      type="tel"
                      id="phone"
                      className="quiz-input"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div className="quiz-field">
                    <label htmlFor="website">Website <span className="optional">(optional)</span></label>
                    <input
                      type="url"
                      id="website"
                      className="quiz-input"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder="https://yoursite.com"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="quiz-nav">
              {currentStep > 1 && (
                <button type="button" className="quiz-btn quiz-btn--back" onClick={handleBack}>
                  <i className="fa fa-arrow-left" aria-hidden="true"></i> Back
                </button>
              )}

              <div className="quiz-nav__right">
                {/* Skip button for optional steps */}
                {currentStep >= 3 && currentStep < totalSteps && (
                  <button type="button" className="quiz-btn quiz-btn--skip" onClick={handleSkip}>
                    Skip for now
                  </button>
                )}

                {currentStep < totalSteps ? (
                  <button type="button" className="quiz-btn quiz-btn--next" onClick={handleNext}>
                    Continue <i className="fa fa-arrow-right" aria-hidden="true"></i>
                  </button>
                ) : (
                  <button type="submit" className="quiz-btn quiz-btn--submit" disabled={loading}>
                    {loading ? (
                      <>Creating profile...</>
                    ) : (
                      <>Publish My Profile <i className="fa fa-check" aria-hidden="true"></i></>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Side benefits */}
        <aside className="quiz-aside">
          <div className="quiz-aside__card">
            <h3>Your free listing includes:</h3>
            <ul>
              <li><i className="fa fa-check" aria-hidden="true"></i> City + state directory placement</li>
              <li><i className="fa fa-check" aria-hidden="true"></i> Direct inquiries to your email</li>
              <li><i className="fa fa-check" aria-hidden="true"></i> Profile views analytics</li>
              <li><i className="fa fa-check" aria-hidden="true"></i> Edit anytime from your dashboard</li>
            </ul>
          </div>
        </aside>
      </main>
    </div>
  )
}

export default CreateProfilePage
