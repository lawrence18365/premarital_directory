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
import trustSecureImg from '../assets/images/phone_and_lock.webp'
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
        console.log('HomePage - Supabase error:', error)
      } else {
        console.log('HomePage - Loaded profiles count:', (data || []).length)
        console.log('HomePage - First profile sample:', data?.[0])
        setProfiles(data || [])
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
    const params = new URLSearchParams()
    if (searchTerm.trim()) params.set('search', searchTerm.trim())
    if (filters.state) params.set('state', filters.state)
    if (filters.profession) params.set('profession', filters.profession)
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
        description="Connect with qualified premarital counselors helping engaged couples prepare for marriage. Find pre-marriage therapy professionals in your area to build a strong foundation before your wedding."
        url="/"
        keywords="premarital counseling, pre-marriage therapy, engaged couples counseling, marriage preparation, premarital therapy, pre-wedding counseling, relationship preparation"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Wedding Counselors",
          "url": "https://www.weddingcounselors.com",
          "description": "Find qualified premarital counselors, therapists, and coaches near you.",
          "potentialAction": {
            "@type": "SearchAction",
          "target": "https://www.weddingcounselors.com/premarital-counseling?search={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        }}
      />
      
      <div className="homepage">
        {/* Above-the-fold Hero: premium full-bleed background */}
        <section className="hero-immersive">
          {/* High-priority background image for better LCP */}
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
              <p className="hero-subtitle">Licensed therapists (LMFT, LPC), Christian counselors, and online programs. Compare prices, methods, and book intro sessions.</p>

              {/* Minimal, focused above-the-fold */}

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

              {/* Trust row removed to keep hero calm */}
            </div>
          </div>
        </section>

        {/* Trust Indicators */}
        <section className="trust-cards">
          <div className="container">
            <h2 className="text-center">Helping Engaged Couples Prepare for Marriage</h2>
            <div className="trust-grid">
              <div className="trust-card">
                <div className="trust-media"><img src={trustMatchImg} alt="Smiling engaged couple after finding a premarital counselor through the directory." className="trust-image" /></div>
                <h3 className="trust-title">Find Your Premarital Counselor</h3>
                <p className="trust-description">Connect with experienced counselors who specialize in pre-marriage preparation.</p>
              </div>

              <div className="trust-card">
                <div className="trust-media"><img src={trustFoundationImg} alt="Engaged couple feeling confident after premarital counseling, hands together over coffee." className="trust-image" /></div>
                <h3 className="trust-title">Prepare for a Strong Marriage</h3>
                <p className="trust-description">Build a solid foundation before your wedding with expert premarital counseling.</p>
              </div>

              <div className="trust-card">
                <div className="trust-media"><img src={trustJourneyImg} alt="Engaged couple walking hand-in-hand, ready to prepare for marriage together." className="trust-image" /></div>
                <h3 className="trust-title">Start Your Marriage Right</h3>
                <p className="trust-description">Address important topics before you say "I do" with pre-marriage therapy.</p>
              </div>

              <div className="trust-card">
                <div className="trust-media"><img src={trustSecureImg} alt="Secure matching: privacy-first platform symbolized by a phone and lock still life." className="trust-image" /></div>
                <h3 className="trust-title">A Platform You Can Trust</h3>
                <p className="trust-description">Your privacy and security are our top priorities.</p>
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
              {/* Top 20 priority cities based on GSC data */}
              {[
                { city: 'Indianapolis', state: 'Indiana', slug: 'indianapolis', stateSlug: 'indiana' },
                { city: 'Sioux Falls', state: 'South Dakota', slug: 'sioux-falls', stateSlug: 'south-dakota' },
                { city: 'Honolulu', state: 'Hawaii', slug: 'honolulu', stateSlug: 'hawaii' },
                { city: 'Wilmington', state: 'Delaware', slug: 'wilmington', stateSlug: 'delaware' },
                { city: 'Springfield', state: 'Illinois', slug: 'springfield', stateSlug: 'illinois' },
                { city: 'Miami', state: 'Florida', slug: 'miami', stateSlug: 'florida' },
                { city: 'Tampa', state: 'Florida', slug: 'tampa', stateSlug: 'florida' },
                { city: 'Austin', state: 'Texas', slug: 'austin', stateSlug: 'texas' },
                { city: 'Dallas', state: 'Texas', slug: 'dallas', stateSlug: 'texas' },
                { city: 'Houston', state: 'Texas', slug: 'houston', stateSlug: 'texas' },
                { city: 'Phoenix', state: 'Arizona', slug: 'phoenix', stateSlug: 'arizona' },
                { city: 'Los Angeles', state: 'California', slug: 'los-angeles', stateSlug: 'california' },
                { city: 'San Francisco', state: 'California', slug: 'san-francisco', stateSlug: 'california' },
                { city: 'San Diego', state: 'California', slug: 'san-diego', stateSlug: 'california' },
                { city: 'Seattle', state: 'Washington', slug: 'seattle', stateSlug: 'washington' },
                { city: 'Portland', state: 'Oregon', slug: 'portland', stateSlug: 'oregon' },
                { city: 'Denver', state: 'Colorado', slug: 'denver', stateSlug: 'colorado' },
                { city: 'Chicago', state: 'Illinois', slug: 'chicago', stateSlug: 'illinois' },
                { city: 'New York', state: 'New York', slug: 'new-york', stateSlug: 'new-york' },
                { city: 'Boston', state: 'Massachusetts', slug: 'boston', stateSlug: 'massachusetts' }
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

        {/* Featured Professionals */}
        <section className="profiles-section" style={{ background: 'white' }}>
          <div className="container">
            <div className="section-header text-center">
              <h2 className="font-display">Featured Premarital Counselors</h2>
              <p className="lead">Connect with licensed premarital counselors who help engaged couples prepare for marriage</p>
            </div>
          </div>
          
          <ProfileList 
            profiles={filteredProfiles.slice(0, 6)}
            loading={loading}
            error={error}
            showViewAll={true}
          />
        </section>

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

        {/* Call to Action for Professionals */}
        <section className="pros-cta">
          <div className="container">
            <div className="pros-card">
              <div className="pros-card-inner">
                <p className="eyebrow">For Premarital Counselors</p>
                <h2 className="section-title">Connect With Engaged Couples</h2>
                <p className="section-subtitle">
                  Join premarital counselors, therapists, and coaches connecting with engaged couples actively seeking pre-marriage therapy.
                </p>

                <div className="benefit-chips">
                  <div className="chip"><span className="chip-icon"><i className="fa fa-users" aria-hidden="true"></i></span>Qualified leads</div>
                  <div className="chip"><span className="chip-icon"><i className="fa fa-chart-line" aria-hidden="true"></i></span>Grow your practice</div>
                  <div className="chip"><span className="chip-icon"><i className="fa fa-shield-alt" aria-hidden="true"></i></span>Verified credibility</div>
                </div>

                <div className="cta-actions">
                  <Link to="/professional/signup" className="btn btn-cta-primary">
                    <i className="fa fa-plus-circle mr-2" aria-hidden="true"></i>
                    Join Directory Now
                  </Link>
                  <Link to="/pricing" className="btn btn-cta-ghost">
                    View Pricing
                  </Link>
                </div>

                <p className="cta-note">Free basic listing • No setup fees • Start connecting today</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

export default HomePage
