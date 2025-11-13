import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { profileOperations, supabase } from '../../lib/supabaseClient'
import { Link } from 'react-router-dom'
import { sendClaimApprovedEmail, sendClaimRejectedEmail } from '../../lib/emailNotifications'

const ClaimReviewDashboard = () => {
  const { signOut } = useAuth()
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedClaim, setSelectedClaim] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    loadClaims()
  }, [])

  const loadClaims = async () => {
    setLoading(true)
    try {
      const { data, error } = await profileOperations.getPendingClaims()
      if (error) throw error
      setClaims(data || [])
    } catch (error) {
      console.error('Error loading claims:', error)
      alert('Failed to load claims: ' + error.message)
    }
    setLoading(false)
  }

  const handleApproveClaim = async (claim) => {
    if (!window.confirm(`Approve claim from ${claim.submitted_by_email}?`)) return

    setActionLoading(true)
    try {
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser()

      // Approve the claim
      const { data: approvedClaim, error: approveError } = await profileOperations.approveProfileClaim(
        claim.id,
        user.id
      )

      if (approveError) throw approveError

      if (claim.profile_id) {
        // Existing profile - update it with claim data
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            ...claim.claim_data,
            is_claimed: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', claim.profile_id)

        if (updateError) throw updateError
      } else {
        // New profile - create it
        const { error: createError } = await profileOperations.createProfile({
          ...claim.claim_data,
          is_claimed: true,
          tier: 'community'
        })

        if (createError) throw createError
      }

      // Send approval email (non-blocking)
      try {
        const profileUrl = claim.profile_id
          ? `https://www.weddingcounselors.com/premarital-counseling/${claim.profile?.state_province?.toLowerCase().replace(/\s+/g, '-')}/${claim.profile?.city?.toLowerCase().replace(/\s+/g, '-')}/${claim.profile?.slug}`
          : 'https://www.weddingcounselors.com'
        await sendClaimApprovedEmail(claim.submitted_by_email, claim.claim_data, profileUrl)
      } catch (emailError) {
        console.error('Approval email failed:', emailError)
      }

      alert('Claim approved successfully!')
      loadClaims()
      setSelectedClaim(null)
    } catch (error) {
      console.error('Error approving claim:', error)
      alert('Failed to approve claim: ' + error.message)
    }
    setActionLoading(false)
  }

  const handleRejectClaim = async (claim) => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection')
      return
    }

    if (!window.confirm(`Reject claim from ${claim.submitted_by_email}?`)) return

    setActionLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await profileOperations.rejectProfileClaim(
        claim.id,
        user.id,
        rejectReason
      )

      if (error) throw error

      // Send rejection email (non-blocking)
      try {
        await sendClaimRejectedEmail(claim.submitted_by_email, claim.claim_data, rejectReason)
      } catch (emailError) {
        console.error('Rejection email failed:', emailError)
      }

      alert('Claim rejected')
      loadClaims()
      setSelectedClaim(null)
      setRejectReason('')
    } catch (error) {
      console.error('Error rejecting claim:', error)
      alert('Failed to reject claim: ' + error.message)
    }
    setActionLoading(false)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="container" style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
        <div className="loading-spinner"></div>
        <p>Loading claims...</p>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1>Profile Claims Review</h1>
            <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
              <Link to="/admin/dashboard" className="btn btn-outline">
                Admin Dashboard
              </Link>
              <button onClick={signOut} className="btn btn-outline">
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: 'var(--space-8) 0' }}>
        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-8)'
        }}>
          <div className="stat-card">
            <h3>{claims.length}</h3>
            <p>Pending Claims</p>
          </div>
          <div className="stat-card">
            <h3>{claims.filter(c => c.profile_id).length}</h3>
            <p>Existing Profile Claims</p>
          </div>
          <div className="stat-card">
            <h3>{claims.filter(c => !c.profile_id).length}</h3>
            <p>New Profile Submissions</p>
          </div>
        </div>

        {claims.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: 'var(--space-12)',
            background: 'var(--gray-50)',
            borderRadius: 'var(--radius-lg)'
          }}>
            <i className="fa fa-check-circle" style={{ fontSize: '3rem', color: 'var(--success)', marginBottom: 'var(--space-4)' }}></i>
            <h2>All caught up!</h2>
            <p>No pending claims to review.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: selectedClaim ? '1fr 1fr' : '1fr', gap: 'var(--space-6)' }}>
            {/* Claims List */}
            <div>
              <h2 style={{ marginBottom: 'var(--space-4)' }}>Pending Claims ({claims.length})</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {claims.map(claim => (
                  <div
                    key={claim.id}
                    onClick={() => setSelectedClaim(claim)}
                    style={{
                      padding: 'var(--space-4)',
                      background: selectedClaim?.id === claim.id ? 'var(--primary-light)' : 'white',
                      border: '1px solid var(--gray-200)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                      <strong>{claim.claim_data?.full_name || 'Unknown'}</strong>
                      <span style={{
                        padding: '2px 8px',
                        background: claim.profile_id ? '#e3f2fd' : '#f3e5f5',
                        color: claim.profile_id ? '#1976d2' : '#7b1fa2',
                        borderRadius: '4px',
                        fontSize: '0.75rem'
                      }}>
                        {claim.profile_id ? 'CLAIM' : 'NEW'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      <div>{claim.submitted_by_email}</div>
                      <div>{claim.claim_data?.city}, {claim.claim_data?.state_province}</div>
                      <div style={{ marginTop: 'var(--space-2)', fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                        Submitted {formatDate(claim.submitted_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Claim Detail */}
            {selectedClaim && (
              <div style={{
                position: 'sticky',
                top: '20px',
                height: 'fit-content'
              }}>
                <div style={{
                  background: 'white',
                  border: '1px solid var(--gray-200)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-6)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--space-6)' }}>
                    <h2>Review Claim</h2>
                    <button
                      onClick={() => setSelectedClaim(null)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}
                    >
                      ×
                    </button>
                  </div>

                  {/* Type Badge */}
                  <div style={{ marginBottom: 'var(--space-6)' }}>
                    <span style={{
                      padding: '4px 12px',
                      background: selectedClaim.profile_id ? '#e3f2fd' : '#f3e5f5',
                      color: selectedClaim.profile_id ? '#1976d2' : '#7b1fa2',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}>
                      {selectedClaim.profile_id ? 'Claiming Existing Profile' : 'New Profile Submission'}
                    </span>
                  </div>

                  {/* Claim Data */}
                  <div style={{ marginBottom: 'var(--space-6)' }}>
                    <h3 style={{ marginBottom: 'var(--space-3)' }}>Submitted Information</h3>
                    <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
                      <div>
                        <strong>Name:</strong> {selectedClaim.claim_data?.full_name}
                      </div>
                      <div>
                        <strong>Email:</strong> {selectedClaim.submitted_by_email}
                      </div>
                      <div>
                        <strong>Phone:</strong> {selectedClaim.claim_data?.phone || 'N/A'}
                      </div>
                      <div>
                        <strong>Profession:</strong> {selectedClaim.claim_data?.profession}
                      </div>
                      <div>
                        <strong>Location:</strong> {selectedClaim.claim_data?.city}, {selectedClaim.claim_data?.state_province}
                      </div>
                      {selectedClaim.claim_data?.specialties?.length > 0 && (
                        <div>
                          <strong>Specialties:</strong>
                          <div style={{ marginTop: 'var(--space-2)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                            {selectedClaim.claim_data.specialties.map(s => (
                              <span key={s} style={{
                                padding: '2px 8px',
                                background: 'var(--gray-100)',
                                borderRadius: '4px',
                                fontSize: '0.8125rem'
                              }}>
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedClaim.claim_data?.bio && (
                        <div>
                          <strong>Bio:</strong>
                          <p style={{ marginTop: 'var(--space-2)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            {selectedClaim.claim_data.bio}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Existing Profile Comparison */}
                  {selectedClaim.profile && (
                    <div style={{
                      padding: 'var(--space-4)',
                      background: 'var(--gray-50)',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: 'var(--space-6)'
                    }}>
                      <h4 style={{ marginBottom: 'var(--space-3)' }}>Existing Profile</h4>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        <div><strong>Name:</strong> {selectedClaim.profile.full_name}</div>
                        <div><strong>Email:</strong> {selectedClaim.profile.email || 'N/A'}</div>
                        <div><strong>Phone:</strong> {selectedClaim.profile.phone || 'N/A'}</div>
                        <div><strong>Already Claimed:</strong> {selectedClaim.profile.is_claimed ? 'Yes' : 'No'}</div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <button
                      onClick={() => handleApproveClaim(selectedClaim)}
                      disabled={actionLoading}
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                    >
                      {actionLoading ? 'Processing...' : 'Approve Claim'}
                    </button>

                    <div>
                      <textarea
                        placeholder="Reason for rejection (required)"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        style={{
                          width: '100%',
                          padding: 'var(--space-3)',
                          border: '1px solid var(--gray-300)',
                          borderRadius: 'var(--radius-md)',
                          marginBottom: 'var(--space-2)',
                          minHeight: '80px'
                        }}
                      />
                      <button
                        onClick={() => handleRejectClaim(selectedClaim)}
                        disabled={actionLoading || !rejectReason.trim()}
                        className="btn btn-outline"
                        style={{ width: '100%', borderColor: '#c33', color: '#c33' }}
                      >
                        {actionLoading ? 'Processing...' : 'Reject Claim'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ClaimReviewDashboard
