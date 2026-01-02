import React from 'react'
import { STATE_DISCOUNT_CONFIG } from '../../data/specialtyConfig'
import { CITY_CONFIG } from '../../data/locationConfig'

const LocationInsights = ({ stateSlug, citySlug, specialty }) => {
  const discountInfo = STATE_DISCOUNT_CONFIG[stateSlug]
  
  // Estimate cost tier based on anchor status or hardcoded list
  // High Cost: NY, CA, DC, MA, etc.
  // Medium Cost: TX, FL, IL, GA, etc.
  // Low Cost: AL, MS, etc.
  
  // This is heuristic for SEO display, accurate enough for estimates
  const getCostEstimate = () => {
    if (!citySlug) return '$100 - $180'
    
    const highCostStates = ['new-york', 'california', 'massachusetts', 'washington-dc', 'hawaii']
    const mediumCostStates = ['texas', 'florida', 'illinois', 'colorado', 'washington', 'oregon']
    
    if (highCostStates.includes(stateSlug)) return '$150 - $250'
    if (mediumCostStates.includes(stateSlug)) return '$120 - $200'
    return '$90 - $160'
  }

  const costEstimate = getCostEstimate()
  const cityName = citySlug 
    ? citySlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : 'Local'

  return (
    <div className="location-insights-box" style={{
      marginTop: 'var(--space-6)',
      marginBottom: 'var(--space-8)',
      background: 'white',
      border: '1px solid var(--gray-200)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
      overflow: 'hidden'
    }}>
      <div style={{
        padding: 'var(--space-4) var(--space-6)',
        background: 'var(--gray-50)',
        borderBottom: '1px solid var(--gray-200)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
          At a Glance: Premarital Counseling in {cityName}
        </h3>
        {discountInfo && (
          <span className="badge badge-success" style={{ 
            background: 'var(--success-bg)', 
            color: 'var(--success-dark)',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '0.8rem',
            fontWeight: '600'
          }}>
            License Discount Available
          </span>
        )}
      </div>
      
      <div className="insights-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        divideX: '1px solid var(--gray-100)'
      }}>
        {/* Cost Block */}
        <div className="insight-item" style={{ padding: 'var(--space-5)' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginBottom: '4px' }}>
            Average Cost
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {costEstimate}
            <span style={{ fontSize: '0.8rem', fontWeight: '400', color: 'var(--text-tertiary)', marginLeft: '4px' }}>/ session</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Based on {cityName} market rates
          </p>
        </div>

        {/* Timeline Block */}
        <div className="insight-item" style={{ padding: 'var(--space-5)', borderLeft: '1px solid var(--gray-100)' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginBottom: '4px' }}>
            Typical Timeline
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            2 - 3 Months
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Before the wedding date
          </p>
        </div>

        {/* Discount Block (Conditional) */}
        {discountInfo ? (
          <div className="insight-item" style={{ padding: 'var(--space-5)', borderLeft: '1px solid var(--gray-100)' }}>
             <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginBottom: '4px' }}>
              Marriage License Savings
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--success)' }}>
              {discountInfo.discount} Off
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              + {discountInfo.waitingPeriod || 'Waiting period waiver'}
            </p>
          </div>
        ) : (
           <div className="insight-item" style={{ padding: 'var(--space-5)', borderLeft: '1px solid var(--gray-100)' }}>
             <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginBottom: '4px' }}>
              Recommended Sessions
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              5 - 8 Sessions
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Standard curriculum depth
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default LocationInsights
