import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

const INTEREST_OPTIONS = [
  { value: 'counseling', label: 'Premarital counseling' },
  { value: 'officiant', label: 'Wedding officiant / clergy' },
  { value: 'both', label: 'Both' },
]

const inputStyle = {
  padding: '10px 14px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  fontSize: '0.9rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

const selectStyle = {
  ...inputStyle,
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: '32px',
}

/**
 * Email capture for couples interested in premarital counseling or officiant services.
 * Collects: name, email, interest (counseling/officiant/both), city/state.
 * Triggers guide delivery + drip sequence via edge function.
 */
const CoupleEmailCapture = ({ sourcePage = 'unknown', defaultCity = '', defaultState = '' }) => {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [interest, setInterest] = useState('counseling')
  const [city, setCity] = useState(defaultCity)
  const [state, setState] = useState(defaultState)
  const [status, setStatus] = useState('idle') // idle | submitting | success | error
  const [dismissed, setDismissed] = useState(false)

  // Check if already submitted (localStorage)
  useEffect(() => {
    if (localStorage.getItem('wc_guide_subscribed')) {
      setDismissed(true)
    }
  }, [])

  if (dismissed && status !== 'success') return null

  if (status === 'success') {
    return (
      <div style={{
        background: '#f0fdf4',
        border: '1px solid #bbf7d0',
        borderRadius: '12px',
        padding: '24px',
        textAlign: 'center',
        margin: '32px 0'
      }}>
        <div style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '8px', color: '#166534' }}>
          Your guide is on the way
        </div>
        <p style={{ color: '#166534', margin: '0 0 12px', fontSize: '0.95rem' }}>
          Check your inbox at <strong>{email}</strong> for "10 Questions Every Couple Should Discuss Before Marriage."
        </p>
        <p style={{ color: '#4b5563', margin: 0, fontSize: '0.85rem' }}>
          We'll also send you personalized counselor recommendations
          {city ? ` in ${city}` : ''} over the next week.
        </p>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return

    setStatus('submitting')
    try {
      // Save to DB
      const { error } = await supabase
        .from('couple_subscribers')
        .upsert({
          email: email.toLowerCase().trim(),
          first_name: name.trim() || null,
          interest,
          city: city.trim() || null,
          state: state.trim() || null,
          source_page: sourcePage,
        }, { onConflict: 'email' })

      if (error) throw error

      // Trigger guide delivery edge function (fire and forget)
      fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/send-couple-guide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          first_name: name.trim() || null,
          interest,
          city: city.trim() || null,
          state: state.trim() || null,
        })
      }).catch(() => {}) // Don't block on this

      localStorage.setItem('wc_guide_subscribed', '1')
      setStatus('success')
    } catch (err) {
      console.error('Email capture error:', err)
      setStatus('error')
    }
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f0f9ff 0%, #f0fdf4 100%)',
      border: '1px solid #d1e7dd',
      borderRadius: '12px',
      padding: '28px 24px',
      margin: '32px 0',
      position: 'relative'
    }}>
      <button
        onClick={() => { setDismissed(true); localStorage.setItem('wc_guide_dismissed', '1') }}
        aria-label="Dismiss"
        style={{
          position: 'absolute', top: '12px', right: '12px',
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#9ca3af', fontSize: '18px', lineHeight: 1, padding: '4px'
        }}
      >
        &times;
      </button>

      <div style={{ maxWidth: '520px' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: '1.15rem', fontWeight: 700, color: '#111827' }}>
          Free Guide: 10 Questions Every Couple Should Discuss Before Marriage
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: '0.9rem', color: '#4b5563', lineHeight: 1.5 }}>
          Get the guide counselors use with their clients — plus personalized recommendations for your area.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Row 1: Name + Email */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
            <div style={{ flex: '0 0 140px', minWidth: '120px' }}>
              <input
                type="text"
                placeholder="First name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
          </div>

          {/* Row 2: Interest + City/State */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
            <div style={{ flex: '1 1 180px' }}>
              <select
                value={interest}
                onChange={(e) => setInterest(e.target.value)}
                style={selectStyle}
              >
                <option value="" disabled>What are you looking for?</option>
                {INTEREST_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: '1 1 180px' }}>
              <input
                type="text"
                placeholder="City, State (e.g. Nashville, TN)"
                value={city && state ? `${city}, ${state}` : city || state || ''}
                onChange={(e) => {
                  const val = e.target.value
                  const parts = val.split(',').map(s => s.trim())
                  setCity(parts[0] || '')
                  setState(parts[1] || '')
                }}
                style={inputStyle}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={status === 'submitting'}
            style={{
              width: '100%',
              padding: '12px 20px',
              background: '#0d9488',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: status === 'submitting' ? 'wait' : 'pointer',
              opacity: status === 'submitting' ? 0.7 : 1,
            }}
          >
            {status === 'submitting' ? 'Sending…' : 'Send Me the Free Guide'}
          </button>
        </form>

        {status === 'error' && (
          <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#dc2626' }}>
            Something went wrong. Please try again.
          </p>
        )}

        <p style={{ margin: '10px 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>
          No spam. Just the guide and a few helpful emails. Unsubscribe anytime.
        </p>
      </div>
    </div>
  )
}

export default CoupleEmailCapture
