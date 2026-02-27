import React from 'react'
import CITY_HUB_CONTENT from '../../data/cityHubContent'

/**
 * Renders hand-written editorial content for top city hub pages.
 * Only renders when unique content exists for the given state/city combo.
 * This content differentiates city pages from templated programmatic SEO.
 */
const CityEditorialContent = ({ stateSlug, citySlug }) => {
  const key = `${stateSlug}/${citySlug}`
  const content = CITY_HUB_CONTENT[key]

  if (!content) return null

  return (
    <section className="city-editorial-content" style={{
      margin: 'var(--space-8) 0',
      padding: 'var(--space-6) var(--space-8)',
      background: 'var(--bg-primary)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--gray-200)',
      lineHeight: 1.8
    }}>
      <h2 style={{
        fontSize: 'var(--text-xl)',
        marginBottom: 'var(--space-5)',
        color: 'var(--text-primary)'
      }}>
        {content.heading}
      </h2>

      {content.paragraphs.map((paragraph, index) => (
        <p key={index} style={{
          marginBottom: index < content.paragraphs.length - 1 ? 'var(--space-4)' : 0,
          color: 'var(--text-secondary)',
          fontSize: '1rem'
        }}>
          {paragraph}
        </p>
      ))}
    </section>
  )
}

export default CityEditorialContent
