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
  const { user, profile, loading: authLoading, refreshProfile } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 3

  // Redirect if user already has a profile
  useEffect(() => {
    if (!authLoading && profile) {
      navigate('/professional/dashboard', { replace: true })
    }
  }, [authLoading, profile, navigate])

  const [formData, setFormData] = useState({
    // Step 1: Who are you?
    full_name: '',
    profession: '',

    // Step 2: Where do you practice?
    city: '',
    state_province: '',
    session_types: [],

    // Step 3: About you (optional) - Enhanced for premarital niche
    bio: '',
    specialties: [],
    certifications: [],        // NEW: SYMBIS, PREPARE/ENRICH, etc.
    faith_tradition: '',       // NEW: Important for couples choosing
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

  const generateSlug = (name) => {
    // Clean slug: just the name, lowercase, no special chars
    // e.g., "Dr. Sarah Mitchell, LMFT" -> "dr-sarah-mitchell-lmft"
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .trim()
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

  // Prevent form submission on Enter key (only submit on final step button click)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && currentStep < totalSteps) {
      e.preventDefault()
      handleNext()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Only allow submission on final step
    if (currentStep < totalSteps) {
      handleNext()
      return
    }

    if (!user) {
      setError('You must be logged in to create a profile')
      return
    }

    setLoading(true)
    setError('')

    try {
      const slug = generateSlug(formData.full_name)

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
        // Premarital counseling niche-specific fields
        certifications: formData.certifications.length > 0 ? formData.certifications : null,
        faith_tradition: formData.faith_tradition || null,
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

  // Options - Optimized for premarital counseling niche
  const professionOptions = [
    // Licensed Professionals
    { value: 'Marriage & Family Therapist', label: 'Marriage & Family Therapist (LMFT)', category: 'licensed' },
    { value: 'Licensed Professional Counselor', label: 'Licensed Professional Counselor (LPC)', category: 'licensed' },
    { value: 'Licensed Clinical Social Worker', label: 'Licensed Clinical Social Worker (LCSW)', category: 'licensed' },
    { value: 'Psychologist', label: 'Psychologist (PhD/PsyD)', category: 'licensed' },
    // Coaches & Facilitators
    { value: 'Premarital Coach', label: 'Premarital/Relationship Coach', category: 'coach' },
    { value: 'SYMBIS Facilitator', label: 'SYMBIS Facilitator', category: 'coach' },
    // Faith-Based
    { value: 'Pastor', label: 'Pastor/Minister', category: 'clergy' },
    { value: 'Priest', label: 'Priest/Deacon', category: 'clergy' },
    { value: 'Rabbi', label: 'Rabbi', category: 'clergy' },
    { value: 'Chaplain', label: 'Chaplain', category: 'clergy' },
    { value: 'Pre-Cana Instructor', label: 'Pre-Cana Instructor', category: 'clergy' },
    // Other
    { value: 'Wedding Officiant', label: 'Wedding Officiant (w/ Counseling)', category: 'other' }
  ]

  const sessionTypeOptions = [
    { value: 'in-person', label: 'In-Person', icon: 'fa-building' },
    { value: 'online', label: 'Online/Video', icon: 'fa-video-camera' },
    { value: 'hybrid', label: 'Both', icon: 'fa-exchange' }
  ]

  const specialtyOptions = [
    // Core premarital topics
    'Communication Skills',
    'Conflict Resolution',
    'Financial Planning',
    'Intimacy & Sexuality',
    'Family Planning',
    // Relationship types
    'Blended Families',
    'Second Marriages',
    'Interfaith Couples',
    'Intercultural Couples',
    'Long-Distance Relationships',
    'Military Couples',
    'LGBTQ+ Affirming',
    // Special circumstances
    'Anxiety About Marriage',
    'In-Law Relationships',
    'Career/Work-Life Balance',
    'Trauma-Informed',
    // Faith-specific
    'Faith-Based Counseling',
    'Natural Family Planning (NFP)',
    'Catholic Marriage Prep'
  ]

  // Certifications specific to premarital counseling
  const certificationOptions = [
    'SYMBIS Certified',
    'PREPARE/ENRICH Certified',
    'Gottman Certified Therapist',
    'FOCCUS Trained',
    'Emotionally Focused (EFT) Certified',
    'Twogether in Texas Provider',
    'Pre-Cana Certified',
    'Marriage License Discount Provider'
  ]

  // Faith tradition - important for couples choosing counselors
  const faithTraditionOptions = [
    { value: 'secular', label: 'Secular/Non-religious' },
    { value: 'christian', label: 'Christian (Non-denominational)' },
    { value: 'catholic', label: 'Catholic' },
    { value: 'protestant', label: 'Protestant' },
    { value: 'jewish', label: 'Jewish' },
    { value: 'muslim', label: 'Muslim' },
    { value: 'interfaith', label: 'Interfaith Specialist' },
    { value: 'all-faiths', label: 'All Faiths Welcome' }
  ]

  const yearsOptions = [
    { value: '1', label: 'Less than 1 year' },
    { value: '3', label: '1-3 years' },
    { value: '5', label: '4-6 years' },
    { value: '10', label: '7-10 years' },
    { value: '15', label: '10-15 years' },
    { value: '20', label: '15+ years' }
  ]

  // Treatment approaches - premarital counseling specific
  const treatmentApproachOptions = [
    // Evidence-based assessments
    'SYMBIS Assessment',
    'PREPARE/ENRICH',
    'FOCCUS Inventory',
    // Therapeutic approaches
    'Gottman Method',
    'Emotionally Focused (EFT)',
    'Cognitive Behavioral (CBT)',
    'Solution-Focused',
    'Attachment-Based',
    // Faith-based programs
    'Catholic Pre-Cana',
    'Faith-Based Counseling',
    'Twogether in Texas'
  ]

  // Who they work with - expanded for premarital niche
  const clientFocusOptions = [
    'Engaged Couples',
    'Newly Engaged',
    'Planning Wedding Soon',
    'Newlyweds (First Year)',
    'Young Adults (20s)',
    'Adults (30s-40s)',
    'Second Marriages',
    'Previously Divorced',
    'Blended Families',
    'LGBTQ+ Couples',
    'Interfaith Couples',
    'Intercultural Couples',
    'Military/First Responders',
    'Long-Distance Couples'
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
    'About you'
  ]

  // Loading state - wait for auth to initialize
  if (authLoading) {
    return (
      <div className="professional-signup" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <i className="fa fa-spinner fa-spin fa-2x" style={{ color: 'var(--primary)' }}></i>
          <p style={{ marginTop: '1rem', color: 'var(--slate)' }}>Loading...</p>
        </div>
      </div>
    )
  }

  // Already has profile - redirect to dashboard (handled by useEffect, but show loading while redirecting)
  if (profile) {
    return (
      <div className="professional-signup" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <i className="fa fa-spinner fa-spin fa-2x" style={{ color: 'var(--primary)' }}></i>
          <p style={{ marginTop: '1rem', color: 'var(--slate)' }}>Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

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

          <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
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

                  {/* Licensed Professionals */}
                  <p className="quiz-category-label">Licensed Professionals</p>
                  <div className="quiz-options quiz-options--grid">
                    {professionOptions.filter(o => o.category === 'licensed').map(option => (
                      <button
                        type="button"
                        key={option.value}
                        className={`quiz-option ${formData.profession === option.value ? 'is-selected' : ''}`}
                        onClick={() => handleInputChange('profession', option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  {/* Coaches & Facilitators */}
                  <p className="quiz-category-label">Coaches & Facilitators</p>
                  <div className="quiz-options quiz-options--grid">
                    {professionOptions.filter(o => o.category === 'coach').map(option => (
                      <button
                        type="button"
                        key={option.value}
                        className={`quiz-option ${formData.profession === option.value ? 'is-selected' : ''}`}
                        onClick={() => handleInputChange('profession', option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  {/* Faith-Based */}
                  <p className="quiz-category-label">Faith-Based Counselors</p>
                  <div className="quiz-options quiz-options--grid">
                    {professionOptions.filter(o => o.category === 'clergy').map(option => (
                      <button
                        type="button"
                        key={option.value}
                        className={`quiz-option ${formData.profession === option.value ? 'is-selected' : ''}`}
                        onClick={() => handleInputChange('profession', option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  {/* Other */}
                  <div className="quiz-options quiz-options--grid" style={{ marginTop: '0.5rem' }}>
                    {professionOptions.filter(o => o.category === 'other').map(option => (
                      <button
                        type="button"
                        key={option.value}
                        className={`quiz-option ${formData.profession === option.value ? 'is-selected' : ''}`}
                        onClick={() => handleInputChange('profession', option.value)}
                      >
                        {option.label}
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
                    <small>A photo helps couples connect with you</small>
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
                    <label htmlFor="state">State</label>
                    <select
                      id="state"
                      className="quiz-select"
                      value={formData.state_province}
                      onChange={(e) => handleInputChange('state_province', e.target.value)}
                      autoFocus
                    >
                      <option value="">Select your state...</option>
                      {Object.entries(STATE_CONFIG)
                        .sort((a, b) => a[1].name.localeCompare(b[1].name))
                        .map(([slug, config]) => (
                          <option key={slug} value={config.abbr}>
                            {config.name}
                          </option>
                        ))
                      }
                    </select>
                  </div>
                  <div className="quiz-field">
                    <label htmlFor="city">City</label>
                    <input
                      type="text"
                      id="city"
                      className="quiz-input"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="Austin"
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

                {/* Faith Tradition - Key differentiator for couples */}
                <div className="quiz-field">
                  <label>Faith tradition <span className="optional">(optional but helpful)</span></label>
                  <small style={{ display: 'block', marginBottom: '0.75rem', color: 'var(--slate)' }}>
                    Many couples look for counselors who share their faith background
                  </small>
                  <div className="quiz-options quiz-options--grid">
                    {faithTraditionOptions.map(option => (
                      <button
                        type="button"
                        key={option.value}
                        className={`quiz-option ${formData.faith_tradition === option.value ? 'is-selected' : ''}`}
                        onClick={() => handleInputChange('faith_tradition', option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Certifications - Important for credibility */}
                <div className="quiz-field">
                  <label>Certifications <span className="optional">(optional)</span></label>
                  <small style={{ display: 'block', marginBottom: '0.75rem', color: 'var(--slate)' }}>
                    Highlight your specialized training in premarital counseling
                  </small>
                  <div className="quiz-pills">
                    {certificationOptions.map(cert => (
                      <button
                        type="button"
                        key={cert}
                        className={`quiz-pill ${formData.certifications.includes(cert) ? 'is-selected' : ''}`}
                        onClick={() => handleArrayToggle('certifications', cert)}
                      >
                        {cert}
                      </button>
                    ))}
                  </div>
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
