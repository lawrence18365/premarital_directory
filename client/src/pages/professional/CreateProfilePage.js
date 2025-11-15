import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { profileOperations } from '../../lib/supabaseClient'
import { trackProfileClaim } from '../../components/analytics/GoogleAnalytics'
import SEOHelmet from '../../components/analytics/SEOHelmet'
import { STATE_CONFIG } from '../../data/locationConfig'
import { sendProfileCreatedEmail } from '../../lib/emailNotifications'

const CreateProfilePage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, refreshProfile } = useAuth()

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    profession: '',
    city: '',
    state_province: '',
    country: 'United States',
    session_types: [],
    website: '',
    phone: ''
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [utmParams, setUtmParams] = useState({})

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
  }

  const handleSessionTypeToggle = (type) => {
    setFormData(prev => ({
      ...prev,
      session_types: prev.session_types.includes(type)
        ? prev.session_types.filter(t => t !== type)
        : [...prev.session_types, type]
    }))
  }

  const generateSlug = (name, city, state) => {
    const baseSlug = `${name}-${city}-${state}`
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    // Add timestamp to ensure uniqueness
    const timestamp = Date.now().toString(36)
    return `${baseSlug}-${timestamp}`
  }

  const getStateSlug = (stateName) => {
    // Find the state slug from STATE_CONFIG
    for (const [slug, config] of Object.entries(STATE_CONFIG)) {
      if (config.name === stateName || config.abbr === stateName) {
        return slug
      }
    }
    // Fallback: convert state name to slug
    return stateName.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '')
  }

  const getCitySlug = (cityName) => {
    return cityName.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '')
  }

  const validateForm = () => {
    setError('')

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

    if (!formData.city.trim()) {
      setError('Please enter your city')
      return false
    }

    if (!formData.state_province.trim()) {
      setError('Please enter your state/province')
      return false
    }

    if (formData.session_types.length === 0) {
      setError('Please select at least one session type')
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

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
        city: formData.city.trim(),
        state_province: formData.state_province.trim(),
        country: formData.country,
        session_types: formData.session_types,
        slug: slug,
        is_claimed: true,
        claimed_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
        tier: 'community',
        contact_reveals_count: 0,
        accepting_new_clients: true,
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

      // Track the profile creation
      trackProfileClaim(profile.id, 'self_service')

      // Refresh the user's profile in auth context
      await refreshProfile()

      // Navigate to success page with profile info
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
        // Don't block on email failure
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
      } else if (err.message) {
        setError(`Unable to create profile: ${err.message}`)
      } else {
        setError('There was an error creating your profile. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

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

  const sessionTypeOptions = [
    { value: 'in-person', label: 'In-Person' },
    { value: 'online', label: 'Online/Virtual' },
    { value: 'hybrid', label: 'Hybrid (Both)' }
  ]

  if (!user) {
    return (
      <div className="container" style={{ padding: 'var(--space-20) 0', textAlign: 'center' }}>
        <SEOHelmet
          title="Create Your Free Profile"
          description="Create your free profile on WeddingCounselors.com and start connecting with engaged couples."
          url="/professional/create"
        />
        <div style={{
          background: 'var(--white)',
          padding: 'var(--space-12)',
          borderRadius: 'var(--radius-2xl)',
          boxShadow: 'var(--shadow-xl)',
          maxWidth: '500px',
          margin: '0 auto'
        }}>
          <h2>Sign Up Required</h2>
          <p className="text-secondary mb-6">
            Please create an account first to create your professional profile.
          </p>
          <a href="/professional/signup" className="btn btn-primary btn-large">
            Create Account
          </a>
          <p className="mt-4 text-small text-muted">
            Already have an account? <a href="/professional/login">Sign In</a>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{ padding: 'var(--space-12) 0' }}>
      <SEOHelmet
        title="Create Your Free Profile - Wedding Counselors"
        description="Join the Wedding Counselors directory for free. Create your professional profile and start receiving leads from engaged couples seeking premarital counseling."
        url="/professional/create"
      />

      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-10)' }}>
          <h1>Create Your Free Profile</h1>
          <p className="text-large text-secondary">
            Get listed instantly and start connecting with engaged couples today.
          </p>
          <p className="text-small text-muted mt-2">
            Your profile will be live immediately. You can add more details later.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: '#fee',
            border: '1px solid #fcc',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
            marginBottom: 'var(--space-6)',
            color: '#c33',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)'
          }}>
            <i className="fa fa-exclamation-circle" aria-hidden="true"></i>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <div style={{
          background: 'var(--white)',
          padding: 'var(--space-8)',
          borderRadius: 'var(--radius-2xl)',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--gray-200)'
        }}>
          <form onSubmit={handleSubmit}>
            {/* Basic Info */}
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <h3 style={{ marginBottom: 'var(--space-4)', color: 'var(--primary)' }}>
                Basic Information
              </h3>

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
                    placeholder="Dr. Jane Smith"
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
                    placeholder="jane@example.com"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Phone (Optional)</label>
                  <input
                    type="tel"
                    id="phone"
                    className="form-control"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="website">Website (Optional)</label>
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

            {/* Location */}
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <h3 style={{ marginBottom: 'var(--space-4)', color: 'var(--primary)' }}>
                Practice Location
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
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
                    placeholder="Texas"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="country">Country</label>
                <select
                  id="country"
                  className="form-control"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                >
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Australia">Australia</option>
                  <option value="Ireland">Ireland</option>
                  <option value="New Zealand">New Zealand</option>
                </select>
              </div>
            </div>

            {/* Session Types */}
            <div style={{ marginBottom: 'var(--space-8)' }}>
              <h3 style={{ marginBottom: 'var(--space-4)', color: 'var(--primary)' }}>
                Session Types *
              </h3>
              <p className="text-small text-muted mb-4">
                Select all that apply
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                {sessionTypeOptions.map(option => (
                  <label
                    key={option.value}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      padding: 'var(--space-3) var(--space-4)',
                      borderRadius: 'var(--radius-lg)',
                      border: `2px solid ${formData.session_types.includes(option.value) ? 'var(--primary)' : 'var(--gray-300)'}`,
                      background: formData.session_types.includes(option.value) ? 'var(--primary-light)' : 'var(--white)',
                      transition: 'all var(--transition-normal)'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.session_types.includes(option.value)}
                      onChange={() => handleSessionTypeToggle(option.value)}
                      style={{ marginRight: 'var(--space-2)' }}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary btn-large"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? 'Creating Your Profile...' : 'Create Free Profile'}
            </button>

            <p className="text-center text-small text-muted mt-4">
              By creating a profile, you agree to our{' '}
              <a href="/terms" target="_blank">Terms of Service</a> and{' '}
              <a href="/privacy" target="_blank">Privacy Policy</a>.
            </p>
          </form>
        </div>

        {/* Benefits */}
        <div style={{
          marginTop: 'var(--space-10)',
          background: 'var(--gray-50)',
          padding: 'var(--space-6)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--gray-200)'
        }}>
          <h3 style={{ marginBottom: 'var(--space-4)' }}>What You Get (Free)</h3>
          <ul style={{ color: 'var(--gray-700)', lineHeight: 1.8 }}>
            <li><strong>Instant visibility</strong> - Your profile goes live immediately</li>
            <li><strong>SEO-optimized listing</strong> - Appear in local search results</li>
            <li><strong>Direct leads</strong> - Couples can contact you directly</li>
            <li><strong>Complete control</strong> - Edit your profile anytime</li>
            <li><strong>No commitment</strong> - Cancel or hide your profile anytime</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default CreateProfilePage
