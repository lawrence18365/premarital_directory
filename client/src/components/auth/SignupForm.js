import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import '../../assets/css/professional-auth.css'

const signupHighlights = [
  { label: '12+', detail: 'active metro directories' },
  { label: '0%', detail: 'commission or referral fees' },
  { label: '5 min', detail: 'average setup time' }
]

const featureList = [
  'City + statewide listing with SEO support',
  'Direct inquiries (email + phone — no middleman)',
  'Update profile, availability, and pricing anytime',
  'Optional upgrades for featured placement'
]

const professionOptions = [
  'Licensed Therapist',
  'Marriage & Family Therapist',
  'Certified Coach',
  'Clergy/Pastor',
  'Licensed Clinical Social Worker',
  'Licensed Psychologist'
]

const SignupForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    profession: professionOptions[0],
    phone: '',
    agreeToTerms: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.email || !formData.password || !formData.fullName) {
      setError('Please fill in all required fields')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    if (!formData.agreeToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy')
      return
    }

    setLoading(true)
    setError('')

    const { data, error } = await signUp(formData.email, formData.password, {
      full_name: formData.fullName,
      profession: formData.profession,
      phone: formData.phone
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
      // Navigate to confirmation page after a delay
      setTimeout(() => {
        navigate('/professional/confirm-email')
      }, 3000)
    }
  }

  if (success) {
    return (
      <div className="professional-auth professional-auth--success">
        <div className="professional-auth__success-card">
          <div className="professional-auth__success-icon">
            <i className="fa fa-check-circle" aria-hidden="true"></i>
          </div>
          <p className="section-eyebrow">Email on its way</p>
          <h1>Confirm your email to finish setup</h1>
          <p className="professional-auth__success-lead">
            We’ve sent a confirmation link to <strong>{formData.email}</strong>. Click it to activate your account and publish your profile.
          </p>
          <ol className="professional-auth__success-steps">
            <li>Check your inbox (and spam folder just in case).</li>
            <li>Click the verification link to secure your account.</li>
            <li>Complete your profile details and go live.</li>
          </ol>
          <Link to="/professional/login" className="professional-auth__button professional-auth__button--primary">
            Go to Login
          </Link>
          <p className="professional-auth__panel-note">
            Didn’t get it? Check spam or <button className="link-button" onClick={() => setSuccess(false)}>resend</button>.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="professional-auth">
      <div className="professional-auth__hero">
        <div className="professional-auth__hero-copy">
          <p className="section-eyebrow">Professional signup</p>
          <h1>Join the directory trusted by engaged couples</h1>
          <p className="professional-auth__hero-text">
            Create a free account to secure your spot on city and statewide listings. Couples contact you directly—no hidden fees, no middlemen.
          </p>
          <div className="professional-auth__stats">
            {signupHighlights.map((item) => (
              <div className="professional-auth__stat" key={item.detail}>
                <span className="professional-auth__stat-value">{item.label}</span>
                <span className="professional-auth__stat-label">{item.detail}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="professional-auth__hero-panel">
          <h3>Why professionals join</h3>
          <ul>
            {featureList.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </div>
      </div>

      <section className="professional-auth__content">
        <div className="professional-auth__form-card">
          <div className="professional-auth__form-header">
            <h2>Create your free account</h2>
            <p>Already have an account? <Link to="/professional/login">Sign in</Link></p>
          </div>

          {error && (
            <div className="professional-auth__alert" role="alert">
              <i className="fa fa-exclamation-circle" aria-hidden="true"></i>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="professional-auth__form">
            <div className="professional-auth__grid professional-auth__grid--2">
              <div className="form-group">
                <label htmlFor="fullName">Full Name *</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Dr. Sarah Mitchell"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="profession">Professional Type *</label>
                <select
                  id="profession"
                  name="profession"
                  value={formData.profession}
                  onChange={handleChange}
                  required
                >
                  {professionOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your.email@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number (optional)</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(555) 123-4567"
                autoComplete="tel"
              />
            </div>

            <div className="professional-auth__grid professional-auth__grid--2">
              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a secure password"
                  required
                  autoComplete="new-password"
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            <label className="professional-auth__checkbox">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                required
              />
              <span>I agree to the <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link></span>
            </label>

            <button type="submit" className="professional-auth__button professional-auth__button--primary" disabled={loading}>
              {loading ? 'Creating your account...' : 'Create Free Account'}
            </button>
          </form>
        </div>

        <aside className="professional-auth__aside">
          <h3>Included with your account</h3>
          <ul>
            <li>Profile visible on city + statewide directories</li>
            <li>Direct inquiries sent straight to your inbox</li>
            <li>Analytics dashboard for profile views & contacts</li>
            <li>Edit availability, pricing, and session types anytime</li>
            <li>Upgrade later for featured placement when you're ready</li>
          </ul>
        </aside>
      </section>
    </div>
  )
}

}

export default SignupForm
