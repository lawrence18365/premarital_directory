import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import { profileOperations } from '../../lib/supabaseClient'
import '../../assets/css/professional-auth.css'

const featureList = [
  'Get listed in city + statewide directories',
  'Couples contact you directly — no middleman fees',
  'Full control over your profile and availability',
  'Free forever, with optional upgrades'
]

const SignupForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
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
    if (!formData.email || !formData.password) {
      setError('Please enter your email and password')
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

    // Check if a profile with this email already exists BEFORE creating auth account
    const { exists, error: checkError } = await profileOperations.checkEmailExists(formData.email)

    if (checkError) {
      console.error('Error checking email:', checkError)
      // Continue with signup if check fails (don't block on this)
    } else if (exists) {
      setError('EXISTING_PROFILE')
      setLoading(false)
      return
    }

    const { data, error } = await signUp(formData.email, formData.password)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Detect existing account: Supabase returns user with empty identities array
    // for existing confirmed accounts (security feature to prevent email enumeration)
    if (data?.user && (!data.user.identities || data.user.identities.length === 0)) {
      setError('EXISTING_ACCOUNT')
      setLoading(false)
      return
    }

    // Success - new account created, confirmation email sent
    setSuccess(true)
    setLoading(false)
    setTimeout(() => {
      navigate('/professional/confirm-email', { state: { email: formData.email } })
    }, 3000)
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
            We've sent a confirmation link to <strong>{formData.email}</strong>. Click it to activate your account.
          </p>
          <ol className="professional-auth__success-steps">
            <li>Check your inbox (and spam folder just in case).</li>
            <li>Click the verification link to secure your account.</li>
            <li>Complete your profile and submit for review.</li>
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
              {error === 'EXISTING_ACCOUNT' || error === 'EXISTING_PROFILE' ? (
                <span>
                  An account with this email already exists.{' '}
                  <Link to="/professional/login" style={{ color: 'inherit', fontWeight: '600' }}>
                    Sign in here
                  </Link>
                </span>
              ) : (
                <span>{error}</span>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="professional-auth__form">
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
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
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
          <h3>What happens next?</h3>
          <ul>
            <li><strong>Step 1:</strong> Create your account (you're here)</li>
            <li><strong>Step 2:</strong> Verify your email</li>
            <li><strong>Step 3:</strong> Complete your profile</li>
            <li><strong>Step 4:</strong> Quick review, then you're live</li>
          </ul>
          <p style={{marginTop: '1rem', fontSize: '0.9rem', color: 'var(--slate)'}}>
            We review new profiles to maintain directory quality. Most profiles are approved within 24 hours.
          </p>
        </aside>
      </section>
    </div>
  )
}

export default SignupForm
