import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import SEOHelmet from '../components/analytics/SEOHelmet'

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL

const UnsubscribePage = () => {
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('')

  // If profile_id is in URL, redirect to the edge function directly
  const profileId = searchParams.get('profile_id')
  const type = searchParams.get('type') || 'marketing'

  useEffect(() => {
    if (profileId) {
      window.location.href = `/api/unsubscribe?profile_id=${profileId}&type=${type}`
    }
  }, [profileId, type])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) return

    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/unsubscribe-digest?email=${encodeURIComponent(trimmed)}`
      )
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Unsubscribe failed')
      }

      setStatus('success')
    } catch (err) {
      console.error('Unsubscribe error:', err)
      setErrorMsg('Something went wrong. Please email hello@weddingcounselors.com and we will remove you immediately.')
      setStatus('error')
    }
  }

  // Show loading while redirecting profile-based unsubscribe
  if (profileId) {
    return (
      <div className="page-container about-page">
        <div className="container">
          <div className="container-narrow" style={{ textAlign: 'center', padding: '4rem 0' }}>
            <p>Unsubscribing...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container about-page">
      <SEOHelmet
        title="Unsubscribe | Wedding Counselors Directory"
        description="Unsubscribe from Wedding Counselors Directory emails."
        url="/unsubscribe"
        noIndex={true}
      />
      <div className="container">
        <div className="container-narrow" style={{ maxWidth: '480px', margin: '0 auto', padding: '3rem 1rem' }}>
          {status === 'success' ? (
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ color: '#0d9488', fontSize: '1.5rem', marginBottom: '1rem' }}>You've been unsubscribed</h1>
              <p style={{ color: '#6b7280', lineHeight: 1.6 }}>
                We've removed your email from all mailing lists. You will not receive any further emails from us.
              </p>
              <p style={{ color: '#6b7280', lineHeight: 1.6, marginTop: '1rem' }}>
                If you continue to receive emails, please contact{' '}
                <a href="mailto:hello@weddingcounselors.com" style={{ color: '#0d9488' }}>hello@weddingcounselors.com</a>.
              </p>
            </div>
          ) : (
            <>
              <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Unsubscribe</h1>
              <p style={{ color: '#6b7280', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                Enter your email address to unsubscribe from all Wedding Counselors Directory emails.
              </p>
              <form onSubmit={handleSubmit}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    fontSize: '1rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: 'white',
                    backgroundColor: status === 'loading' ? '#9ca3af' : '#0d9488',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: status === 'loading' ? 'not-allowed' : 'pointer'
                  }}
                >
                  {status === 'loading' ? 'Unsubscribing...' : 'Unsubscribe'}
                </button>
              </form>
              {status === 'error' && (
                <p style={{ color: '#dc2626', marginTop: '1rem', fontSize: '0.9rem' }}>{errorMsg}</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default UnsubscribePage
