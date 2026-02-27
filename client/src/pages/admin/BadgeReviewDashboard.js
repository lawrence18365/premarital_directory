import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Link } from 'react-router-dom'

const BadgeReviewDashboard = () => {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    loadSubmissions()
  }, [])

  const loadSubmissions = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('badge_submissions')
        .select('*, profiles(full_name, slug, city, state_province)')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })

      if (error) throw error
      setSubmissions(data || [])
    } catch (error) {
      console.error('Error loading badge submissions:', error)
      alert('Failed to load submissions: ' + error.message)
    }
    setLoading(false)
  }

  const handleApprove = async (submission) => {
    if (!window.confirm(`Approve badge submission from ${submission.profiles?.full_name}?`)) return

    setActionLoading(submission.id)
    try {
      const { error: updateError } = await supabase
        .from('badge_submissions')
        .update({ status: 'verified', checked_at: new Date().toISOString() })
        .eq('id', submission.id)

      if (updateError) throw updateError

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ badge_verified: true, badge_verified_at: new Date().toISOString() })
        .eq('id', submission.provider_id)

      if (profileError) throw profileError

      setSubmissions(prev => prev.filter(s => s.id !== submission.id))
    } catch (error) {
      console.error('Error approving badge:', error)
      alert('Failed to approve: ' + error.message)
    }
    setActionLoading(null)
  }

  const handleReject = async (submission) => {
    const reason = window.prompt('Rejection reason (optional):')
    if (reason === null) return

    setActionLoading(submission.id)
    try {
      const { error } = await supabase
        .from('badge_submissions')
        .update({
          status: 'rejected',
          checked_at: new Date().toISOString(),
          notes: reason || null
        })
        .eq('id', submission.id)

      if (error) throw error
      setSubmissions(prev => prev.filter(s => s.id !== submission.id))
    } catch (error) {
      console.error('Error rejecting badge:', error)
      alert('Failed to reject: ' + error.message)
    }
    setActionLoading(null)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <div className="header-content">
            <h1>Badge Review</h1>
            <p>{submissions.length} pending submission{submissions.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="dashboard-actions">
          <Link to="/admin/dashboard" className="btn btn-outline">
            <i className="fa fa-arrow-left" aria-hidden="true"></i> Admin Home
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading submissions...</p>
        </div>
      ) : submissions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <i className="fa fa-shield-alt"></i>
          </div>
          <h3>No pending badge submissions</h3>
          <p>All badge submissions have been reviewed.</p>
        </div>
      ) : (
        <div className="leads-table table-responsive">
          <div className="table-header" style={{ gridTemplateColumns: '1.5fr 2fr 2fr 1fr 1fr' }}>
            <span>Provider</span>
            <span>Profile URL</span>
            <span>Badge Page URL</span>
            <span>Submitted</span>
            <span>Actions</span>
          </div>
          {submissions.map(sub => (
            <div key={sub.id} className="table-row" style={{ gridTemplateColumns: '1.5fr 2fr 2fr 1fr 1fr' }}>
              <div className="table-cell">
                <strong>{sub.profiles?.full_name || 'Unknown'}</strong>
                <small>{sub.profiles?.city}, {sub.profiles?.state_province}</small>
              </div>
              <div className="table-cell">
                <a href={sub.profile_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.82rem', wordBreak: 'break-all' }}>
                  {sub.profile_url}
                </a>
              </div>
              <div className="table-cell">
                <a href={sub.source_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.82rem', wordBreak: 'break-all' }}>
                  {sub.source_url}
                </a>
              </div>
              <div className="table-cell">
                <small>{formatDate(sub.created_at)}</small>
              </div>
              <div className="table-cell" style={{ display: 'flex', flexDirection: 'row', gap: '0.4rem' }}>
                <button
                  onClick={() => handleApprove(sub)}
                  disabled={actionLoading === sub.id}
                  className="btn btn-sm btn-primary"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(sub)}
                  disabled={actionLoading === sub.id}
                  className="btn btn-sm btn-outline"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default BadgeReviewDashboard
