import React, { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

/**
 * Email capture component for couples.
 * Offers a free guide in exchange for email.
 * Shows on blog posts and city pages.
 */
const CoupleEmailCapture = ({ sourcePage = 'unknown' }) => {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [status, setStatus] = useState('idle') // idle | submitting | success | error
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || status === 'success') {
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
          <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Check your inbox</div>
          <p style={{ color: '#166534', margin: 0, fontSize: '0.95rem' }}>
            We just sent the guide to <strong>{email}</strong>. Look for an email from Wedding Counselors.
          </p>
        </div>
      )
    }
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return

    setStatus('submitting')
    try {
      const { error } = await supabase
        .from('couple_subscribers')
        .upsert({
          email: email.toLowerCase().trim(),
          first_name: name.trim() || null,
          source_page: sourcePage,
        }, { onConflict: 'email' })

      if (error) throw error
      setStatus('success')
    } catch (err) {
      console.error('Email capture error:', err)
      setStatus('error')
    }
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f0f9ff 0%, #f0fdf4 100%)',
      border: '1px solid #e0f2fe',
      borderRadius: '12px',
      padding: '28px 24px',
      margin: '32px 0',
      position: 'relative'
    }}>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        style={{
          position: 'absolute', top: '12px', right: '12px',
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#9ca3af', fontSize: '18px', lineHeight: 1, padding: '4px'
        }}
      >
        &times;
      </button>

      <div style={{ maxWidth: '480px' }}>
        <h3 style={{ margin: '0 0 6px', fontSize: '1.15rem', fontWeight: 700, color: '#111827' }}>
          Free Guide: 10 Questions Every Couple Should Discuss Before Marriage
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: '0.9rem', color: '#4b5563', lineHeight: 1.5 }}>
          The conversations that matter most — finances, family, expectations, and more.
          Used by hundreds of counselors with their clients.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <input
            type="text"
            placeholder="First name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              flex: '0 0 120px',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              flex: '1 1 200px',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={status === 'submitting'}
            style={{
              flex: '0 0 auto',
              padding: '10px 20px',
              background: '#0d9488',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: status === 'submitting' ? 'wait' : 'pointer',
              opacity: status === 'submitting' ? 0.7 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            {status === 'submitting' ? 'Sending…' : 'Send Me the Guide'}
          </button>
        </form>

        {status === 'error' && (
          <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#dc2626' }}>
            Something went wrong. Please try again.
          </p>
        )}

        <p style={{ margin: '10px 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>
          No spam. Unsubscribe anytime.
        </p>
      </div>
    </div>
  )
}

export default CoupleEmailCapture
