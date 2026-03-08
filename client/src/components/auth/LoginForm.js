import React, { useState } from 'react'
import { Helmet } from 'react-helmet'
import { useAuth } from '../../contexts/AuthContext'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

const LoginForm = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false)
  const [resendStatus, setResendStatus] = useState(null) // 'sending', 'success', 'error'

  const { signIn, resetPassword } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Redirect to intended page after login, or to dashboard
  const from = location.state?.from?.pathname || '/professional/dashboard'

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email || !password) {
      setError('Please enter both email and password')
      return
    }

    setLoading(true)
    setError('')

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Login is taking longer than expected. Please check your connection and try again.')), 30000)
      )
      const { error } = await Promise.race([signIn(email, password), timeoutPromise])

      if (error) {
        if (error.message?.toLowerCase().includes('email not confirmed')) {
          setEmailNotConfirmed(true)
          setError('')
        } else {
          setError(error.message)
        }
      } else {
        // AuthContext automatically fetches the profile in the background after session established.
        // The safest redirect is still to the dashboard, and let the dashboard's new logic 
        // cleanly bounce `draft` profiles to the onboarding funnel, rather than introducing race conditions here.
        navigate(from, { replace: true })
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    }

    setLoading(false)
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()

    if (!email) {
      setError('Please enter your email address first')
      return
    }

    setLoading(true)
    setError('')

    const { error } = await resetPassword(email)

    if (error) {
      setError(error.message)
    } else {
      setResetEmailSent(true)
    }

    setLoading(false)
  }

  const handleResendConfirmation = async () => {
    setResendStatus('sending')
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim()
      })
      setResendStatus(error ? 'error' : 'success')
    } catch {
      setResendStatus('error')
    }
  }

  if (emailNotConfirmed) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Confirm Your Email</h2>
            <p>Your account exists but your email hasn't been verified yet. Check your inbox for a confirmation link from when you signed up.</p>
          </div>
          <div className="auth-form">
            {resendStatus === 'success' ? (
              <p style={{ color: 'green', textAlign: 'center' }}>
                <i className="fa fa-check-circle" aria-hidden="true"></i>{' '}
                Confirmation email sent to <strong>{email}</strong>. Check your inbox and spam folder.
              </p>
            ) : (
              <button
                className="btn btn-primary btn-full"
                onClick={handleResendConfirmation}
                disabled={resendStatus === 'sending'}
              >
                {resendStatus === 'sending' ? 'Sending...' : 'Resend Confirmation Email'}
              </button>
            )}
            {resendStatus === 'error' && (
              <p style={{ color: 'red', textAlign: 'center', marginTop: '0.5rem' }}>
                Failed to resend. Please try again.
              </p>
            )}
            <button
              className="btn btn-outline"
              onClick={() => { setEmailNotConfirmed(false); setResendStatus(null) }}
              style={{ marginTop: '0.75rem' }}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (resetEmailSent) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Check Your Email</h2>
            <p>We've sent you a password reset link at {email}</p>
          </div>
          <div className="auth-form">
            <button
              className="btn btn-outline"
              onClick={() => setResetEmailSent(false)}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Helmet><meta name="robots" content="noindex, follow" /></Helmet>
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Professional Login</h2>
            <p>Access your professional dashboard and manage your profile</p>
          </div>

          {error && (
            <div className="error-message">
              <i className="fa fa-exclamation-circle" aria-hidden="true"></i>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-links">
            <button
              className="link-button"
              onClick={handleResetPassword}
              disabled={loading}
            >
              Forgot your password?
            </button>
          </div>

          <div className="auth-footer">
            <p>
              Don't have an account?
              <Link to="/professional/signup" className="auth-link">
                Sign Up
              </Link>
            </p>
            <p>
              Looking for counseling?
              <Link to="/" className="auth-link">
                Browse Professionals
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export default LoginForm
