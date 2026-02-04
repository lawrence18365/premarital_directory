import React from 'react'
import { Link } from 'react-router-dom'
import { getAllSpecialties } from '../../data/specialtyConfig'

const SpecialtiesList = ({ stateSlug, citySlug }) => {
  const specialties = getAllSpecialties()
  const locationName = citySlug 
    ? citySlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : stateSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  // Base URL for specialty links
  const _baseUrl = citySlug
    ? `/premarital-counseling` // Base
    : `/premarital-counseling`
  void _baseUrl // Suppress unused warning - reserved for future use

  return (
    <div className="specialties-list-section" style={{ marginTop: 'var(--space-10)' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-4)' }}>
        Specialized Premarital Counseling in {locationName}
      </h2>
      <div className="specialties-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
        gap: 'var(--space-4)' 
      }}>
        {specialties.map(specialty => {
          // Construct URL: /premarital-counseling/specialty/state[/city]
          const url = citySlug
            ? `/premarital-counseling/${specialty.slug}/${stateSlug}/${citySlug}`
            : `/premarital-counseling/${specialty.slug}/${stateSlug}`

          return (
            <Link 
              key={specialty.slug} 
              to={url}
              className="specialty-link-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: 'var(--space-4)',
                background: 'white',
                border: '1px solid var(--gray-200)',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                color: 'var(--text-primary)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'
                e.currentTarget.style.borderColor = specialty.color
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.borderColor = 'var(--gray-200)'
              }}
            >
              <div style={{ 
                color: specialty.color, 
                width: '32px', 
                fontSize: '1.25rem',
                display: 'flex',
                justifyContent: 'center'
              }}>
                <i className={`fa ${specialty.icon}`}></i>
              </div>
              <div style={{ marginLeft: 'var(--space-3)' }}>
                <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{specialty.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>in {locationName}</div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default SpecialtiesList
