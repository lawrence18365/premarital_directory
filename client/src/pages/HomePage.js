import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SEOHelmet from '../components/analytics/SEOHelmet'
import '../assets/css/hero-modern.css'
import '../assets/css/hero-immersive.css'
import StateDropdown from '../components/common/StateDropdown'
import { profileOperations, supabase } from '../lib/supabaseClient'
import FAQ, { premaritalCounselingFAQs } from '../components/common/FAQ'
import heroBg from '../assets/images/oil_painting_premarital_couple_in_distress.webp'
import { STATE_CONFIG } from '../data/locationConfig'
import CoupleEmailCapture from '../components/leads/CoupleEmailCapture'

const FALLBACK_POPULAR_CITIES = [
  // Top metro areas by wedding volume
  { city: 'New York', state: 'New York', slug: 'new-york', stateSlug: 'new-york' },
  { city: 'Los Angeles', state: 'California', slug: 'los-angeles', stateSlug: 'california' },
  { city: 'Chicago', state: 'Illinois', slug: 'chicago', stateSlug: 'illinois' },
  { city: 'Houston', state: 'Texas', slug: 'houston', stateSlug: 'texas' },
  { city: 'Phoenix', state: 'Arizona', slug: 'phoenix', stateSlug: 'arizona' },
  { city: 'San Antonio', state: 'Texas', slug: 'san-antonio', stateSlug: 'texas' },
  { city: 'San Diego', state: 'California', slug: 'san-diego', stateSlug: 'california' },
  { city: 'Dallas', state: 'Texas', slug: 'dallas', stateSlug: 'texas' },
  { city: 'Austin', state: 'Texas', slug: 'austin', stateSlug: 'texas' },
  { city: 'San Francisco', state: 'California', slug: 'san-francisco', stateSlug: 'california' },
  { city: 'Seattle', state: 'Washington', slug: 'seattle', stateSlug: 'washington' },
  { city: 'Denver', state: 'Colorado', slug: 'denver', stateSlug: 'colorado' }
]

const STATE_BY_ABBR = Object.entries(STATE_CONFIG).reduce((acc, [slug, config]) => {
  acc[config.abbr] = { slug, name: config.name }
  return acc
}, {})

