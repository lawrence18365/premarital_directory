import React from 'react'
import { Link } from 'react-router-dom'

/**
 * CitationsBlock
 *
 * Renders the citations + last-verified section at the bottom of
 * every marriage license benefit page. Required for is_indexed=true.
 *
 * Props:
 *   sources        — official_sources_public[] from jurisdiction_benefits_public view
 *   statuteCitation — statute_citation string (e.g. "Fla. Stat. § 741.0305")
 *   lastVerifiedAt  — ISO8601 string
 *   verificationStatus — "verified"|"needs_review"|"stale"|...
 */
const SOURCE_TYPE_LABELS = {
  state_statute:      'State Statute',
  county_clerk_site:  'County Clerk Website',
  official_form:      'Official Government Form',
  state_agency:       'State Agency',
  court_site:         'Court Website',
  faq_page:           'Government FAQ',
}

function formatDate(isoString) {
  if (!isoString) return null
  const d = new Date(isoString)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

const CitationsBlock = ({ sources = [], statuteCitation, lastVerifiedAt, verificationStatus }) => {
  const hasAnySources = sources.length > 0 || statuteCitation

  return (
    <div className="citations-block" role="region" aria-label="Sources and verification">
      <div className="citations-header">
        <h3>Sources & Verification</h3>
        <div className="citations-meta">
          {lastVerifiedAt && (
            <span className={`verification-badge ${verificationStatus || ''}`}>
              Last verified: {formatDate(lastVerifiedAt)}
            </span>
          )}
          {!lastVerifiedAt && (
            <span className="verification-badge unverified">
              Pending verification
            </span>
          )}
        </div>
      </div>

      {hasAnySources ? (
        <div className="citations-list">
          {statuteCitation && (
            <div className="citation-item citation-statute">
              <span className="citation-type-badge">Statute</span>
              <span className="citation-text">{statuteCitation}</span>
            </div>
          )}

          {sources.map((src, i) => (
            <div key={i} className="citation-item">
              <span className="citation-type-badge">
                {SOURCE_TYPE_LABELS[src.source_type] || src.source_type}
              </span>
              <div className="citation-content">
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="citation-link"
                >
                  {src.title || src.url}
                  <i className="fa fa-external-link citation-ext-icon" aria-hidden="true" />
                </a>
                {src.retrieved_at && (
                  <span className="citation-retrieved">
                    Retrieved {formatDate(src.retrieved_at)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="citations-empty">
          Primary sources are being verified. Data comes from our research team.
        </p>
      )}

      <div className="citations-footer">
        <p>
          We verify information against primary government sources and update
          regularly. <Link to="/editorial-standards">See our editorial standards.</Link>
          {' '}Found an error?{' '}
          <Link to="/corrections">Submit a correction.</Link>
        </p>
      </div>
    </div>
  )
}

export default CitationsBlock
