import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { computeReadinessScore } from '../../data/jurisdictionBenefitsSchema'

/**
 * BenefitsReviewDashboard
 *
 * Admin review queue for jurisdiction_benefits records that are in
 * 'needs_review' state (produced by the extractor).
 *
 * Route: /admin/benefits
 * Access: admin only (ProtectedRoute requireAdmin={true})
 *
 * Layout:
 *   Left: list of jurisdictions needing review (sorted by readiness score desc)
 *   Right: diff view for selected jurisdiction — per-field values, confidence,
 *          excerpts, source links, last change_log entry, readiness breakdown
 */

const CONFIDENCE_COLOR = (c) => {
  if (c >= 0.90) return '#1a7a4a'  // green
  if (c >= 0.70) return '#b8860b'  // amber
  return '#c0392b'                  // red
}

const PCT = (c) => `${(c * 100).toFixed(0)}%`

const FIELD_LABELS = {
  benefit_types:              'Benefit types',
  license_fee_cents:          'Standard fee (cents)',
  discounted_fee_cents:       'Discounted fee (cents)',
  standard_waiting_period_hours: 'Waiting period (hours)',
  waiting_period_waived:      'Waiting period waived',
  premarital_program_required:'Program required',
  hours_required:             'Hours required',
  accepted_formats:           'Accepted formats',
  approved_provider_rules:    'Provider rules',
  certificate_fields:         'Certificate fields',
  submission_process:         'Submission process',
  statute_citation:           'Statute citation',
}

function formatCents(cents) {
  if (cents == null) return '—'
  return `$${(cents / 100).toFixed(2)}`
}

function formatFieldValue(field, value) {
  if (value === null || value === undefined) return <em style={{ color: '#999' }}>not set</em>
  if (field.endsWith('_cents')) return formatCents(value)
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'object') return <pre style={{ fontSize: '0.75rem', margin: 0 }}>{JSON.stringify(value, null, 2)}</pre>
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

