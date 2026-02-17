import React, { useMemo, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

const MAX_SELECTABLE = 5

const getTierPriority = (tier) => {
  const order = { area_spotlight: 1, local_featured: 2, community: 3 }
  return order[tier] || 99
}

/**
 * Optional multi-provider inquiry form.
 * Couples explicitly choose the counselors to contact.
 */
const MultiProviderInquiryForm = ({ cityName, stateName, stateSlug, citySlug, providers }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  })
  const [selectedProviderIds, setSelectedProviderIds] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)

  const rankedProviders = useMemo(() => {
    return [...providers]
      .sort((a, b) => {
        const aFit = Number(a.premaritalFitScore) || 0
        const bFit = Number(b.premaritalFitScore) || 0
        if (bFit !== aFit) return bFit - aFit
        if (getTierPriority(a.tier) !== getTierPriority(b.tier)) return getTierPriority(a.tier) - getTierPriority(b.tier)
        return new Date(b.created_at) - new Date(a.created_at)
      })
      .slice(0, 18)
  }, [providers])

  const selectedProviders = useMemo(
    () => rankedProviders.filter((provider) => selectedProviderIds.includes(provider.id)),
    [rankedProviders, selectedProviderIds]
  )

  const toggleProviderSelection = (providerId) => {
    setSelectedProviderIds((previous) => {
      if (previous.includes(providerId)) {
        return previous.filter((id) => id !== providerId)
      }
      if (previous.length >= MAX_SELECTABLE) {
        return previous
      }
      return [...previous, providerId]
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (selectedProviders.length === 0) {
        throw new Error('Select at least one counselor before sending.')
      }

      if (selectedProviders.length > MAX_SELECTABLE) {
        throw new Error(`Please select no more than ${MAX_SELECTABLE} counselors.`)
      }

      const { data: inserted, error: insertError } = await supabase
        .from('city_inquiries')
        .insert({
          couple_name: formData.name || null,
          couple_email: formData.email,
          couple_message: formData.message,
          preferred_type: 'custom_select',
          city: cityName,
          state: stateName,
          provider_ids: selectedProviders.map((provider) => provider.id),
          source: 'city_page_selected'
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Send all emails server-side via edge function (no provider emails exposed client-side)
      await supabase.functions.invoke('send-inquiry-notifications', {
        body: { inquiryId: inserted.id }
      })

      setSubmitted(true)
    } catch (submitError) {
      console.error('Inquiry submission error:', submitError)
      setError(submitError.message || 'Failed to send inquiry. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div style={{
        background: 'var(--ds-accent-soft)',
        padding: 'var(--space-6)',
        borderRadius: 'var(--radius-lg)',
        border: '2px solid var(--ds-border-strong)',
        textAlign: 'center'
      }}>
        <h3 style={{ color: 'var(--ds-accent)', marginBottom: 'var(--space-3)' }}>
          Message Sent
        </h3>
        <p style={{ marginBottom: 'var(--space-3)' }}>
          Your message was sent only to the {selectedProviders.length} counselor{selectedProviders.length > 1 ? 's' : ''} you selected.
        </p>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Check your email at <strong>{formData.email}</strong> for responses.
        </p>
      </div>
    )
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(14, 94, 94, 0.1) 0%, rgba(14, 94, 94, 0.06) 100%)',
      padding: 'var(--space-6)',
      borderRadius: 'var(--radius-lg)',
      border: '2px solid var(--ds-border-strong)',
      marginTop: 'var(--space-8)'
    }}>
      <h3 style={{
        color: 'var(--ds-accent)',
        marginBottom: 'var(--space-2)',
        fontSize: 'var(--text-xl)'
      }}>
        Optional: Contact a Few Matches
      </h3>
      <p style={{
        color: 'var(--text-secondary)',
        marginBottom: 'var(--space-4)',
        fontSize: '0.95rem'
      }}>
        Select up to {MAX_SELECTABLE} counselors. We will send your message only to the counselors you check.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '0.9rem' }}>
            Choose counselors (up to {MAX_SELECTABLE}) *
          </label>
          <div style={{
            display: 'grid',
            gap: '8px',
            maxHeight: '260px',
            overflowY: 'auto',
            padding: '10px',
            border: '1px solid var(--ds-border)',
            borderRadius: '8px',
            background: 'white'
          }}>
            {rankedProviders.map((provider) => {
              const checked = selectedProviderIds.includes(provider.id)
              const disableUnchecked = !checked && selectedProviderIds.length >= MAX_SELECTABLE
              return (
                <label
                  key={provider.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr auto',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px',
                    borderRadius: '8px',
                    border: checked ? '1px solid var(--ds-border-strong)' : '1px solid rgba(14, 94, 94, 0.08)',
                    background: checked ? 'rgba(14, 94, 94, 0.08)' : 'var(--white)',
                    cursor: disableUnchecked ? 'not-allowed' : 'pointer',
                    opacity: disableUnchecked ? 0.55 : 1
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disableUnchecked}
                    onChange={() => toggleProviderSelection(provider.id)}
                  />
                  <span style={{ minWidth: 0 }}>
                    <strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                      {provider.full_name}
                    </strong>
                    <span style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                      {provider.profession}
                    </span>
                  </span>
                  {Number.isFinite(Number(provider.premaritalFitScore)) && (
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      letterSpacing: '0.03em',
                      color: 'var(--ds-accent)',
                      background: 'var(--ds-accent-soft)',
                      borderRadius: '999px',
                      padding: '0.18rem 0.5rem'
                    }}>
                      Fit {provider.premaritalFitScore}
                    </span>
                  )}
                </label>
              )
            })}
          </div>
        </div>

        <div style={{ marginBottom: 'var(--space-3)' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '0.9rem' }}>
            Your Name (optional)
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(event) => setFormData({ ...formData, name: event.target.value })}
            placeholder="Jane & John"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid var(--ds-border)',
              borderRadius: '6px',
              fontSize: '0.95rem'
            }}
          />
        </div>

        <div style={{ marginBottom: 'var(--space-3)' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '0.9rem' }}>
            Your Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(event) => setFormData({ ...formData, email: event.target.value })}
            required
            placeholder="you@example.com"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid var(--ds-border)',
              borderRadius: '6px',
              fontSize: '0.95rem'
            }}
          />
        </div>

        <div style={{ marginBottom: 'var(--space-4)' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '0.9rem' }}>
            Your Message *
          </label>
          <textarea
            value={formData.message}
            onChange={(event) => setFormData({ ...formData, message: event.target.value })}
            required
            rows={4}
            placeholder="Share your timeline, what you want from premarital counseling, and any key concerns."
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid var(--ds-border)',
              borderRadius: '6px',
              fontSize: '0.95rem',
              resize: 'vertical'
            }}
          />
        </div>

        {error && (
          <div style={{
            background: 'var(--ds-accent-soft)',
            color: 'var(--ds-ink)',
            padding: '10px',
            borderRadius: '6px',
            marginBottom: 'var(--space-3)',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || selectedProviderIds.length === 0}
          style={{
            width: '100%',
            padding: '12px',
            background: isSubmitting || selectedProviderIds.length === 0 ? 'var(--gray-400)' : 'var(--ds-accent)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: isSubmitting || selectedProviderIds.length === 0 ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s'
          }}
        >
          {isSubmitting ? 'Sending...' : `Send to ${selectedProviderIds.length} Counselor${selectedProviderIds.length === 1 ? '' : 's'}`}
        </button>

        <p style={{
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          marginTop: 'var(--space-2)',
          textAlign: 'center'
        }}>
          Prefer 1:1 outreach? Open any profile and contact that counselor directly.
        </p>
      </form>
    </div>
  )
}

export default MultiProviderInquiryForm
