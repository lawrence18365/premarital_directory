import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import ProfileList from '../components/profiles/ProfileList'
import SEOHelmet from '../components/analytics/SEOHelmet'
import '../assets/css/hero-modern.css'
import '../assets/css/hero-immersive.css'
import '../assets/css/trust-cards.css'
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

const HomePage = () => {
  const [profiles, setProfiles] = useState([])
  const [filteredProfiles, setFilteredProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
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
      setLoading(true)
      setError(null)
      const { data, error } = await profileOperations.getProfiles()

      if (error) {
        setError(error.message)
      } else {
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
      setError('Failed to load profiles')
    } finally {
      setLoading(false)
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
        title="Find Premarital Counselors Near You | Pre-Marriage Therapy for Engaged Couples"
        description="Connect with premarital counselors helping engaged couples prepare for marriage. Find licensed therapists, Christian counselors, and online programs in your area."
        url="/"
        keywords="premarital counseling, pre-marriage therapy, engaged couples counseling, marriage preparation, premarital therapy, pre-wedding counseling, relationship preparation"
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
              <h1 className="hero-title">Premarital Counseling Near You — Therapists, Faith-Based & Online Options</h1>
              <p className="hero-subtitle">Licensed therapists (LMFT, LPC), Christian counselors, and online programs. Compare approaches, read bios, and contact counselors directly.</p>

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
        <section style={{
          background: 'white',
          padding: 'var(--space-12) 0',
          borderBottom: '1px solid var(--gray-200)'
        }}>
          <div className="container">
            <h2 style={{
              textAlign: 'center',
              marginBottom: 'var(--space-8)',
              fontSize: 'var(--text-2xl)',
              color: 'var(--text-primary)'
            }}>
              How It Works
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 'var(--space-8)',
              maxWidth: '900px',
              margin: '0 auto'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  background: 'var(--color-primary)',
                  color: 'white',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto var(--space-4)',
                  fontSize: '1.5rem',
                  fontWeight: '700'
                }}>1</div>
                <h3 style={{ marginBottom: 'var(--space-2)', fontSize: '1.1rem' }}>Choose Your City</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
                  Browse counselors in your area or search nearby cities
                </p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  background: 'var(--color-primary)',
                  color: 'white',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto var(--space-4)',
                  fontSize: '1.5rem',
                  fontWeight: '700'
                }}>2</div>
                <h3 style={{ marginBottom: 'var(--space-2)', fontSize: '1.1rem' }}>Compare Counselors</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
                  Read bios, see specialties, and compare therapists vs clergy vs coaches
                </p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  background: 'var(--color-primary)',
                  color: 'white',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto var(--space-4)',
                  fontSize: '1.5rem',
                  fontWeight: '700'
                }}>3</div>
                <h3 style={{ marginBottom: 'var(--space-2)', fontSize: '1.1rem' }}>Contact Directly</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
                  Reach out directly via email or phone — no middleman, no hidden fees
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Indicators - Updated to be honest */}
        <section className="trust-cards">
          <div className="container">
            <h2 className="text-center">Helping Engaged Couples Prepare for Marriage</h2>
            <div className="trust-grid">
              <div className="trust-card">
                <div className="trust-media"><img src={trustMatchImg} alt="Engaged couple after finding a premarital counselor" className="trust-image" /></div>
                <h3 className="trust-title">Find Your Premarital Counselor</h3>
                <p className="trust-description">Browse counselors who specialize in pre-marriage preparation for engaged couples.</p>
              </div>

              <div className="trust-card">
                <div className="trust-media"><img src={trustFoundationImg} alt="Engaged couple over coffee discussing marriage preparation" className="trust-image" /></div>
                <h3 className="trust-title">Prepare for a Strong Marriage</h3>
                <p className="trust-description">Build a solid foundation before your wedding with expert guidance.</p>
              </div>

              <div className="trust-card">
                <div className="trust-media"><img src={trustJourneyImg} alt="Engaged couple walking hand-in-hand" className="trust-image" /></div>
                <h3 className="trust-title">Start Your Marriage Right</h3>
                <p className="trust-description">Address important topics before you say "I do" with professional support.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Cities - Critical for SEO internal linking */}
        <section className="popular-cities-section" style={{ background: '#f8f9fa', padding: 'var(--space-16) 0' }}>
          <div className="container">
            <div className="section-header text-center" style={{ marginBottom: 'var(--space-12)' }}>
              <h2 className="font-display">Find Premarital Counseling Near You</h2>
              <p className="lead">Search for premarital counselors in these popular cities</p>
            </div>
            <div className="cities-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 'var(--space-6)',
              marginBottom: 'var(--space-8)'
            }}>
              {[
                { city: 'Austin', state: 'Texas', slug: 'austin', stateSlug: 'texas' },
                { city: 'Dallas', state: 'Texas', slug: 'dallas', stateSlug: 'texas' },
                { city: 'Houston', state: 'Texas', slug: 'houston', stateSlug: 'texas' },
                { city: 'Los Angeles', state: 'California', slug: 'los-angeles', stateSlug: 'california' },
                { city: 'San Francisco', state: 'California', slug: 'san-francisco', stateSlug: 'california' },
                { city: 'New York', state: 'New York', slug: 'new-york', stateSlug: 'new-york' },
                { city: 'Miami', state: 'Florida', slug: 'miami', stateSlug: 'florida' },
                { city: 'Chicago', state: 'Illinois', slug: 'chicago', stateSlug: 'illinois' },
                { city: 'Atlanta', state: 'Georgia', slug: 'atlanta', stateSlug: 'georgia' },
                { city: 'Denver', state: 'Colorado', slug: 'denver', stateSlug: 'colorado' },
                { city: 'Seattle', state: 'Washington', slug: 'seattle', stateSlug: 'washington' },
                { city: 'Phoenix', state: 'Arizona', slug: 'phoenix', stateSlug: 'arizona' }
              ].map((location, index) => (
                <Link
                  key={index}
                  to={`/premarital-counseling/${location.stateSlug}/${location.slug}`}
                  className="city-card"
                  style={{
                    background: 'white',
                    padding: 'var(--space-6)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #e5e7eb',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-2)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    margin: 0
                  }}>
                    Premarital counseling in {location.city}
                  </h3>
                  <p style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                    margin: 0
                  }}>
                    {location.state}
                  </p>
                  <span style={{
                    fontSize: '0.875rem',
                    color: 'var(--color-primary)',
                    fontWeight: '500'
                  }}>
                    View counselors →
                  </span>
                </Link>
              ))}
            </div>
            <div className="text-center">
              <Link to="/premarital-counseling" className="btn btn-secondary">
                View All Cities
              </Link>
            </div>
          </div>
        </section>

        {/* Provider CTA - MOVED HIGHER UP */}
        <section style={{
          background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
          padding: 'var(--space-8) 0',
          color: 'white'
        }}>
          <div className="container">
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--space-6)'
            }}>
              <div style={{ flex: '1 1 400px' }}>
                <h3 style={{ color: 'white', marginBottom: 'var(--space-2)', fontSize: '1.25rem' }}>
                  Are You a Premarital Counselor?
                </h3>
                <p style={{ margin: 0, opacity: 0.9, fontSize: '0.95rem' }}>
                  Join our directory and connect with engaged couples actively searching for premarital counseling in your area.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                <Link
                  to="/professional/create?signup_source=homepage"
                  style={{
                    padding: 'var(--space-3) var(--space-6)',
                    background: 'white',
                    color: '#0d9488',
                    fontWeight: '600',
                    borderRadius: 'var(--radius-md)',
                    textDecoration: 'none',
                    fontSize: '0.95rem'
                  }}
                >
                  Create Your Free Profile
                </Link>
                <Link
                  to="/pricing"
                  style={{
                    padding: 'var(--space-3) var(--space-6)',
                    background: 'transparent',
                    color: 'white',
                    fontWeight: '500',
                    borderRadius: 'var(--radius-md)',
                    textDecoration: 'none',
                    border: '1px solid rgba(255,255,255,0.5)',
                    fontSize: '0.95rem'
                  }}
                >
                  View Pricing
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Sample Profiles - Only show if we have premarital-focused ones */}
        {filteredProfiles.length > 0 && (
          <section className="profiles-section" style={{ background: 'white', padding: 'var(--space-16) 0' }}>
            <div className="container">
              <div className="section-header text-center">
                <h2 className="font-display">Sample Counselors in Our Directory</h2>
                <p className="lead">
                  Example profiles from counselors offering premarital services
                </p>
              </div>
            </div>

            <ProfileList
              profiles={filteredProfiles.slice(0, 6)}
              loading={loading}
              error={error}
              showViewAll={true}
            />
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
        />

        {/* Full Provider Section - More concrete value props */}
        <section className="pros-cta">
          <div className="container">
            <div className="pros-card">
              <div className="pros-card-inner">
                <p className="eyebrow">For Premarital Counselors, Therapists & Clergy</p>
                <h2 className="section-title">Get Found by Engaged Couples</h2>
                <p className="section-subtitle">
                  Couples actively search "premarital counseling [City]" — be there when they look.
                </p>

                <div style={{
                  background: 'rgba(255,255,255,0.1)',
                  padding: 'var(--space-6)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 'var(--space-6)'
                }}>
                  <h4 style={{ marginBottom: 'var(--space-4)', fontSize: '1rem' }}>What You Get:</h4>
                  <ul style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    display: 'grid',
                    gap: 'var(--space-3)',
                    fontSize: '0.95rem'
                  }}>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
                      <span style={{ color: '#34d399', fontWeight: 'bold' }}>✓</span>
                      <span>Show up on city pages like "Premarital Counseling in Austin, Texas"</span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
                      <span style={{ color: '#34d399', fontWeight: 'bold' }}>✓</span>
                      <span>Couples contact you directly — you control the conversation</span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
                      <span style={{ color: '#34d399', fontWeight: 'bold' }}>✓</span>
                      <span>See analytics: profile views, contact reveals, inquiries</span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
                      <span style={{ color: '#34d399', fontWeight: 'bold' }}>✓</span>
                      <span>Edit your profile anytime — bio, specialties, contact info</span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
                      <span style={{ color: '#34d399', fontWeight: 'bold' }}>✓</span>
                      <span>Remove your listing anytime if you change your mind</span>
                    </li>
                  </ul>
                </div>

                <div className="cta-actions">
                  <Link to="/professional/create?signup_source=homepage_cta" className="btn btn-cta-primary">
                    <i className="fa fa-plus-circle mr-2" aria-hidden="true"></i>
                    Create Your Free Profile
                  </Link>
                  <Link to="/pricing" className="btn btn-cta-ghost">
                    View Upgrade Options
                  </Link>
                </div>

                <p className="cta-note">
                  Free basic listing • No credit card required • Upgrade later for featured placement
                </p>
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