const BenefitsReviewDashboard = () => {
  const [records, setRecords]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [selected, setSelected]       = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState('needs_review')

  const loadRecords = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('jurisdiction_benefits')
      .select([
        'id', 'jurisdiction_id', 'jurisdiction_name', 'state_abbr',
        'verification_status', 'page_readiness_score', 'last_verified_at',
        'field_confidence', 'change_log', 'official_sources',
        'benefit_types', 'license_fee_cents', 'discounted_fee_cents',
        'savings_amount_cents', 'standard_waiting_period_hours',
        'waiting_period_waived', 'premarital_program_required', 'hours_required',
        'accepted_formats', 'approved_provider_rules', 'certificate_fields',
        'submission_process', 'statute_citation', 'is_indexed', 'noindex_reason',
        'updated_at',
      ].join(', '))
      .eq('verification_status', filterStatus)
      .order('page_readiness_score', { ascending: false })

    if (error) { alert('Failed to load records: ' + error.message); setLoading(false); return }
    setRecords(data || [])
    setLoading(false)
  }, [filterStatus])

  useEffect(() => { loadRecords() }, [loadRecords])

  const handleApprove = async (record) => {
    if (!window.confirm(`Mark ${record.jurisdiction_name} as VERIFIED and allow indexing?`)) return
    setActionLoading(true)
    const { error } = await supabase
      .from('jurisdiction_benefits')
      .update({
        verification_status: 'verified',
        last_verified_at:    new Date().toISOString(),
        verified_by:         'human:admin',
      })
      .eq('id', record.id)

    if (error) { alert('Error: ' + error.message) }
    else {
      alert(`${record.jurisdiction_name} marked verified. Page will be indexed on next build.`)
      await loadRecords()
      setSelected(null)
    }
    setActionLoading(false)
  }

  const handleFlagForReview = async (record, note) => {
    const reason = note || window.prompt('Enter a note for the reviewer (required):')
    if (!reason) return
    setActionLoading(true)
    const { error } = await supabase
      .from('jurisdiction_benefits')
      .update({
        verification_status: 'needs_review',
        change_log: [
          ...(record.change_log || []),
          { changed_at: new Date().toISOString(), changed_by: 'human:admin', action: 'flagged', notes: reason },
        ].slice(-20),
      })
      .eq('id', record.id)

    if (error) { alert('Error: ' + error.message) }
    else { await loadRecords() }
    setActionLoading(false)
  }

  const lastChangeEntry = (record) =>
    record.change_log?.slice(-1)[0] || null

  const getReadiness = (record) => computeReadinessScore(record)

  // ─── Sidebar list ───────────────────────────────────────────────────────────
  const renderList = () => (
    <div className="benefits-review-list">
      <div className="review-list-header">
        <h2>Benefits Review Queue</h2>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="review-filter">
          <option value="needs_review">Needs Review</option>
          <option value="verified">Verified</option>
          <option value="stale">Stale</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {loading ? (
        <p className="review-loading">Loading...</p>
      ) : records.length === 0 ? (
        <p className="review-empty">No records in "{filterStatus}" status.</p>
      ) : (
        <ul className="review-items">
          {records.map(rec => {
            const { score } = getReadiness(rec)
            const isSelected = selected?.id === rec.id
            return (
              <li
                key={rec.id}
                className={`review-item ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelected(rec)}
              >
                <div className="review-item-name">{rec.jurisdiction_name}</div>
                <div className="review-item-meta">
                  <span className="review-item-score" style={{ color: score >= 70 ? '#1a7a4a' : '#c0392b' }}>
                    {score}/100
                  </span>
                  <span className="review-item-status">{rec.verification_status}</span>
                </div>
                {lastChangeEntry(rec)?.action === 'extraction' && (
                  <div className="review-item-updated">
                    AI extracted · {new Date(lastChangeEntry(rec).changed_at).toLocaleDateString()}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )

  // ─── Detail / diff view ────────────────────────────────────────────────────
  const renderDetail = () => {
    if (!selected) {
      return (
        <div className="benefits-review-detail empty">
          <p>Select a jurisdiction from the list to review.</p>
        </div>
      )
    }

    const { score, breakdown } = getReadiness(selected)
    const confidence = selected.field_confidence || {}
    const lastChange = lastChangeEntry(selected)
    const sources = selected.official_sources || []

    return (
      <div className="benefits-review-detail">
        <div className="review-detail-header">
          <div>
            <h2>{selected.jurisdiction_name}</h2>
            <span className="review-detail-id">{selected.jurisdiction_id} · {selected.state_abbr}</span>
          </div>
          <div className="review-detail-actions">
            <button
              className="btn btn-primary"
              disabled={actionLoading || score < 70}
              onClick={() => handleApprove(selected)}
              title={score < 70 ? `Readiness score ${score}/100 is below 70 threshold` : ''}
            >
              {actionLoading ? 'Saving...' : 'Approve & Verify'}
            </button>
            <button
              className="btn btn-outline"
              disabled={actionLoading}
              onClick={() => handleFlagForReview(selected)}
            >
              Flag Issue
            </button>
          </div>
        </div>

        {/* Readiness score breakdown */}
        <div className="review-readiness">
          <div className="review-readiness-score" style={{ color: score >= 70 ? '#1a7a4a' : '#c0392b' }}>
            Readiness: {score}/100 {score >= 70 ? '' : '(must be >= 70 to approve)'}
          </div>
          <div className="review-readiness-breakdown">
            {Object.entries(breakdown).map(([check, pts]) => (
              <span key={check} className={`readiness-check ${pts > 0 ? 'pass' : 'fail'}`}>
                {check.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>

        {/* Last extractor run */}
        {lastChange && (
          <div className="review-last-change">
            <strong>Last change:</strong>{' '}
            {lastChange.action} by {lastChange.changed_by}{' '}
            on {new Date(lastChange.changed_at).toLocaleString()}
            {lastChange.confidence && ` · overall confidence: ${PCT(lastChange.confidence)}`}
            {lastChange.notes && <em> — {lastChange.notes}</em>}
          </div>
        )}

        {/* Sources */}
        {sources.length > 0 && (
          <div className="review-sources">
            <h4>Sources</h4>
            {sources.map((src, i) => (
              <div key={i} className="review-source-item">
                <a href={src.url} target="_blank" rel="noopener noreferrer">{src.title || src.url}</a>
                <span className="source-type">{src.source_type}</span>
                {src.retrieved_at && <span className="source-retrieved">retrieved {new Date(src.retrieved_at).toLocaleDateString()}</span>}
              </div>
            ))}
          </div>
        )}

        {/* Per-field values + confidence */}
        <div className="review-fields">
          <h4>Extracted Fields</h4>
          <table className="review-field-table">
            <thead>
              <tr>
                <th>Field</th>
                <th>Value</th>
                <th>Confidence</th>
                <th>Source excerpt</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(FIELD_LABELS).map(([field, label]) => {
                const fieldConf  = confidence[field]
                const fieldValue = selected[field]
                const srcExcerpts = sources.flatMap(s => {
                  const e = s.excerpts?.[field]
                  return e ? [{ url: s.url, excerpt: e }] : []
                })

                return (
                  <tr key={field} className={fieldConf != null && fieldConf < 0.70 ? 'low-confidence' : ''}>
                    <td className="field-name">{label}</td>
                    <td className="field-value">{formatFieldValue(field, fieldValue)}</td>
                    <td className="field-confidence">
                      {fieldConf != null ? (
                        <span style={{ color: CONFIDENCE_COLOR(fieldConf), fontWeight: 600 }}>
                          {PCT(fieldConf)}
                        </span>
                      ) : <em style={{ color: '#999' }}>—</em>}
                    </td>
                    <td className="field-excerpt">
                      {srcExcerpts.length > 0
                        ? srcExcerpts.map((e, i) => (
                            <span key={i} className="excerpt-chip" title={e.url}>
                              "{e.excerpt.slice(0, 120)}{e.excerpt.length > 120 ? '…' : ''}"
                            </span>
                          ))
                        : null}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="benefits-review-dashboard">
      {renderList()}
      {renderDetail()}
    </div>
  )
}

export default BenefitsReviewDashboard
