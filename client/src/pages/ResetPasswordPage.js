import React, { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const { updatePassword, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        navigate('/professional/dashboard', { replace: true })
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [success, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!password) {
      setError('Please enter a new password')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    setError('')

    const { error: updateError } = await updatePassword(password)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <>
        <Helmet><meta name="robots" content="noindex, follow" /></Helmet>
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-header">
              <h2>Password Updated</h2>
              <p>Your password has been reset successfully. Redirecting to your dashboard...</p>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (!user) {
    return (
      <>
        <Helmet><meta name="robots" content="noindex, follow" /></Helmet>
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-header">
              <h2>Reset Your Password</h2>
              <p>This link may have expired or already been used. Please request a new password reset.</p>
            </div>
            <div className="auth-form">
              <button
                className="btn btn-primary btn-full"
                onClick={() => navigate('/professional/login')}
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Helmet><meta name="robots" content="noindex, follow" /></Helmet>
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Set New Password</h2>
            <p>Enter your new password below</p>
          </div>

          {error && (
            <div className="error-message">
              <i className="fa fa-exclamation-circle" aria-hidden="true"></i>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="new-password">New Password</label>
              <input
                type="password"
                id="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                autoComplete="new-password"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirm-new-password">Confirm New Password</label>
              <input
                type="password"
                id="confirm-new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                required
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}

export default ResetPasswordPage
