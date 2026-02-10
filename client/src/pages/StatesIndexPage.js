import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import SEOHelmet from '../components/analytics/SEOHelmet'
import CompactSearch from '../components/common/CompactSearch'
import { getAllSpecialties } from '../data/specialtyConfig'
import { STATE_CONFIG } from '../data/locationConfig'
import { profileOperations } from '../lib/supabaseClient'
import '../assets/css/states-page.css'

const STATES = Object.entries(STATE_CONFIG)
  .map(([slug, config]) => ({
    slug,
    name: config.name,
    abbr: config.abbr
  }))
  .sort((a, b) => a.name.localeCompare(b.name))

const StatesIndexPage = () => {
  const [stateCounts, setStateCounts] = useState({})
  const [coverageLoaded, setCoverageLoaded] = useState(false)

  useEffect(() => {
    const loadCoverage = async () => {
      const { data, error } = await profileOperations.getLocationCoverage()
      if (!error && data?.stateCounts) {
        setStateCounts(data.stateCounts)
      }
      setCoverageLoaded(true)
    }

    loadCoverage()
  }, [])

  const activeStates = useMemo(() => {
    return STATES
      .filter((stateItem) => (stateCounts[stateItem.abbr] || 0) > 0)
      .sort((a, b) => (stateCounts[b.abbr] || 0) - (stateCounts[a.abbr] || 0))
  }, [stateCounts])

  const visibleStates = coverageLoaded && activeStates.length > 0 ? activeStates : STATES

  // Generate ItemList structured data for states
  const statesItemList = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Premarital Counselors by State",
    "description": "Browse states with active premarital counselor listings and find verified professionals near you.",
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": visibleStates.length,
      "itemListElement": visibleStates.map((state, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "WebPage",
          "name": state.name,
          "url": `https://www.weddingcounselors.com/premarital-counseling/${state.slug}`,
          "description": `Find premarital counselors in ${state.name}`
        }
      }))
    }
  }

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Premarital Counseling', url: null }
  ]

  return (
    <div className="states-page">
      <SEOHelmet
        title="Premarital Counseling by State | Licensed Therapists, Coaches & Clergy"
        description="Find premarital counseling by state. Compare licensed therapists, faith-based counselors, and online options from active listings."
        url="/premarital-counseling"
        keywords="premarital counseling, premarital therapy, pre marriage counseling, couples counseling before marriage, pre cana"
        breadcrumbs={breadcrumbs}
        structuredData={statesItemList}
        canonicalUrl="https://www.weddingcounselors.com/premarital-counseling"
      />
      {/* Header */}
      <div className="states-page-header">
        <div className="states-grid">
          <div style={{ maxWidth: '64rem' }}>
            <nav>
              <Link to="/">Home</Link>
              <span style={{ margin: '0 0.5rem' }}>/</span>
              <span>Premarital Counseling</span>
            </nav>

            <h1>
              Premarital Counseling by State
            </h1>

            <p>
              Browse states to find vetted therapists, clergy, and premarital professionals with clear pricing and fit.
            </p>
          </div>
        </div>
      </div>

      {/* States Grid */}
      <div className="states-grid">
        {/* Quick Search */}
        <CompactSearch />

        {/* Marriage License Discount Banner */}
        <Link to="/premarital-counseling/marriage-license-discount" className="discount-banner">
          <div className="discount-banner-icon">
            <i className="fa fa-piggy-bank"></i>
          </div>
          <div className="discount-banner-content">
            <h3>Marriage License Savings by State</h3>
            <p>Some states reduce marriage license fees after qualifying premarital counseling. See where this applies.</p>
          </div>
          <span className="discount-banner-arrow">→</span>
        </Link>

          <div className="text-center" style={{ marginBottom: 'var(--space-8)' }}>
            <h2>
              {coverageLoaded ? 'States With Active Counselors' : 'Premarital Counseling by State'}
            </h2>
            <p>
              Select your state to find premarital counselors currently accepting inquiries.
            </p>
          </div>

          <div className="state-grid">
            {visibleStates.map(state => (
              <Link
                key={state.slug}
                to={`/premarital-counseling/${state.slug}`}
                className="state-card"
              >
                <div>
                  <h3>
                    {state.name}
                  </h3>
                  <p>
                    {state.abbr}
                    {stateCounts[state.abbr] ? ` • ${stateCounts[state.abbr]} listed` : ''}
                  </p>
                </div>
              </Link>
            ))}
        </div>
      </div>

      {/* Browse by Specialty */}
      <div className="specialty-browse-section">
        <div className="states-grid">
          <div className="text-center" style={{ marginBottom: 'var(--space-8)' }}>
            <h2>
              Browse by Specialty
            </h2>
            <p>
              Find premarital counselors specializing in your specific needs and preferences.
            </p>
          </div>

          <div className="specialty-cards-grid">
            {getAllSpecialties().map(specialty => (
              <Link
                key={specialty.slug}
                to={`/premarital-counseling/${specialty.slug}`}
                className="specialty-browse-card"
                style={{ '--specialty-color': specialty.color }}
              >
                <div className="specialty-browse-icon">
                  <i className={`fa ${specialty.icon}`}></i>
                </div>
                <div className="specialty-browse-content">
                  <h3>{specialty.name}</h3>
                  <p>{specialty.subtitle}</p>
                </div>
                <span className="specialty-browse-arrow">→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* SEO Content */}
      <div className="seo-content-section">
        <div className="states-grid">
          <div className="content-grid">
              <div>
                <h2>
                  Why Choose Premarital Counseling?
                </h2>
                
                <div>
                  <p>
                    Premarital counseling provides couples with essential tools and insights before marriage. 
                    Our network of licensed professionals across the U.S. helps couples build stronger relationships.
                  </p>
                  
                  <h3>
                    Benefits of Premarital Counseling:
                  </h3>
                  <ul>
                    <li>• Enhanced communication skills</li>
                    <li>• Conflict resolution strategies</li>
                    <li>• Financial planning discussions</li>
                    <li>• Family planning conversations</li>
                    <li>• Strengthened emotional intimacy</li>
                  </ul>
                </div>
              </div>
              
              <div>
                <h2>
                  How Our Directory Works
                </h2>
                
                <div>
                  <p>
                    Our comprehensive directory makes it easy to find qualified premarital counselors
                    in your state and city. Licensed therapists with verified credentials, plus vetted coaches and clergy reviewed for scope and qualifications.
                  </p>
                  
                  <h3>
                    What You'll Find:
                  </h3>
                  <ul>
                    <li>• Licensed therapists and counselors</li>
                    <li>• Marriage and family therapists (MFT)</li>
                    <li>• Faith-based counseling options</li>
                    <li>• Online and in-person sessions</li>
                    <li>• Verified professional profiles</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  )
}

export default StatesIndexPage
