import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import SEOHelmet from '../components/analytics/SEOHelmet'
import {
  PARTNER_AUDIENCES,
  PARTNER_CITY_PRESETS,
  PARTNER_SPECIALTY_PRESETS,
  DEFAULT_PARTNER_CITY_ID,
  buildPartnerRef,
  buildPartnerWidgetUrl,
  buildTrackedDirectoryUrl,
  findAudience,
  findCityPreset,
  findSpecialtyPreset,
  slugifySegment
} from '../data/growthConfig'

const SITE_ORIGIN = 'https://www.weddingcounselors.com'

const CopyPanel = ({ label, value, copiedKey, onCopy, copyKey }) => (
  <div style={{ marginBottom: 'var(--space-5)' }}>
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 'var(--space-3)',
      marginBottom: 'var(--space-2)'
    }}>
      <strong style={{ color: 'var(--primary-dark)' }}>{label}</strong>
      <button
        type="button"
        onClick={() => onCopy(value, copyKey)}
        className="btn btn-outline btn-small"
      >
        {copiedKey === copyKey ? 'Copied' : 'Copy'}
      </button>
    </div>
    <div style={{
      background: 'white',
      border: '1px solid rgba(14, 94, 94, 0.12)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-4)',
      fontSize: '0.92rem',
      lineHeight: 1.6,
      wordBreak: 'break-word'
    }}>
      {value}
    </div>
  </div>
)

const PartnerToolsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [audience, setAudience] = useState(searchParams.get('audience') || PARTNER_AUDIENCES[0].value)
  const [cityId, setCityId] = useState(searchParams.get('city') || DEFAULT_PARTNER_CITY_ID)
  const [specialty, setSpecialty] = useState(searchParams.get('specialty') || 'none')
  const [customRef, setCustomRef] = useState(searchParams.get('ref') || '')
  const [copied, setCopied] = useState(null)

  useEffect(() => {
    const nextParams = new URLSearchParams()
    nextParams.set('audience', audience)
    nextParams.set('city', cityId)
    if (specialty !== 'none') nextParams.set('specialty', specialty)
    if (customRef.trim()) nextParams.set('ref', slugifySegment(customRef))
    setSearchParams(nextParams, { replace: true })
  }, [audience, cityId, specialty, customRef, setSearchParams])

  const selectedAudience = findAudience(audience)
  const selectedCity = findCityPreset(cityId)
  const selectedSpecialty = findSpecialtyPreset(specialty)
  const generatedRef = slugifySegment(customRef) || buildPartnerRef({
    audience,
    city: selectedCity.city,
    stateAbbr: selectedCity.stateAbbr,
    specialtySlug: specialty
  })

  const trackedLink = buildTrackedDirectoryUrl({
    audience,
    cityPreset: selectedCity,
    specialtySlug: specialty,
    refCode: generatedRef,
    siteOrigin: SITE_ORIGIN
  })

  const widgetUrl = buildPartnerWidgetUrl({ refCode: generatedRef, siteOrigin: SITE_ORIGIN })
  const iframeSnippet = `<div style="max-width:520px">
  <iframe
    src="${widgetUrl}"
    width="100%"
    height="420"
    style="border:0;border-radius:12px;overflow:hidden"
    loading="lazy"
    title="Find premarital counseling"
  ></iframe>
</div>`
  const scriptSnippet = `<div id="wc-widget"></div>
<script src="${SITE_ORIGIN}/widget.js" data-ref="${generatedRef}"></script>`

  const handleCopy = async (value, key) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(key)
      setTimeout(() => setCopied(null), 1500)
    } catch (error) {
      console.error('Failed to copy partner asset:', error)
    }
  }

  return (
    <div className="page-container">
      <SEOHelmet
        title="Partner Tools | Wedding Counselors"
        description="Generate tracked city links and widget code for officiants, churches, planners, and wedding communities."
        url="/partners"
        canonicalUrl="https://www.weddingcounselors.com/partners"
      />

      <section style={{
        background: 'linear-gradient(135deg, #0b4949 0%, #0e5e5e 55%, #1a7373 100%)',
        color: 'white',
        padding: 'var(--space-16) 0 var(--space-12)'
      }}>
        <div className="container">
          <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
            <p style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              borderRadius: 999,
              padding: '0.4rem 0.9rem',
              background: 'rgba(255,255,255,0.12)',
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: 'var(--space-4)'
            }}>
              Partner Distribution
            </p>
            <h1 style={{ color: 'white', marginBottom: 'var(--space-4)' }}>
              Generate Your Tracked Referral Link in 60 Seconds
            </h1>
            <p style={{
              maxWidth: 720,
              margin: '0 auto',
              fontSize: '1.08rem',
              lineHeight: 1.7,
              opacity: 0.92
            }}>
              Build a city-specific link or widget for officiants, churches, planners, and wedding communities.
              Every link carries attribution so we can measure clicks and inquiries before monetization.
            </p>
          </div>
        </div>
      </section>

      <section style={{ padding: 'var(--space-12) 0' }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 0.95fr) minmax(0, 1.05fr)',
            gap: 'var(--space-6)',
            alignItems: 'start'
          }}>
            <div style={{
              background: 'linear-gradient(180deg, rgba(14, 94, 94, 0.06) 0%, rgba(14, 94, 94, 0.02) 100%)',
              border: '1px solid rgba(14, 94, 94, 0.12)',
              borderRadius: 'var(--radius-2xl)',
              padding: 'var(--space-8)'
            }}>
              <h2 style={{ marginBottom: 'var(--space-5)' }}>1. Configure your partner asset</h2>

              <div style={{ marginBottom: 'var(--space-6)' }}>
                <p className="section-eyebrow">Audience</p>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 'var(--space-3)'
                }}>
                  {PARTNER_AUDIENCES.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setAudience(item.value)}
                      style={{
                        textAlign: 'left',
                        padding: 'var(--space-4)',
                        borderRadius: 'var(--radius-lg)',
                        border: audience === item.value ? '2px solid var(--primary)' : '1px solid rgba(14, 94, 94, 0.12)',
                        background: audience === item.value ? 'rgba(14, 94, 94, 0.08)' : 'white',
                        cursor: 'pointer'
                      }}
                    >
                      <strong style={{ display: 'block', marginBottom: 4, color: 'var(--primary-dark)' }}>
                        {item.label}
                      </strong>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        {item.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 'var(--space-4)',
                marginBottom: 'var(--space-5)'
              }}>
                <label style={{ display: 'grid', gap: '0.4rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>City / market</span>
                  <select
                    value={cityId}
                    onChange={(event) => setCityId(event.target.value)}
                    className="form-control"
                  >
                    {PARTNER_CITY_PRESETS.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.city}, {item.stateAbbr}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={{ display: 'grid', gap: '0.4rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>Optional specialty page</span>
                  <select
                    value={specialty}
                    onChange={(event) => setSpecialty(event.target.value)}
                    className="form-control"
                  >
                    {PARTNER_SPECIALTY_PRESETS.map((item) => (
                      <option key={item.slug} value={item.slug}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label style={{ display: 'grid', gap: '0.4rem', marginBottom: 'var(--space-6)' }}>
                <span style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>Custom ref code</span>
                <input
                  type="text"
                  value={customRef}
                  onChange={(event) => setCustomRef(event.target.value)}
                  className="form-control"
                  placeholder="Leave blank to auto-generate"
                />
                <span style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                  We recommend short refs like <code>{buildPartnerRef({
                    audience,
                    city: selectedCity.city,
                    stateAbbr: selectedCity.stateAbbr,
                    specialtySlug: specialty
                  })}</code>.
                </span>
              </label>

              <div style={{
                background: 'white',
                border: '1px solid rgba(14, 94, 94, 0.12)',
                borderRadius: 'var(--radius-xl)',
                padding: 'var(--space-5)'
              }}>
                <p className="section-eyebrow">Live preview</p>
                <h3 style={{ marginBottom: 'var(--space-2)' }}>
                  {selectedAudience.label} -> {selectedCity.city}, {selectedCity.stateAbbr}
                </h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
                  Landing page: {selectedSpecialty.label}
                </p>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 0 }}>
                  Tracking ref: <strong>{generatedRef}</strong>
                </p>
              </div>
            </div>

            <div style={{
              background: 'white',
              border: '1px solid rgba(14, 94, 94, 0.12)',
              borderRadius: 'var(--radius-2xl)',
              padding: 'var(--space-8)',
              boxShadow: 'var(--shadow-lg)'
            }}>
              <h2 style={{ marginBottom: 'var(--space-3)' }}>2. Copy your assets</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
                Use the tracked link in your emails, packets, SMS templates, or planning resources.
                Use the widget code if you want the search box on your website.
              </p>

              <CopyPanel
                label="Tracked city link"
                value={trackedLink}
                copiedKey={copied}
                onCopy={handleCopy}
                copyKey="tracked-link"
              />

              <CopyPanel
                label="Iframe widget"
                value={iframeSnippet}
                copiedKey={copied}
                onCopy={handleCopy}
                copyKey="iframe"
              />

              <CopyPanel
                label="Script widget"
                value={scriptSnippet}
                copiedKey={copied}
                onCopy={handleCopy}
                copyKey="script"
              />

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 'var(--space-3)',
                marginTop: 'var(--space-7)'
              }}>
                {[
                  { label: 'Tracked automatically', value: 'Clicks, inquiry submissions, and landing page source.' },
                  { label: 'Best for', value: 'Welcome packets, booking emails, premarital prep pages, and planner resources.' },
                  { label: 'Next step', value: 'Open the admin partner dashboard to review clicks and leads by ref code.' }
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      borderRadius: 'var(--radius-xl)',
                      border: '1px solid rgba(14, 94, 94, 0.1)',
                      background: 'rgba(14, 94, 94, 0.03)',
                      padding: 'var(--space-4)'
                    }}
                  >
                    <strong style={{ display: 'block', color: 'var(--primary-dark)', marginBottom: 'var(--space-2)' }}>
                      {item.label}
                    </strong>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{
            marginTop: 'var(--space-10)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 'var(--space-4)'
          }}>
            {PARTNER_AUDIENCES.map((item) => (
              <Link
                key={item.value}
                to={item.route}
                style={{
                  display: 'block',
                  padding: 'var(--space-5)',
                  borderRadius: 'var(--radius-xl)',
                  background: 'linear-gradient(180deg, #ffffff 0%, #f7fbfb 100%)',
                  border: '1px solid rgba(14, 94, 94, 0.1)',
                  textDecoration: 'none'
                }}
              >
                <p className="section-eyebrow" style={{ marginBottom: '0.55rem' }}>{item.shortLabel}</p>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--primary-dark)' }}>
                  {item.label}
                </h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                  {item.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default PartnerToolsPage