const HomePage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedState, setSelectedState] = useState('')
  const [popularCities, setPopularCities] = useState(FALLBACK_POPULAR_CITIES)

  const navigate = useNavigate()

  // Check auth and redirect logged-in professionals to dashboard
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Check if user has a profile (is a professional)
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (profile) {
          navigate('/professional/dashboard', { replace: true })
        }
      }
    }
    checkAuthAndRedirect()
  }, [navigate])

  useEffect(() => {
    const loadPopularCities = async () => {
      const { data, error } = await profileOperations.getLocationCoverage()
      if (error || !data?.cityCounts?.length) return

      const topCities = data.cityCounts
        .filter((entry) => entry.count > 0 && STATE_BY_ABBR[entry.stateAbbr])
        .sort((a, b) => b.count - a.count)
        .slice(0, 12)
        .map((entry) => ({
          city: entry.cityName,
          state: STATE_BY_ABBR[entry.stateAbbr].name,
          stateSlug: STATE_BY_ABBR[entry.stateAbbr].slug,
          slug: entry.citySlug,
          count: entry.count
        }))

      if (topCities.length > 0) {
        setPopularCities(topCities)
      }
    }

    loadPopularCities()
  }, [])

  const handleHeroSubmit = (e) => {
    e.preventDefault()
    if (selectedState) {
      const stateSlug = selectedState.toLowerCase().replace(/\s+/g, '-')
      navigate(`/premarital-counseling/${stateSlug}${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''}`)
    } else {
      navigate('/premarital-counseling')
    }
  }

  return (
    <>
      <SEOHelmet
        title="Premarital Counseling Near Me | Find Marriage Counselors"
        description="Find premarital counselors near you. Compare licensed therapists, Christian counselors, and online marriage prep programs. Free directory - contact providers directly."
        url="/"
        keywords="premarital counseling near me, premarital counseling, marriage counseling near me, pre marriage counseling, premarital therapy, christian premarital counseling, online premarital counseling, marriage prep courses"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Wedding Counselors - The Premarital Counseling Directory",
          "url": "https://www.weddingcounselors.com",
          "description": "Find premarital counselors, therapists, and coaches near you.",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://www.weddingcounselors.com/premarital-counseling?search={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        }}
      />

      <div className="homepage">
        {/* Above-the-fold Hero */}
        <section className="hero-immersive">
          <img
            src={heroBg}
            alt=""
            className="hero-bg"
            loading="eager"
            decoding="async"
            fetchpriority="high"
            aria-hidden="true"
          />
          <div className="hero-layers" aria-hidden="true" />
          <div className="container">
            <div className="hero-immersive-content">
              <h1 className="hero-title">Find Premarital Counseling Near You</h1>
              <p className="hero-subtitle">Compare licensed marriage therapists (LMFT, LPC), Christian counselors, and online premarital programs in your city. Browse profiles, see pricing, and contact providers directly — no middleman fees.</p>

              <form
                className="hero-form hero-form--minimal"
                onSubmit={handleHeroSubmit}
              >
                <div className="hero-input-group">
                  <input
                    type="text"
                    className="form-control hero-input"
                    placeholder="Search by name or specialty"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    aria-label="Search by name or specialty"
                  />
                  <StateDropdown
                    value={selectedState}
                    onChange={setSelectedState}
                    className="form-control hero-input"
                    placeholderLabel="All States"
                  />
                  <button type="submit" className="btn btn-primary hero-cta hero-cta--minimal" aria-label="Find counselors">
                    Find Counselors
                  </button>
                </div>
              </form>
              <div className="hero-sub-cta">
                <Link to="/premarital-counseling">Browse all states</Link>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works - Clear next steps for couples */}
        <section className="how-it-works" aria-labelledby="how-it-works-heading">
          <div className="container">
            <div className="how-it-works__header">
              <p className="section-eyebrow">For engaged couples</p>
              <h2 id="how-it-works-heading">How It Works</h2>
              <p className="how-it-works__intro">
                Follow three simple steps to discover premarital counselors that fit your relationship, communication style, and faith background.
              </p>
            </div>
            <div className="how-it-works__steps">
              {[
                {
                  number: '1',
                  title: 'Choose Your City',
                  description: 'Browse counselors in your area or search nearby cities.'
                },
                {
                  number: '2',
                  title: 'Compare Counselors',
                  description: 'Read bios, specialties, and compare therapists, clergy, and coaches.'
                },
                {
                  number: '3',
                  title: 'Contact Directly',
                  description: 'Reach out via email or phone — no middleman and no hidden fees.'
                }
              ].map((step) => (
                <div className="how-it-works__step" key={step.number}>
                  <div className="how-it-works__step-badge">{step.number}</div>
                  <div className="how-it-works__step-content">
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <CoupleEmailCapture sourcePage="homepage" />

        {/* Popular Cities - Critical for SEO internal linking */}
        <section className="popular-cities" aria-labelledby="popular-cities-heading">
          <div className="container">
            <div className="popular-cities__header">
              <p className="section-eyebrow">Local directories</p>
              <h2 id="popular-cities-heading">Find Premarital Counseling Near You</h2>
              <p className="popular-cities__intro">
                Browse cities with active counselor listings so you can compare real options right now.
              </p>
            </div>
            <div className="popular-cities__grid">
              {popularCities.map((location) => (
                <Link
                  key={`${location.stateSlug}-${location.slug}`}
                  to={`/premarital-counseling/${location.stateSlug}/${location.slug}`}
                  className="popular-cities__card"
                  aria-label={`Premarital counseling in ${location.city}, ${location.state}`}
                >
                  <div className="popular-cities__card-top">
                    <span className="popular-cities__pill">{location.state}</span>
                    <span className="popular-cities__pin" aria-hidden="true">●</span>
                  </div>
                  <h3 className="popular-cities__city">Premarital counseling in {location.city}</h3>
                  <p className="popular-cities__state">
                    {location.state}{location.count ? ` • ${location.count} listed` : ''}
                  </p>
                  <span className="popular-cities__cta">
                    View counselors
                    <span aria-hidden="true"> →</span>
                  </span>
                </Link>
              ))}
            </div>
            <div className="popular-cities__cta-wrap">
              <Link to="/premarital-counseling" className="btn btn-secondary">
                View All Cities
              </Link>
            </div>
          </div>
        </section>

        {/* Popular Specialties — Money Pages */}
        <section className="popular-cities" aria-labelledby="specialties-heading" style={{ background: 'var(--gray-50, #f9fafb)' }}>
          <div className="container">
            <div className="popular-cities__header">
              <p className="section-eyebrow">By specialty</p>
              <h2 id="specialties-heading">Popular Approaches to Premarital Counseling</h2>
              <p className="popular-cities__intro">
                Explore counselors by method, faith tradition, or format.
              </p>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 'var(--space-4)'
            }}>
              {[
                { slug: 'online', label: 'Online Counseling', desc: 'Virtual sessions from home' },
                { slug: 'catholic', label: 'Catholic Pre-Cana', desc: 'Parish and diocesan programs' },
                { slug: 'gottman', label: 'Gottman Method', desc: 'Research-backed approach' },
                { slug: 'christian', label: 'Christian Counseling', desc: 'Faith-based marriage prep' },
                { slug: 'affordable', label: 'Affordable Options', desc: 'Sliding scale and low-cost' },
                { slug: 'prepare-enrich', label: 'PREPARE/ENRICH', desc: 'Premarital assessment tool' }
              ].map((item) => (
                <Link
                  key={item.slug}
                  to={`/premarital-counseling/${item.slug}`}
                  style={{
                    display: 'block',
                    padding: 'var(--space-5)',
                    background: 'white',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid #e5e7eb',
                    textDecoration: 'none',
                    transition: 'box-shadow 0.2s, transform 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <h3 style={{ fontSize: '1rem', margin: '0 0 4px', color: 'var(--text-primary)' }}>
                    {item.label}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                    {item.desc}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Marriage License Discounts Block */}
        <section style={{ padding: 'var(--space-12) 0' }} aria-labelledby="discounts-heading">
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
              <p className="section-eyebrow">Save money</p>
              <h2 id="discounts-heading">Marriage License Discounts by State</h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto' }}>
                Several states offer $25-$75 off your marriage license when you complete premarital counseling.
              </p>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: 'var(--space-3)',
              maxWidth: 800,
              margin: '0 auto'
            }}>
              {[
                { state: 'Florida', slug: 'florida', discount: '$32.50 off' },
                { state: 'Texas', slug: 'texas', discount: '$60 off' },
                { state: 'Minnesota', slug: 'minnesota', discount: 'Up to $75 off' },
                { state: 'Tennessee', slug: 'tennessee', discount: '$60 off' },
                { state: 'Oklahoma', slug: 'oklahoma', discount: '$50 off' },
                { state: 'Indiana', slug: 'indiana', discount: '$60 off' }
              ].map((item) => (
                <Link
                  key={item.slug}
                  to={`/premarital-counseling/marriage-license-discount/${item.slug}`}
                  style={{
                    padding: 'var(--space-4)',
                    background: 'var(--gray-50, #f9fafb)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #e5e7eb',
                    textDecoration: 'none',
                    textAlign: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <p style={{ fontWeight: 600, margin: '0 0 2px', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                    {item.state}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-primary)', margin: 0, fontWeight: 500 }}>
                    {item.discount}
                  </p>
                </Link>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 'var(--space-6)' }}>
              <Link to="/premarital-counseling/marriage-license-discount" className="btn btn-secondary">
                View All State Discounts
              </Link>
            </div>
          </div>
        </section>

        {/* Latest Guides — Blog Internal Links */}
        <section style={{ padding: 'var(--space-12) 0', background: 'var(--gray-50, #f9fafb)' }} aria-labelledby="guides-heading">
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
              <p className="section-eyebrow">Resources</p>
              <h2 id="guides-heading">Guides for Engaged Couples</h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto' }}>
                Practical advice to prepare for your marriage.
              </p>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 'var(--space-4)',
              maxWidth: 960,
              margin: '0 auto'
            }}>
              {[
                {
                  slug: 'financial-questions-to-ask-before-marriage',
                  title: '10 Financial Questions Every Couple Must Ask Before Getting Married',
                  excerpt: 'Essential money conversations every couple should have before saying "I do."'
                },
                {
                  slug: 'fighting-about-wedding-planning',
                  title: 'Fighting About Wedding Planning? Here\'s How to Get Back on the Same Team',
                  excerpt: 'Practical strategies for navigating disagreements during wedding planning.'
                },
                {
                  slug: 'setting-healthy-boundaries-with-inlaws',
                  title: 'Love, Honor, and... Boundaries: A Guide to Setting Healthy In-Law Boundaries',
                  excerpt: 'How to build healthy relationships with extended family before marriage.'
                }
              ].map((post) => (
                <Link
                  key={post.slug}
                  to={`/blog/${post.slug}`}
                  style={{
                    display: 'block',
                    padding: 'var(--space-6)',
                    background: 'white',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid #e5e7eb',
                    textDecoration: 'none',
                    transition: 'box-shadow 0.2s, transform 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <h3 style={{ fontSize: '1.05rem', margin: '0 0 8px', color: 'var(--text-primary)' }}>
                    {post.title}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    {post.excerpt}
                  </p>
                </Link>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 'var(--space-6)' }}>
              <Link to="/blog" className="btn btn-secondary">
                Read More Guides
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <FAQ
          faqs={premaritalCounselingFAQs.slice(0, 6)}
          title="Common Questions About Premarital Counseling"
          description="Quick answers before you reach out to a counselor."
          className="homepage-faq"
          showSearch={false}
          showAside={false}
          highlights={[]}
        />

        {/* Quiz CTA */}
        <section style={{
          padding: 'var(--space-12) 0',
          background: 'linear-gradient(135deg, rgba(13,148,136,0.06) 0%, rgba(13,148,136,0.02) 100%)'
        }}>
          <div className="container" style={{ textAlign: 'center', maxWidth: '600px' }}>
            <p className="section-eyebrow">Free 2-Minute Assessment</p>
            <h3 style={{ fontSize: '1.4rem', marginBottom: 'var(--space-3)' }}>Are You Ready for Marriage?</h3>
            <p style={{ color: 'var(--gray-600, #4b5563)', marginBottom: 'var(--space-6)', fontSize: '1rem' }}>
              Take our quick relationship readiness quiz to see where you stand on communication, finances, conflict resolution, and more.
            </p>
            <Link to="/quiz/relationship-readiness" className="btn btn-primary btn-large">
              Take the Quiz
            </Link>
          </div>
        </section>

        {/* Professional CTA */}
        <section className="provider-cta" aria-labelledby="provider-cta-heading">
          <div className="container">
            <div className="provider-cta__content">
              <div className="provider-cta__copy">
                <p className="section-eyebrow">For premarital counselors, therapists & clergy</p>
                <h3 id="provider-cta-heading">Get Found by Engaged Couples</h3>
                <p className="provider-cta__subtitle">
                  Create a clean professional profile and receive direct inquiries from couples in your city.
                </p>
              </div>
              <div className="provider-cta__actions">
                <Link to="/professional/signup?signup_source=homepage_cta" className="btn provider-cta__primary" rel="nofollow">
                  <span className="provider-cta__btn-label">Create Your Free Profile</span>
                  <span className="provider-cta__btn-subtext">No credit card required</span>
                </Link>
                <Link to="/pricing" className="btn provider-cta__secondary">
                  <span className="provider-cta__btn-label">View Pricing</span>
                  <span className="provider-cta__btn-subtext">Upgrade only when ready</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

export default HomePage
