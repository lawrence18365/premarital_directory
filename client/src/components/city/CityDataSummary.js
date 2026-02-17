import React from 'react'
import { STATE_MARRIAGE_DATA } from '../../data/stateMarriageData'

/**
 * Renders 2-3 natural-language prose paragraphs from real profile data.
 * Every sentence is backed by computed stats — nothing hardcoded.
 * Sentences are conditionally included only when data exists.
 */
const CityDataSummary = ({ stats, cityName, stateName, stateSlug }) => {
  if (!stats || stats.total === 0) return null

  const marriageData = STATE_MARRIAGE_DATA[stateSlug]

  return (
    <section className="city-data-summary" style={{
      margin: 'var(--space-8) 0',
      padding: 'var(--space-6) var(--space-8)',
      background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--gray-200)',
      lineHeight: 1.7
    }}>
      <h2 style={{
        fontSize: 'var(--text-xl)',
        marginBottom: 'var(--space-4)',
        color: 'var(--text-primary)'
      }}>
        Premarital Counseling in {cityName} at a Glance
      </h2>

      {/* Paragraph 1: Provider inventory */}
      <p style={{ marginBottom: 'var(--space-4)', color: 'var(--text-secondary)' }}>
        {buildInventoryParagraph(stats, cityName)}
      </p>

      {/* Paragraph 2: Services & methods */}
      {buildServicesParagraph(stats) && (
        <p style={{ marginBottom: 'var(--space-4)', color: 'var(--text-secondary)' }}>
          {buildServicesParagraph(stats)}
        </p>
      )}

      {/* Paragraph 3: State marriage data (when available) */}
      {marriageData && (
        <p style={{ marginBottom: 0, color: 'var(--text-secondary)' }}>
          {buildMarriageParagraph(marriageData, stateName)}
        </p>
      )}
    </section>
  )
}

function buildInventoryParagraph(stats, cityName) {
  const parts = []

  // Main count sentence
  const roleFragments = []
  if (stats.therapists > 0) {
    const licenseLabels = stats.licenseTypes.map((lt) => lt.type).slice(0, 3).join(', ')
    roleFragments.push(
      <>
        <strong>{stats.therapists}</strong> licensed therapist{stats.therapists === 1 ? '' : 's'}
        {licenseLabels ? ` (${licenseLabels})` : ''}
      </>
    )
  }
  if (stats.clergy > 0) {
    roleFragments.push(
      <><strong>{stats.clergy}</strong> clerg{stats.clergy === 1 ? 'y member' : 'y'}</>
    )
  }
  if (stats.coaches > 0) {
    roleFragments.push(
      <><strong>{stats.coaches}</strong> relationship coach{stats.coaches === 1 ? '' : 'es'}</>
    )
  }

  parts.push(
    <span key="count">
      {cityName} has <strong>{stats.total}</strong> listed premarital counselor{stats.total === 1 ? '' : 's'}
      {roleFragments.length > 0 && <>, including {joinFragments(roleFragments)}</>}
      .
    </span>
  )

  // Price sentence
  if (stats.priceRange.source === 'directory' && stats.priceRange.count > 0) {
    parts.push(
      <span key="price">
        {' '}Published session rates range from <strong>${stats.priceRange.min}&ndash;${stats.priceRange.max}/session</strong>,
        based on {stats.priceRange.count} profile{stats.priceRange.count === 1 ? '' : 's'} with pricing listed.
      </span>
    )
  }

  return <>{parts}</>
}

function buildServicesParagraph(stats) {
  const sentences = []

  if (stats.onlineCount > 0) {
    sentences.push(
      <span key="online">
        <strong>{stats.onlineCount}</strong> counselor{stats.onlineCount === 1 ? ' offers' : 's offer'} online or telehealth sessions.
      </span>
    )
  }

  if (stats.faithBasedCount > 0) {
    sentences.push(
      <span key="faith">
        {' '}<strong>{stats.faithBasedCount}</strong> professional{stats.faithBasedCount === 1 ? ' offers' : 's offer'} faith-based counseling.
      </span>
    )
  }

  if (stats.methods.length > 0) {
    const methodList = stats.methods.slice(0, 3).map((m) => `${m.label} (${m.count})`).join(', ')
    sentences.push(
      <span key="methods">
        {' '}The most common approaches include {methodList}.
      </span>
    )
  }

  if (stats.lgbtqAffirmingCount > 0) {
    sentences.push(
      <span key="lgbtq">
        {' '}<strong>{stats.lgbtqAffirmingCount}</strong> provider{stats.lgbtqAffirmingCount === 1 ? ' is' : 's are'} LGBTQ+ affirming.
      </span>
    )
  }

  if (stats.insuranceCount > 0) {
    sentences.push(
      <span key="insurance">
        {' '}<strong>{stats.insuranceCount}</strong> accept{stats.insuranceCount === 1 ? 's' : ''} insurance.
      </span>
    )
  }

  if (sentences.length === 0) return null
  return <>{sentences}</>
}

function buildMarriageParagraph(data, stateName) {
  const sentences = []

  if (data.marriagesPerYear) {
    sentences.push(
      `${stateName} sees approximately ${data.marriagesPerYear.toLocaleString()} marriages per year.`
    )
  }

  if (data.marriageLicenseFee) {
    const waitPart = data.waitingPeriod && data.waitingPeriod !== 'None'
      ? ` with a ${data.waitingPeriod.toLowerCase()} waiting period`
      : ' with no waiting period'
    sentences.push(
      `The marriage license fee is ${data.marriageLicenseFee}${waitPart}.`
    )
  }

  if (data.medianAgeFirstMarriage) {
    sentences.push(
      `The median age at first marriage is ${data.medianAgeFirstMarriage.female} for women and ${data.medianAgeFirstMarriage.male} for men.`
    )
  }

  return sentences.join(' ')
}

function joinFragments(fragments) {
  if (fragments.length === 0) return null
  if (fragments.length === 1) return fragments[0]
  if (fragments.length === 2) {
    return <>{fragments[0]} and {fragments[1]}</>
  }
  return (
    <>
      {fragments.slice(0, -1).map((f, i) => (
        <span key={i}>{f}, </span>
      ))}
      and {fragments[fragments.length - 1]}
    </>
  )
}

export default CityDataSummary
