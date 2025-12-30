import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProfileList from '../components/profiles/ProfileList'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import SEOHelmet from '../components/analytics/SEOHelmet'

import { profileOperations } from '../lib/supabaseClient'
import { normalizeStateAbbr } from '../lib/utils'

const ProfessionalsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [profiles, setProfiles] = useState([])
  const [filteredProfiles, setFilteredProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [filters, setFilters] = useState({
    profession: searchParams.get('profession') || '',
    city: searchParams.get('city') || '',
    state: searchParams.get('state') || '',
    specialty: searchParams.get('specialty') || '',
    availability: searchParams.get('availability') || ''
  })
  
  // Sorting and view options
  const [sortBy, setSortBy] = useState('relevance') // relevance, name, location, newest
  const [viewMode, setViewMode] = useState('grid') // grid or list
  const [showFilters, setShowFilters] = useState(false)

  // Load all profiles
  useEffect(() => {
    loadAllProfiles()
  }, [])

  // Apply filters and update URL params
  useEffect(() => {
    applyFiltersAndSort()
    updateURLParams()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profiles, searchTerm, filters, sortBy])

  const loadAllProfiles = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error } = await profileOperations.getProfiles()
      
      if (error) {
        setError(error.message)
      } else {
        setProfiles(data || [])
      }
    } catch (err) {
      setError('Failed to load professionals')
    } finally {
      setLoading(false)
    }
  }

  const applyFiltersAndSort = () => {
    let filtered = [...profiles]

    // Text search across multiple fields
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(profile => 
        profile.full_name?.toLowerCase().includes(term) ||
        profile.bio?.toLowerCase().includes(term) ||
        profile.city?.toLowerCase().includes(term) ||
        profile.state_province?.toLowerCase().includes(term) ||
        profile.specialties?.some(specialty => 
          specialty.toLowerCase().includes(term)
        ) ||
        profile.profession?.toLowerCase().includes(term)
      )
    }

    // Apply individual filters
    if (filters.profession) {
      filtered = filtered.filter(profile => 
        profile.profession === filters.profession
      )
    }

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
        // Match either by canonical abbreviation or by name substring
        return stAbbr === filterAbbr || st.toLowerCase().includes(filters.state.toLowerCase())
      })
    }

    if (filters.specialty) {
      filtered = filtered.filter(profile => 
        profile.specialties?.some(specialty => 
          specialty.toLowerCase().includes(filters.specialty.toLowerCase())
        )
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      // First: Sort by sponsored rank (Premium=2, Featured=1, Free=0)
      const rankA = a.sponsored_rank || 0
      const rankB = b.sponsored_rank || 0
      if (rankA !== rankB) return rankB - rankA
      
      // Second: Within same rank, prioritize is_sponsored (legacy support)
      if (a.is_sponsored && !b.is_sponsored) return -1
      if (!a.is_sponsored && b.is_sponsored) return 1
      
      switch (sortBy) {
        case 'name':
          return a.full_name.localeCompare(b.full_name)
        case 'location':
          const locationA = `${a.city || ''}, ${a.state_province || ''}`
          const locationB = `${b.city || ''}, ${b.state_province || ''}`
          return locationA.localeCompare(locationB)
        case 'newest':
          return new Date(b.created_at) - new Date(a.created_at)
        case 'relevance':
        default:
          // Relevance: sponsored first, then by match quality, then by date
          return new Date(b.created_at) - new Date(a.created_at)
      }
    })

    setFilteredProfiles(filtered)
  }

  const updateURLParams = () => {
    const params = new URLSearchParams()
    
    if (searchTerm) params.set('search', searchTerm)
    if (filters.profession) params.set('profession', filters.profession)
    if (filters.city) params.set('city', filters.city)
    if (filters.state) params.set('state', filters.state)
    if (filters.specialty) params.set('specialty', filters.specialty)
    
    setSearchParams(params)
  }

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }))
  }

  const clearAllFilters = () => {
    setSearchTerm('')
    setFilters({
      profession: '',
      city: '',
      state: '',
      specialty: '',
      availability: ''
    })
    setSearchParams(new URLSearchParams())
  }

  const professionOptions = [
    'Licensed Therapist',
    'Marriage & Family Therapist', 
    'Licensed Clinical Social Worker',
    'Relationship Coach',
    'Life Coach',
    'Clergy/Pastor'
  ]

  const specialtyOptions = [
    'Premarital Counseling',
    'Marriage Counseling',
    'Couples Therapy',
    'Relationship Counseling',
    'Communication Skills',
    'Conflict Resolution',
    'Financial Planning',
    'Gottman Method',
    'EFT (Emotionally Focused Therapy)',
    'PREPARE/ENRICH',
    'SYMBIS Assessment',
    'Christian Counseling',
    'Faith-Based Counseling',
    'Religious Counseling',
    'Interfaith Relationships',
    'LGBTQ+ Affirming',
    'Multicultural Counseling',
    'Blended Families',
    'Family Therapy',
    'Emotional Intelligence',
    'Intimacy Issues'
  ]

  const stateOptions = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 
    'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 
    'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 
    'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 
    'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 
    'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 
    'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 
    'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 
    'West Virginia', 'Wisconsin', 'Wyoming'
  ]

  return (
    <div className="professionals-page">
      <SEOHelmet 
        title="Professional Search - Find Premarital Counselors"
        description={`Search and filter through ${profiles.length} qualified premarital counselors, therapists, and coaches. Find the perfect match for your needs.`}
        keywords="premarital counseling search, therapist directory, marriage counselor search"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Professional Directory Search',
          description: 'Advanced search for premarital counseling professionals'
        }}
      />
      {/* Page Header */}
      <section className="page-header" style={{ background: 'var(--gray-25)', padding: 'var(--space-12) 0' }}>
        <div className="container">
          <div className="page-header-content">
            <h1 className="font-display">Find Your Perfect Premarital Counselor</h1>
            <p className="lead">
              Browse our complete directory of {profiles.length} qualified professionals
            </p>
            
            {/* Quick Stats */}
            <div className="quick-stats">
              <div className="stat">
                <span className="stat-number">{filteredProfiles.length}</span>
                <span className="stat-label">
                  {filteredProfiles.length === profiles.length ? 'Total' : 'Matching'} Professionals
                </span>
              </div>
              <div className="stat">
                <span className="stat-number">
                  {profiles.filter(p => p.profession === 'Licensed Therapist' || p.profession === 'Marriage & Family Therapist').length}
                </span>
                <span className="stat-label">Licensed Therapists</span>
              </div>
              <div className="stat">
                <span className="stat-number">
                  {profiles.filter(p => p.profession?.includes('Coach')).length}
                </span>
                <span className="stat-label">Certified Coaches</span>
              </div>
              <div className="stat">
                <span className="stat-number">
                  {profiles.filter(p => p.profession === 'Clergy/Pastor').length}
                </span>
                <span className="stat-label">Clergy & Ministers</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filters Section */}
      <section className="search-filters-section" style={{ background: 'var(--white)', padding: 'var(--space-8) 0', borderBottom: '1px solid var(--gray-100)' }}>
        <div className="container">
          {/* Main Search Bar */}
          <div className="main-search">
            <div className="search-input-group">
              <input
                type="text"
                className="form-control search-input-large"
                placeholder="Search by name, location, specialty, or keyword..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="btn btn-primary search-btn">
                <i className="fa fa-search" aria-hidden="true"></i>
                <span>Search</span>
              </button>
            </div>
          </div>

          {/* Filter Toggle and Sort Controls */}
          <div className="filter-controls">
            <div className="filter-toggle-group">
              <button 
                className={`btn btn-outline filter-toggle ${showFilters ? 'active' : ''}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <i className="fa fa-filter" aria-hidden="true"></i>
                <span>Filters</span>
                {Object.values(filters).some(v => v) && (
                  <span className="filter-count">
                    {Object.values(filters).filter(v => v).length}
                  </span>
                )}
              </button>
              
              {Object.values(filters).some(v => v) || searchTerm ? (
                <button className="btn btn-text clear-filters" onClick={clearAllFilters}>
                  <i className="fa fa-times" aria-hidden="true"></i>
                  <span>Clear All</span>
                </button>
              ) : null}
            </div>

            <div className="sort-view-controls">
              <div className="sort-control">
                <label htmlFor="sort-by">Sort by:</label>
                <select 
                  id="sort-by"
                  className="form-control sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="relevance">Most Relevant</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="location">Location</option>
                  <option value="newest">Newest First</option>
                </select>
              </div>
              
              <div className="view-control">
                <button 
                  className={`btn btn-icon ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                >
                  <i className="fa fa-th" aria-hidden="true"></i>
                </button>
                <button 
                  className={`btn btn-icon ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  title="List View"
                >
                  <i className="fa fa-list" aria-hidden="true"></i>
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="filters-panel">
              <div className="filters-grid">
                <div className="filter-group">
                  <label htmlFor="profession-filter">Professional Type</label>
                  <select
                    id="profession-filter"
                    className="form-control"
                    value={filters.profession}
                    onChange={(e) => handleFilterChange('profession', e.target.value)}
                  >
                    <option value="">All Professional Types</option>
                    {professionOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label htmlFor="specialty-filter">Specialty</label>
                  <select
                    id="specialty-filter"
                    className="form-control"
                    value={filters.specialty}
                    onChange={(e) => handleFilterChange('specialty', e.target.value)}
                  >
                    <option value="">All Specialties</option>
                    {specialtyOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label htmlFor="city-filter">City</label>
                  <input
                    type="text"
                    id="city-filter"
                    className="form-control"
                    placeholder="Enter city name"
                    value={filters.city}
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                  />
                </div>

                <div className="filter-group">
                  <label htmlFor="state-filter">State</label>
                  <select
                    id="state-filter"
                    className="form-control"
                    value={filters.state}
                    onChange={(e) => handleFilterChange('state', e.target.value)}
                  >
                    <option value="">All States</option>
                    {stateOptions.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Results Section */}
      <section className="results-section" style={{ padding: 'var(--space-8) 0', minHeight: '60vh' }}>
        <div className="container">
          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-16) 0' }}>
              <LoadingSpinner />
              <p>Loading professionals...</p>
            </div>
          ) : error ? (
            <ErrorMessage message={error} />
          ) : (
            <>
              {/* Results Header */}
              <div className="results-header">
                <h2>
                  {filteredProfiles.length === profiles.length 
                    ? `All ${profiles.length} Professionals`
                    : `${filteredProfiles.length} of ${profiles.length} Professionals`
                  }
                </h2>
                {searchTerm && (
                  <p className="search-summary">
                    Results for "<strong>{searchTerm}</strong>"
                  </p>
                )}
              </div>

              {/* Active Filters Display */}
              {(Object.values(filters).some(v => v) || searchTerm) && (
                <div className="active-filters">
                  <span className="active-filters-label">Active filters:</span>
                  <div className="filter-tags">
                    {searchTerm && (
                      <span className="filter-tag">
                        Search: {searchTerm}
                        <button onClick={() => setSearchTerm('')}>
                          <i className="fa fa-times" aria-hidden="true"></i>
                        </button>
                      </span>
                    )}
                    {Object.entries(filters).map(([key, value]) => 
                      value && (
                        <span key={key} className="filter-tag">
                          {key}: {value}
                          <button onClick={() => handleFilterChange(key, '')}>
                            <i className="fa fa-times" aria-hidden="true"></i>
                          </button>
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Profile Results */}
              {filteredProfiles.length > 0 ? (
                <ProfileList 
                  profiles={filteredProfiles}
                  loading={false}
                  error={null}
                  viewMode={viewMode}
                />
              ) : (
                <div className="no-results">
                  <div className="no-results-content">
                    <i className="fa fa-search no-results-icon" aria-hidden="true"></i>
                    <h3>No professionals found</h3>
                    <p>
                      Try adjusting your search criteria or{' '}
                      <button className="btn btn-link" onClick={clearAllFilters}>
                        clear all filters
                      </button>
                      {' '}to see all professionals.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}

export default ProfessionalsPage
