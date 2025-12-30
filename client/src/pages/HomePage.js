import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import ProfileCard from '../components/profiles/ProfileCard'
import SEOHelmet from '../components/analytics/SEOHelmet'
import '../assets/css/hero-modern.css'
import '../assets/css/hero-immersive.css'
import '../assets/css/trust-cards.css'
import '../assets/css/profiles-highlight.css'
import StateDropdown from '../components/common/StateDropdown'
import { normalizeStateAbbr } from '../lib/utils'
import { supabase, profileOperations } from '../lib/supabaseClient'
import FAQ, { premaritalCounselingFAQs } from '../components/common/FAQ'
import '../assets/css/blog.css'

// Import images
import trustMatchImg from '../assets/images/Cute_couple_woman_side_profile.webp'
import trustFoundationImg from '../assets/images/premarital_couple_over_coffee.webp'
import trustJourneyImg from '../assets/images/couple_walking_in_Central_Park.webp'
import heroBg from '../assets/images/oil_painting_premarital_couple_in_distress.webp'

const TRUST_HIGHLIGHTS = [
  {
    title: 'Find Your Premarital Counselor',
    description: 'Browse counselors who specialize in pre-marriage preparation for engaged couples.',
    image: trustMatchImg,
    alt: 'Engaged couple after finding a premarital counselor',
    tag: 'Curated matches'
  },
  {
    title: 'Prepare for a Strong Marriage',
    description: 'Build a solid foundation before your wedding with expert guidance.',
    image: trustFoundationImg,
    alt: 'Engaged couple over coffee discussing marriage preparation',
    tag: 'Holistic support'
  },
  {
    title: 'Start Your Marriage Right',
    description: 'Address important topics before you say "I do" with professional support.',
    image: trustJourneyImg,
    alt: 'Engaged couple walking hand-in-hand',
    tag: 'Faith & evidence-based'
  }
]

const POPULAR_CITIES = [
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
  { city: 'Denver', state: 'Colorado', slug: 'denver', stateSlug: 'colorado' },
  { city: 'Atlanta', state: 'Georgia', slug: 'atlanta', stateSlug: 'georgia' },
  { city: 'Miami', state: 'Florida', slug: 'miami', stateSlug: 'florida' },
  { city: 'Nashville', state: 'Tennessee', slug: 'nashville', stateSlug: 'tennessee' },
  { city: 'Charlotte', state: 'North Carolina', slug: 'charlotte', stateSlug: 'north-carolina' },
  { city: 'Portland', state: 'Oregon', slug: 'portland', stateSlug: 'oregon' },
  { city: 'Las Vegas', state: 'Nevada', slug: 'las-vegas', stateSlug: 'nevada' },
  { city: 'Orlando', state: 'Florida', slug: 'orlando', stateSlug: 'florida' },
  { city: 'Indianapolis', state: 'Indiana', slug: 'indianapolis', stateSlug: 'indiana' }
]

const PROVIDER_FEATURES = [
  {
    title: 'Show up in the right cities',
    description: 'Get listed on high-intent city pages couples already search.'
  },
  {
    title: 'Leads go straight to you',
    description: 'Couples email or call you directly so you control the relationship.'
  },
  {
    title: 'Transparent analytics',
    description: 'View profile visits, contact reveals, and new inquiries anytime.'
  },
  {
    title: 'Edit your profile anytime',
    description: 'Update specialties, pricing, and availability in minutes.'
  },
  {
    title: 'No long-term commitments',
    description: 'Start free, upgrade when you’re ready, cancel whenever you like.'
  }
]

