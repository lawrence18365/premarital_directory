import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { profileOperations } from '../../lib/supabaseClient'
import { sendProfileApprovedEmail, sendProfileRejectedEmail } from '../../lib/emailNotifications'
import { Link } from 'react-router-dom'

const ProfileModerationDashboard = () => {
  const { signOut } = useAuth()
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    loadPendingProfiles()
  }, [])

  const loadPendingProfiles = async () => {
    setLoading(true)
    try {
      const { data, error } = await profileOperations.getPendingProfiles()
      if (error) throw error
      setProfiles(data || [])
    } catch (error) {
      console.error('Error loading pending profiles:', error)
      alert('Failed to load pending profiles: ' + error.message)
    }
    setLoading(false)
  }

  const handleApprove = async (profile) => {
    if (!window.confirm(`Approve profile for ${profile.full_name}?`)) return

    setActionLoading(true)
    try {
      const { error } = await profileOperations.approveProfile(profile.id)
      if (error) throw error

      // Send approval email notification
      try {
        await sendProfileApprovedEmail(profile.email, profile)
        console.log('Approval email sent to:', profile.email)
      } catch (emailError) {
        console.error('Failed to send approval email:', emailError)
        // Don't block the approval if email fails
      }

      alert('Profile approved! It will now appear in the directory.')
      loadPendingProfiles()
      setSelectedProfile(null)
    } catch (error) {
      console.error('Error approving profile:', error)
      alert('Failed to approve profile: ' + error.message)
    }
    setActionLoading(false)
  }

  const handleReject = async (profile) => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection')
      return
    }

    if (!window.confirm(`Reject profile for ${profile.full_name}?`)) return

    setActionLoading(true)
    try {
      const { error } = await profileOperations.rejectProfile(profile.id, rejectReason)
      if (error) throw error

      // Send rejection email notification
      try {
        await sendProfileRejectedEmail(profile.email, profile, rejectReason)
        console.log('Rejection email sent to:', profile.email)
      } catch (emailError) {
        console.error('Failed to send rejection email:', emailError)
        // Don't block the rejection if email fails
      }

      alert('Profile rejected.')
      loadPendingProfiles()
      setSelectedProfile(null)
      setRejectReason('')
    } catch (error) {
      console.error('Error rejecting profile:', error)
      alert('Failed to reject profile: ' + error.message)
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
        <p>Loading pending profiles...</p>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1>Profile Moderation Queue</h1>
            <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
              <Link to="/admin/dashboard" className="btn btn-outline">
                Admin Dashboard
              </Link>
              <Link to="/admin/claims" className="btn btn-outline">
                Review Claims
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
          <div className="stat-card" style={{ background: '#fff3cd', borderColor: '#ffc107' }}>
            <h3>{profiles.length}</h3>
            <p>Pending Review</p>
          </div>
        </div>

        {profiles.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: 'var(--space-12)',
            background: 'var(--gray-50)',
            borderRadius: 'var(--radius-lg)'
          }}>
            <i className="fa fa-check-circle" style={{ fontSize: '3rem', color: 'var(--success)', marginBottom: 'var(--space-4)' }}></i>
            <h2>All caught up!</h2>
            <p>No profiles pending moderation.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: selectedProfile ? '1fr 1fr' : '1fr', gap: 'var(--space-6)' }}>
            {/* Profiles List */}
            <div>
              <h2 style={{ marginBottom: 'var(--space-4)' }}>Pending Profiles ({profiles.length})</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {profiles.map(profile => (
                  <div
                    key={profile.id}
                    onClick={() => setSelectedProfile(profile)}
                    style={{
                      padding: 'var(--space-4)',
                      background: selectedProfile?.id === profile.id ? 'var(--primary-light)' : 'white',
                      border: '1px solid var(--gray-200)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                      <strong>{profile.full_name}</strong>
                      <span style={{
                        padding: '2px 8px',
                        background: '#fff3cd',
                        color: '#856404',
                        borderRadius: '4px',
                        fontSize: '0.75rem'
                      }}>
                        NEW SIGNUP
                      </span>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      <div>{profile.email}</div>
                      <div>{profile.profession}</div>
                      <div>{profile.city}, {profile.state_province}</div>
                      <div style={{ marginTop: 'var(--space-2)', fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                        Submitted {formatDate(profile.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Profile Detail */}
            {selectedProfile && (
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
                    <h2>Review Profile</h2>
                    <button
                      onClick={() => setSelectedProfile(null)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}
                    >
                      x
                    </button>
                  </div>

                  {/* Profile Data */}
                  <div style={{ marginBottom: 'var(--space-6)' }}>
                    <h3 style={{ marginBottom: 'var(--space-3)' }}>Profile Information</h3>
                    <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
                      <div>
                        <strong>Name:</strong> {selectedProfile.full_name}
                      </div>
                      <div>
                        <strong>Email:</strong> {selectedProfile.email}
                      </div>
                      <div>
                        <strong>Phone:</strong> {selectedProfile.phone || 'N/A'}
                      </div>
                      <div>
                        <strong>Profession:</strong> {selectedProfile.profession}
                      </div>
                      <div>
                        <strong>Location:</strong> {selectedProfile.city}, {selectedProfile.state_province}
                      </div>
                      <div>
                        <strong>Session Types:</strong> {selectedProfile.session_types?.join(', ') || 'N/A'}
                      </div>
                      {selectedProfile.website && (
                        <div>
                          <strong>Website:</strong>{' '}
                          <a href={selectedProfile.website} target="_blank" rel="noopener noreferrer">
                            {selectedProfile.website}
                          </a>
                        </div>
                      )}
                      {selectedProfile.specialties?.length > 0 && (
                        <div>
                          <strong>Specialties:</strong>
                          <div style={{ marginTop: 'var(--space-2)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                            {selectedProfile.specialties.map(s => (
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
                      {selectedProfile.certifications?.length > 0 && (
                        <div>
                          <strong>Certifications:</strong>
                          <div style={{ marginTop: 'var(--space-2)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                            {selectedProfile.certifications.map(c => (
                              <span key={c} style={{
                                padding: '2px 8px',
                                background: '#e3f2fd',
                                borderRadius: '4px',
                                fontSize: '0.8125rem'
                              }}>
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedProfile.bio && (
                        <div>
                          <strong>Bio:</strong>
                          <p style={{ marginTop: 'var(--space-2)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            {selectedProfile.bio}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <button
                      onClick={() => handleApprove(selectedProfile)}
                      disabled={actionLoading}
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                    >
                      {actionLoading ? 'Processing...' : 'Approve Profile'}
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
                        onClick={() => handleReject(selectedProfile)}
                        disabled={actionLoading || !rejectReason.trim()}
                        className="btn btn-outline"
                        style={{ width: '100%', borderColor: '#c33', color: '#c33' }}
                      >
                        {actionLoading ? 'Processing...' : 'Reject Profile'}
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

export default ProfileModerationDashboard
