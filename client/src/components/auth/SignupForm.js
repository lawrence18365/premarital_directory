import React, { useState } from 'react'
import { Helmet } from 'react-helmet'
import { useAuth } from '../../contexts/AuthContext'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
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
    agreeToTerms: false,
    marketingOptIn: true
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState(searchParams.get('mode') === 'login' ? 'login' : 'signup')
  const [loginPassword, setLoginPassword] = useState('')
  const [resetEmailSent, setResetEmailSent] = useState(false)

  const { signUp, signIn, resetPassword, user, profile } = useAuth()
  const navigate = useNavigate()

  // Persist referral code so it survives the signup→verify→onboarding redirect chain
  React.useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) {
      sessionStorage.setItem('wc_referral_code', ref)
    }
  }, [searchParams])

  // Redirect logged-in users
  React.useEffect(() => {
    if (user && profile?.onboarding_completed) {
      navigate('/professional/dashboard', { replace: true })
    } else if (user && profile && !profile.onboarding_completed) {
      navigate('/professional/onboarding', { replace: true })
    }
  }, [user, profile, navigate])

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
    const { exists, profile: existingProfile, error: checkError } = await profileOperations.checkEmailExists(formData.email)

    if (checkError) {
      console.error('Error checking email:', checkError)
      // Continue with signup if check fails (don't block on this)
    } else if (exists && existingProfile?.is_claimed && existingProfile?.user_id) {
      // Only block if the profile is already claimed by someone with an account
      setError('EXISTING_PROFILE')
      setLoading(false)
      return
    }
    // If profile exists but is unclaimed (imported), let them sign up -
    // CreateProfilePage will auto-claim it after email verification

    const { data, error } = await signUp(formData.email, formData.password, {
      marketing_opt_in: formData.marketingOptIn
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Detect existing account: Supabase returns user with empty identities array
    // for existing confirmed accounts (security feature to prevent email enumeration)
    if (data?.user && (!data.user.identities || data.user.identities.length === 0)) {
      // Auto-switch to login mode instead of showing a confusing error
      setMode('login')
      setError('')
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

  const handleLogin = async (e) => {
    e.preventDefault()
    const loginEmail = formData.email || ''
    if (!loginEmail || !loginPassword) {
      setError('Please enter your email and password')
      return
    }
    setLoading(true)
    setError('')
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Login timed out. Please check your connection and try again.')), 30000)
      )
      const { error } = await Promise.race([signIn(loginEmail, loginPassword), timeoutPromise])
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      navigate('/professional/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  const handleForgotPassword = async () => {
    const loginEmail = formData.email || ''
    if (!loginEmail) {
      setError('Please enter your email address first')
      return
    }
    setLoading(true)
    setError('')
    const { error } = await resetPassword(loginEmail)
    if (error) {
      setError(error.message)
    } else {
      setResetEmailSent(true)
    }
    setLoading(false)
  }

  if (resetEmailSent) {
    return (
      <div className="professional-auth professional-auth--success">
        <div className="professional-auth__success-card">
          <div className="professional-auth__success-icon">
            <i className="fa fa-envelope" aria-hidden="true"></i>
          </div>
          <p className="section-eyebrow">Password reset sent</p>
          <h1>Check your email</h1>
          <p className="professional-auth__success-lead">
            We've sent a password reset link to <strong>{formData.email}</strong>. Click it to set a new password, then log in.
          </p>
          <button
            className="professional-auth__button professional-auth__button--primary"
            onClick={() => { setResetEmailSent(false); setMode('login') }}
          >
            Back to Login
          </button>
        </div>
      </div>
    )
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
            <li>Complete your profile and go live instantly.</li>
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
    <>
    <Helmet><meta name="robots" content="noindex, follow" /></Helmet>
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
          {/* Tab switcher */}
          <div className="professional-auth__tabs" style={{ display: 'flex', borderBottom: '2px solid var(--gray-200, #e5e7eb)', marginBottom: '1.5rem' }}>
            <button
              type="button"
              onClick={() => { setMode('login'); setError('') }}
              style={{
                flex: 1, padding: '0.75rem 1rem', border: 'none', background: 'none', cursor: 'pointer',
                fontWeight: mode === 'login' ? '600' : '400',
                borderBottom: mode === 'login' ? '2px solid var(--primary, #2563eb)' : '2px solid transparent',
                color: mode === 'login' ? 'var(--primary, #2563eb)' : 'var(--slate, #64748b)',
                marginBottom: '-2px', fontSize: '1rem'
              }}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError('') }}
              style={{
                flex: 1, padding: '0.75rem 1rem', border: 'none', background: 'none', cursor: 'pointer',
                fontWeight: mode === 'signup' ? '600' : '400',
                borderBottom: mode === 'signup' ? '2px solid var(--primary, #2563eb)' : '2px solid transparent',
                color: mode === 'signup' ? 'var(--primary, #2563eb)' : 'var(--slate, #64748b)',
                marginBottom: '-2px', fontSize: '1rem'
              }}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="professional-auth__alert" role="alert">
              <i className="fa fa-exclamation-circle" aria-hidden="true"></i>
              {error === 'EXISTING_PROFILE' ? (
                <span>
                  An account with this email already exists.{' '}
                  <button className="link-button" onClick={() => { setMode('login'); setError('') }} style={{ color: 'inherit', fontWeight: '600' }}>
                    Log in instead
                  </button>
                </span>
              ) : (
                <span>{error}</span>
              )}
            </div>
          )}

          {mode === 'login' ? (
            <>
              <div className="professional-auth__form-header">
                <h2>Welcome back</h2>
                <p>Log in to continue setting up your profile</p>
              </div>
              <form onSubmit={handleLogin} className="professional-auth__form">
                <div className="form-group">
                  <label htmlFor="login-email">Email Address</label>
                  <input
                    type="email"
                    id="login-email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="your.email@example.com"
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="login-password">Password</label>
                  <input
                    type="password"
                    id="login-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                  />
                </div>
                <button type="submit" className="professional-auth__button professional-auth__button--primary" disabled={loading}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
                <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
                  <button type="button" className="link-button" onClick={handleForgotPassword} disabled={loading} style={{ fontSize: '0.9rem' }}>
                    Forgot your password?
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <div className="professional-auth__form-header">
                <h2>Create your free account</h2>
                <p>Join the directory and get listed for free</p>
              </div>
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

                <label className="professional-auth__checkbox">
                  <input
                    type="checkbox"
                    name="marketingOptIn"
                    checked={formData.marketingOptIn}
                    onChange={handleChange}
                  />
                  <span>Send me tips to get more couples and directory updates (you can unsubscribe anytime)</span>
                </label>

                <button type="submit" className="professional-auth__button professional-auth__button--primary" disabled={loading}>
                  {loading ? 'Creating your account...' : 'Create Free Account'}
                </button>
              </form>
            </>
          )}
        </div>

        <aside className="professional-auth__aside">
          <h3>What happens next?</h3>
          <ul>
            <li><strong>Step 1:</strong> Create your account (you're here)</li>
            <li><strong>Step 2:</strong> Verify your email</li>
            <li><strong>Step 3:</strong> Complete your profile</li>
            <li><strong>Step 4:</strong> Go live instantly</li>
          </ul>
          <p style={{marginTop: '1rem', fontSize: '0.9rem', color: 'var(--slate)'}}>
            Your profile goes live as soon as you complete it. Edit anytime from your dashboard.
          </p>
        </aside>
      </section>
    </div>
    </>
  )
}

export default SignupForm
