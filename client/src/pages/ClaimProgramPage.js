import React, { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const ClaimProgramPage = () => {
  const { token } = useParams()
  const [claimantEmail, setClaimantEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!claimantEmail || !token) {
      setError('Please enter the office email address tied to this program.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const { data, error: claimError } = await supabase.functions.invoke('claim-program', {
        body: {
          token,
          claimantEmail
        }
      })

      if (claimError) {
        throw new Error(claimError.message || 'Unable to verify this claim link.')
      }

      if (data?.error) {
        throw new Error(data.error)
      }

      setResult(data)
    } catch (submitError) {
      setError(submitError.message || 'Unable to verify this claim link.')
    } finally {
      setSubmitting(false)
    }
  }

  if (result?.success) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card" style={{ textAlign: 'center' }}>
            <h1 style={{ marginBottom: 'var(--space-3)' }}>Program Verified</h1>
            <p style={{ marginBottom: 'var(--space-6)' }}>
              This program is now verified and published.
            </p>
            <Link to="/premarital-counseling/catholic" className="btn btn-primary">
              View Catholic Programs
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (result?.manualReviewRequired) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card" style={{ textAlign: 'center' }}>
            <h1 style={{ marginBottom: 'var(--space-3)' }}>Manual Review Required</h1>
            <p style={{ marginBottom: 'var(--space-6)' }}>
              We could not auto-verify this request by domain. Our team has been notified and will review shortly.
            </p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
              Questions? Email <a href="mailto:hello@weddingcounselors.com">hello@weddingcounselors.com</a>
            </p>
            <Link to="/" className="btn btn-outline">
              Return Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <h1 style={{ marginBottom: 'var(--space-3)' }}>Verify Program Listing</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-5)' }}>
            Enter the parish or office email address that received this link.
          </p>

          {error && (
            <div className="error-message" style={{ marginBottom: 'var(--space-4)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="claimantEmail">Office Email</label>
              <input
                id="claimantEmail"
                type="email"
                value={claimantEmail}
                onChange={(event) => setClaimantEmail(event.target.value)}
                placeholder="office@parish.org"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: '100%' }}>
              {submitting ? 'Verifying...' : 'Verify Program'}
            </button>
          </form>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 'var(--space-4)' }}>
            This secure link expires automatically.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ClaimProgramPage
