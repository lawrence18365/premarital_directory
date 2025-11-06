import React from 'react'
import { Link } from 'react-router-dom'
import SEOHelmet from '../components/analytics/SEOHelmet'

const SitemapPage = () => {
  const now = new Date().toISOString().split('T')[0]

  const publicRoutes = [
    { to: '/', label: 'Home' },
    { to: '/states', label: 'Find Counselors (States)' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
    { to: '/blog', label: 'Blog' },
    { to: '/pricing', label: 'Pricing' },
    { to: '/features', label: 'Features' },
    { to: '/support', label: 'Support' },
    { to: '/guidelines', label: 'Guidelines' },
    { to: '/privacy', label: 'Privacy Policy' },
    { to: '/terms', label: 'Terms of Service' }
  ]

  const authRoutes = [
    { to: '/professional/login', label: 'Professional Login' },
    { to: '/professional/signup', label: 'Professional Signup' },
    { to: '/claim-profile', label: 'Claim Profile' }
  ]

  return (
    <div className="container" style={{ padding: 'var(--space-12) 0' }}>
      <SEOHelmet 
        title="HTML Sitemap"
        description="Browse all key pages of the Premarital Counseling Directory."
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Sitemap',
          dateModified: now
        }}
      />

      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--teal)', marginBottom: 'var(--space-6)' }}>Sitemap</h1>

      <div className="sitemap-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-8)' }}>
        <section>
          <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-3)' }}>Public Pages</h2>
          <ul>
            {publicRoutes.map((r) => (
              <li key={r.to} style={{ marginBottom: '0.5rem' }}>
                <Link to={r.to}>{r.label}</Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-3)' }}>For Professionals</h2>
          <ul>
            {authRoutes.map((r) => (
              <li key={r.to} style={{ marginBottom: '0.5rem' }}>
                <Link to={r.to}>{r.label}</Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-3)' }}>XML Sitemaps</h2>
          <ul>
            <li style={{ marginBottom: '0.5rem' }}><a href="/sitemap.xml">Primary Sitemap Index</a></li>
            <li style={{ marginBottom: '0.5rem' }}><a href="/sitemap-main.xml">Main Sitemap</a></li>
            <li style={{ marginBottom: '0.5rem' }}><a href="/sitemap-states.xml">States Sitemap</a></li>
            <li style={{ marginBottom: '0.5rem' }}><a href="/sitemap-profiles.xml">Profiles Sitemap</a></li>
            <li style={{ marginBottom: '0.5rem' }}><a href="/sitemap-blog.xml">Blog Sitemap</a></li>
          </ul>
        </section>
      </div>
    </div>
  )
}

export default SitemapPage

