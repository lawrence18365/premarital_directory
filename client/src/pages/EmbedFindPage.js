import React, { useState } from 'react'
import SEOHelmet from '../components/analytics/SEOHelmet'
import { STATE_CONFIG } from '../data/locationConfig'

const SITE_URL = 'https://www.weddingcounselors.com'

const stateOptions = Object.entries(STATE_CONFIG)
  .map(([slug, config]) => ({ slug, name: config.name }))
  .sort((a, b) => a.name.localeCompare(b.name))

const specialtyOptions = [
  { slug: '', label: 'All counselors' },
  { slug: 'catholic', label: 'Catholic / Pre-Cana' },
  { slug: 'christian', label: 'Christian' },
  { slug: 'gottman', label: 'Gottman Method' },
  { slug: 'online', label: 'Online / Virtual' },
  { slug: 'affordable', label: 'Affordable / Sliding Scale' },
  { slug: 'lgbtq', label: 'LGBTQ+ Affirming' }
]

const EmbedFindPage = () => {
  const [selectedState, setSelectedState] = useState('')
  const [selectedSpecialty, setSelectedSpecialty] = useState('')

  const params = new URLSearchParams(window.location.search)
  const ref = params.get('ref') || 'widget'

  const handleSearch = (e) => {
    e.preventDefault()
    if (!selectedState) return

    let url = `${SITE_URL}/premarital-counseling`
    if (selectedSpecialty) {
      url += `/${selectedSpecialty}/${selectedState}`
    } else {
      url += `/${selectedState}`
    }
    url += `?utm_source=widget&utm_medium=embed&utm_campaign=${ref}`

    window.open(url, '_blank', 'noopener')
  }

  return (
    <>
      <SEOHelmet title="Find a Counselor" description="Embeddable counselor finder widget." noindex={true} />
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      maxWidth: 480,
      margin: '0 auto',
      padding: 20,
      background: '#fff',
      minHeight: '100vh',
      boxSizing: 'border-box'
    }}>
      <div style={{
        background: '#f8fafb',
        borderRadius: 12,
        padding: 24,
        border: '1px solid #e5e7eb'
      }}>
        <h2 style={{
          fontSize: '1.15rem',
          fontWeight: 700,
          margin: '0 0 4px',
          color: '#1a1a2e'
        }}>
          Find Premarital Counseling
        </h2>
        <p style={{
          fontSize: '0.85rem',
          color: '#6b7280',
          margin: '0 0 16px'
        }}>
          Search by state and specialty
        </p>

        <form onSubmit={handleSearch}>
          <label style={{ display: 'block', marginBottom: 12 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
              State
            </span>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                fontSize: '0.9rem',
                background: '#fff',
                color: '#1a1a2e',
                appearance: 'auto'
              }}
            >
              <option value="">Select your state</option>
              {stateOptions.map((st) => (
                <option key={st.slug} value={st.slug}>{st.name}</option>
              ))}
            </select>
          </label>

          <label style={{ display: 'block', marginBottom: 16 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
              Type
            </span>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                fontSize: '0.9rem',
                background: '#fff',
                color: '#1a1a2e',
                appearance: 'auto'
              }}
            >
              {specialtyOptions.map((opt) => (
                <option key={opt.slug} value={opt.slug}>{opt.label}</option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            disabled={!selectedState}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: selectedState ? '#0e5e5e' : '#9ca3af',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: selectedState ? 'pointer' : 'not-allowed',
              transition: 'background 0.2s'
            }}
          >
            Find Counselors
          </button>
        </form>

        <p style={{
          fontSize: '0.75rem',
          color: '#9ca3af',
          textAlign: 'center',
          marginTop: 12,
          marginBottom: 0
        }}>
          Powered by{' '}
          <a
            href={`${SITE_URL}/for-churches`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#0e5e5e', textDecoration: 'underline' }}
          >
            WeddingCounselors.com
          </a>
        </p>
      </div>
    </div>
    </>
  )
}

export default EmbedFindPage
