import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Link, useNavigate, useLocation } from 'react-router-dom'

const LoginForm = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetEmailSent, setResetEmailSent] = useState(false)

  const { signIn, signInWithGoogle, resetPassword } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Redirect to intended page after login, or to dashboard
  const from = location.state?.from?.pathname || '/professional/dashboard'

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError('')

    const { error } = await signInWithGoogle()

    if (error) {
      setError(error.message)
      setLoading(false)
    }
    // Note: OAuth will redirect automatically, so we don't need to handle success here
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email || !password) {
      setError('Please enter both email and password')
      return
    }

    setLoading(true)
    setError('')

    const { error } = await signIn(email, password)

    if (error) {
      setError(error.message)
    } else {
      navigate(from, { replace: true })
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

        <div className="auth-separator">
          <span>or</span>
        </div>

        <div className="auth-social">
          <button 
            className="btn btn-outline btn-full"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <i className="fab fa-google"></i>
            Sign in with Google
          </button>
        </div>

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
  )
}

export default LoginForm
