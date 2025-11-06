import React from 'react'

const SearchFilters = ({ 
  searchTerm, 
  onSearchChange,
  filters, 
  onFilterChange, 
  onClearFilters,
  className = "" 
}) => {
  
  const professionOptions = [
    'Licensed Therapist',
    'Marriage & Family Therapist', 
    'Licensed Clinical Social Worker',
    'Relationship Coach',
    'Life Coach',
    'Clergy/Pastor',
    'Chaplain',
    'Counselor'
  ]
  
  const specialtyOptions = [
    'Communication Skills',
    'Conflict Resolution', 
    'Financial Planning',
    'Intimacy & Sexuality',
    'Family Planning',
    'Religious Counseling',
    'Emotional Intelligence',
    'Pre-Cana',
    'Christian Counseling',
    'Gottman Method',
    'EFT (Emotionally Focused Therapy)',
    'Prepare/Enrich',
    'SYMBIS Assessment',
    'Blended Families',
    'Interfaith Relationships',
    'LGBTQ+ Affirming',
    'Multicultural Counseling'
  ]

  const activeFiltersCount = Object.values(filters).filter(f => f && f.trim()).length + (searchTerm ? 1 : 0)

  return (
    <div className={`search-filters ${className}`}>
      <form className="search-form" onSubmit={(e) => e.preventDefault()}>
        <div className="form-group">
          <label htmlFor="search">Search</label>
          <input
            type="text"
            id="search"
            className="form-control"
            placeholder="Name, location, or specialty..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="profession">Profession</label>
          <select
            id="profession"
            className="form-control"
            value={filters.profession || ''}
            onChange={(e) => onFilterChange('profession', e.target.value)}
          >
            <option value="">All Professions</option>
            {professionOptions.map(profession => (
              <option key={profession} value={profession}>
                {profession}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="location">Location</label>
          <input
            type="text"
            id="location"
            className="form-control"
            placeholder="City or State"
            value={filters.city || ''}
            onChange={(e) => onFilterChange('city', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="specialty">Specialty</label>
          <select
            id="specialty"
            className="form-control"
            value={filters.specialty || ''}
            onChange={(e) => onFilterChange('specialty', e.target.value)}
          >
            <option value="">All Specialties</option>
            {specialtyOptions.map(specialty => (
              <option key={specialty} value={specialty}>
                {specialty}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <button 
            type="button" 
            className="btn btn-outline"
            onClick={onClearFilters}
            disabled={activeFiltersCount === 0}
          >
            Clear {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </button>
        </div>
      </form>
    </div>
  )
}

export default SearchFilters