const HomePage = () => {
  const [profiles, setProfiles] = useState([])
  const [filteredProfiles, setFilteredProfiles] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [latestPosts, setLatestPosts] = useState([]);
  const [filters, setFilters] = useState({
    profession: '',
    city: '',
    state: '',
    specialty: ''
  })

  const location = useLocation()
  const navigate = useNavigate()

  // Set initial profession based on route
  useEffect(() => {
    const path = location.pathname
    let initialProfession = ''

    if (path === '/therapists') {
      initialProfession = 'Therapist'
    } else if (path === '/coaches') {
      initialProfession = 'Coach'
    } else if (path === '/clergy') {
      initialProfession = 'Clergy'
    }

    if (initialProfession) {
      setFilters(prev => ({ ...prev, profession: initialProfession }))
    }
  }, [location.pathname])

  // Load profiles on component mount
  useEffect(() => {
    loadProfiles()
  }, [])

  useEffect(() => {
    const fetchLatestPosts = async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('status', 'published')
          .order('date', { ascending: false })
          .limit(4);

        if (!error) {
          setLatestPosts(data);
        }
      } catch (error) {
        // Silent error handling for production
      }
    };

    fetchLatestPosts();
  }, []);

  // Apply filters whenever profiles or filters change
  useEffect(() => {
    const applyFilters = () => {
      let filtered = [...profiles]

      // Text search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase()
        filtered = filtered.filter(profile =>
          profile.full_name.toLowerCase().includes(term) ||
          profile.bio?.toLowerCase().includes(term) ||
          profile.city?.toLowerCase().includes(term) ||
          profile.state_province?.toLowerCase().includes(term) ||
          profile.specialties?.some(specialty =>
            specialty.toLowerCase().includes(term)
          )
        )
      }

      // Profession filter
      if (filters.profession) {
        filtered = filtered.filter(profile =>
          profile.profession === filters.profession
        )
      }

      // Location filters
      if (filters.city) {
        filtered = filtered.filter(profile =>
          profile.city?.toLowerCase().includes(filters.city.toLowerCase())
        )
      }

      if (filters.state) {
        const filterAbbr = normalizeStateAbbr(filters.state)
        filtered = filtered.filter(profile => {
          const st = profile.state_province || ''
          const stAbbr = normalizeStateAbbr(st)
          return stAbbr === filterAbbr || st.toLowerCase().includes(filters.state.toLowerCase())
        })
      }

      // Specialty filter
      if (filters.specialty) {
        filtered = filtered.filter(profile =>
          profile.specialties?.some(specialty =>
            specialty.toLowerCase().includes(filters.specialty.toLowerCase())
          )
        )
      }

      setFilteredProfiles(filtered)
    }

    applyFilters()
  }, [profiles, searchTerm, filters])

  const loadProfiles = async () => {
    try {
      const { data } = await profileOperations.getProfiles()

      if (data) {
        // Filter to only show profiles that mention premarital in their bio or specialties
        const premaritalFocused = (data || []).filter(profile =>
          profile.bio?.toLowerCase().includes('premarital') ||
          profile.bio?.toLowerCase().includes('pre-marital') ||
          profile.bio?.toLowerCase().includes('marriage prep') ||
          profile.specialties?.some(s =>
            s.toLowerCase().includes('premarital') ||
            s.toLowerCase().includes('marriage prep') ||
            s.toLowerCase().includes('engaged couple')
          )
        )
        setProfiles(premaritalFocused.length > 0 ? premaritalFocused : data || [])
      }
    } catch (err) {
      console.error('Failed to load profiles:', err)
    }
  }

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }))
  }

  const handleHeroSubmit = (e) => {
    e.preventDefault()
    if (filters.state) {
      const stateSlug = (filters.state || '').toLowerCase().replace(/\s+/g, '-')
      navigate(`/premarital-counseling/${stateSlug}${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''}`)
    } else {
      navigate('/premarital-counseling')
    }
  }

  return (
    <>
      <SEOHelmet
        title="Premarital Counseling Near Me | Find Marriage Counselors in Your City (2025)"
        description="Find premarital counselors near you. Compare 150+ licensed therapists, Christian counselors, and online marriage prep programs. Free directory - contact providers directly."
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
                    value={filters.state}
                    onChange={(val) => handleFilterChange('state', val)}
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

        {/* Trust Indicators - Updated to be honest */}
        <section className="trust-cards" aria-labelledby="trust-highlights-heading">
          <div className="container">
            <div className="trust-cards__header">
              <p className="section-eyebrow">Trusted guidance</p>
              <h2 id="trust-highlights-heading">Helping Engaged Couples Prepare for Marriage</h2>
              <p className="trust-cards__intro">
                Modern counseling, faith-informed support, and practical coaching so both of you feel prepared on the wedding day and beyond.
              </p>
            </div>
            <div className="trust-grid">
              {TRUST_HIGHLIGHTS.map((highlight) => (
                <article className="trust-card" key={highlight.title}>
                  <figure className="trust-card__media">
                    <img src={highlight.image} alt={highlight.alt} className="trust-card__image" loading="lazy" decoding="async" />
                  </figure>
                  <div className="trust-card__content">
                    <p className="trust-card__tag">{highlight.tag}</p>
                    <h3 className="trust-card__title">{highlight.title}</h3>
                    <p className="trust-card__description">{highlight.description}</p>
                  </div>
                </article>
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
                Search top counselors serving major metro areas — explore therapists, clergy, and coaches who understand your community.
              </p>
            </div>
            <div className="popular-cities__grid">
              {POPULAR_CITIES.map((location) => (
                <Link
                  key={location.slug}
                  to={`/premarital-counseling/${location.stateSlug}/${location.slug}`}
                  className="popular-cities__card"
                  aria-label={`Premarital counseling in ${location.city}, ${location.state}`}
                >
                  <div className="popular-cities__card-top">
                    <span className="popular-cities__pill">{location.state}</span>
                    <span className="popular-cities__pin" aria-hidden="true">●</span>
                  </div>
                  <h3 className="popular-cities__city">Premarital counseling in {location.city}</h3>
                  <p className="popular-cities__state">{location.state}</p>
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

        {/* Provider CTA - MOVED HIGHER UP */}
        <section className="provider-cta" aria-labelledby="provider-cta-heading">
          <div className="container">
            <div className="provider-cta__content">
              <div className="provider-cta__copy">
                <p className="section-eyebrow">For professionals</p>
                <h3 id="provider-cta-heading">Are You a Premarital Counselor?</h3>
                <p className="provider-cta__subtitle">
                  Join the directory trusted by engaged couples. Feature your approach, share your availability, and receive direct inquiries—no middleman.
                </p>
                <ul className="provider-cta__list">
                  <li>Highlight specialties (faith-based, clinical, coaching)</li>
                  <li>Receive inquiries directly in your inbox</li>
                  <li>Start free, upgrade only when ready</li>
                </ul>
              </div>
              <div className="provider-cta__actions">
                <Link to="/professional/create?signup_source=homepage" className="btn provider-cta__primary">
                  <span className="provider-cta__btn-label">Create Your Free Profile</span>
                  <span className="provider-cta__btn-subtext">List your practice in 5 minutes</span>
                </Link>
                <Link to="/pricing" className="btn provider-cta__secondary">
                  <span className="provider-cta__btn-label">View Pricing</span>
                  <span className="provider-cta__btn-subtext">See premium placement options</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Sample Profiles - Only show if we have premarital-focused ones */}
        {filteredProfiles.length > 0 && (
          <section className="profiles-highlight" aria-labelledby="profiles-highlight-heading">
            <div className="container">
              <div className="profiles-highlight__inner">
                <div className="profiles-highlight__copy">
                  <p className="section-eyebrow">Curated nationwide</p>
                  <h2 className="font-display" id="profiles-highlight-heading">
                    Sample Counselors in Our Directory
                  </h2>
                  <p className="lead">
                    Meet a handful of premarital specialists trusted by couples for faith-based, clinical, and coaching approaches.
                  </p>

                  <ul className="profiles-highlight__list">
                    <li>Licensed therapists, certified coaches, and clergy mentors</li>
                    <li>Each profile includes specialties, availability, and direct contact info</li>
                    <li>Spans major metros and remote-friendly practices</li>
                  </ul>

                  <div className="profiles-highlight__stats">
                    <div className="profiles-highlight__stat">
                      <span className="profiles-highlight__stat-value">150+</span>
                      <span className="profiles-highlight__stat-label">Premarital specialists</span>
                    </div>
                    <div className="profiles-highlight__stat">
                      <span className="profiles-highlight__stat-value">38</span>
                      <span className="profiles-highlight__stat-label">States represented</span>
                    </div>
                    <div className="profiles-highlight__stat">
                      <span className="profiles-highlight__stat-value">72%</span>
                      <span className="profiles-highlight__stat-label">Offer virtual sessions</span>
                    </div>
                  </div>

                  <div className="profiles-highlight__cta">
                    <Link to="/premarital-counseling" className="btn btn-primary btn-large">
                      Browse the full directory
                    </Link>
                    <Link to="/about" className="profiles-highlight__link">
                      How we vet counselors →
                    </Link>
                  </div>
                </div>

                <div className="profiles-highlight__cards" aria-live="polite">
                  {filteredProfiles.slice(0, 6).map(profile => (
                    <ProfileCard key={profile.id} profile={profile} type="featured" />
                  ))}

                  <div className="profiles-highlight__cards-cta">
                    <p>Looking for someone nearby or with a niche specialty?</p>
                    <Link to="/premarital-counseling" className="btn btn-secondary">
                      View all counselors
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Latest Blog Posts */}
        {latestPosts.length > 0 && (
          <section className="latest-posts-section py-5 bg-light">
            <div className="container">
              <div className="section-header text-center">
                <h2 className="font-display">Latest From our Blog</h2>
                <p className="lead">Explore our latest articles on marriage and relationship guidance</p>
              </div>
              <div className="blog-grid">
                {latestPosts.map((post) => (
                  <article key={post.id} className="blog-card">
                    <div className="blog-card-header">
                      <span className="blog-category">{post.category}</span>
                      <span className="blog-date">{new Date(post.date).toLocaleDateString()}</span>
                    </div>
                    <h2 className="blog-title">
                      <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                    </h2>
                    <p className="blog-excerpt">{post.excerpt}</p>
                    <div className="blog-card-footer">
                      <span className="read-time">{post.read_time}</span>
                      <Link to={`/blog/${post.slug}`} className="read-more">
                        Read Article →
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
              <div className="text-center mt-5">
                <Link to="/blog" className="btn btn-secondary">View All Posts</Link>
              </div>
            </div>
          </section>
        )}

        {/* FAQ Section */}
        <FAQ
          faqs={premaritalCounselingFAQs}
          title="Common Questions About Premarital Counseling"
          description="Get answers to the most frequently asked questions about premarital counseling and finding the right counselor for your relationship."
          className="homepage-faq"
          highlights={[
            'Typical programs run 5–8 sessions with practical exercises.',
            'Choose from licensed therapists, clergy, or certified coaches.',
            'Most couples report improved communication after session two.'
          ]}
        />

        {/* Full Provider Section - More concrete value props */}
        <section className="pros-cta" aria-labelledby="pros-cta-heading">
          <div className="container">
            <div className="pros-cta__shell">
              <div className="pros-cta__content">
                <p className="section-eyebrow">For premarital counselors, therapists & clergy</p>
                <h2 id="pros-cta-heading">Get Found by Engaged Couples</h2>
                <p className="pros-cta__subtitle">
                  Couples actively search "premarital counseling [City]" — list your practice where they already look.
                </p>

                <div className="pros-cta__list-card">
                  <p className="pros-cta__list-title">What you get</p>
                  <ul className="pros-cta__list">
                    {PROVIDER_FEATURES.map((feature) => (
                      <li key={feature.title}>
                        <span className="pros-cta__list-icon" aria-hidden="true">
                          <i className="fa fa-check"></i>
                        </span>
                        <div>
                          <p className="pros-cta__list-heading">{feature.title}</p>
                          <p className="pros-cta__list-copy">{feature.description}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pros-cta__actions">
                  <Link to="/professional/create?signup_source=homepage_cta" className="pros-cta__button pros-cta__button--primary">
                    <span>Create Your Free Profile</span>
                    <small>List your practice in five minutes</small>
                  </Link>
                  <Link to="/pricing" className="pros-cta__button pros-cta__button--ghost">
                    <span>View Upgrade Options</span>
                    <small>Featured placement & city boosts</small>
                  </Link>
                </div>

                <p className="pros-cta__note">
                  Free basic listing • No credit card required • Upgrade later for featured placement
                </p>
              </div>

              <div className="pros-cta__panel">
                <div className="pros-cta__panel-card">
                  <p className="pros-cta__panel-eyebrow">Why counselors join</p>
                  <p className="pros-cta__panel-copy">
                    Be part of a curated directory built for therapists, clergy, and coaches who specialize in pre-marriage preparation.
                  </p>
                  <ul className="pros-cta__panel-list">
                    <li>Live in 12+ anchor cities today</li>
                    <li>Profiles reviewed for quality & alignment</li>
                    <li>Request featured placement when ready</li>
                  </ul>
                </div>
                <div className="pros-cta__stat-grid">
                  <div className="pros-cta__stat">
                    <span className="pros-cta__stat-value">12+</span>
                    <span className="pros-cta__stat-label">active metro directories</span>
                  </div>
                  <div className="pros-cta__stat">
                    <span className="pros-cta__stat-value">0%</span>
                    <span className="pros-cta__stat-label">commission or lead fees</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Simple privacy note - honest, not marketing fluff */}
        <section style={{
          background: 'var(--gray-50)',
          padding: 'var(--space-8) 0',
          textAlign: 'center'
        }}>
          <div className="container">
            <p style={{
              margin: 0,
              fontSize: '0.9rem',
              color: 'var(--text-secondary)'
            }}>
              <strong>Simple & Direct:</strong> We never sell your data or spam you. Couples contact counselors directly via email or phone. That's it.
            </p>
          </div>
        </section>
      </div>
    </>
  )
}

export default HomePage
