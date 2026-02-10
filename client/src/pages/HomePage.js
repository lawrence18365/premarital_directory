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
        title="Premarital Counseling Near Me | Find Marriage Counselors in Your City"
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
                <Link to="/professional/signup?signup_source=homepage_cta" className="btn provider-cta__primary">
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
