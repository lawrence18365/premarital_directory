import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { Link, Navigate } from 'react-router-dom'

const ProfessionalDashboard = () => {
  const { user, profile, loading: authLoading, signOut } = useAuth()
  const [leads, setLeads] = useState([])
  const [stats, setStats] = useState({
    totalLeads: 0,
    thisMonthLeads: 0,
    pendingLeads: 0,
    responseRate: 0
  })
  const [loading, setLoading] = useState(true)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [removeLoading, setRemoveLoading] = useState(false)
  const [removeSuccess, setRemoveSuccess] = useState(false)

  useEffect(() => {
    if (profile) {
      loadDashboardData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  const loadDashboardData = async () => {
    if (!profile) return

    setLoading(true)

    try {
      // Load recent leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('profile_leads')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (leadsError) throw leadsError

      setLeads(leadsData || [])

      // Calculate stats
      const totalLeads = leadsData?.length || 0
      const thisMonth = new Date()
      thisMonth.setDate(1)
      thisMonth.setHours(0, 0, 0, 0)

      const thisMonthLeads = leadsData?.filter(
        lead => new Date(lead.created_at) >= thisMonth
      ).length || 0

      const pendingLeads = leadsData?.filter(
        lead => lead.status === 'new'
      ).length || 0

      const contactedLeads = leadsData?.filter(
        lead => lead.status === 'contacted'
      ).length || 0

      const responseRate = totalLeads > 0 ? Math.round((contactedLeads / totalLeads) * 100) : 0

      setStats({
        totalLeads,
        thisMonthLeads,
        pendingLeads,
        responseRate
      })

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    }

    setLoading(false)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const handleRemoveProfile = async () => {
    if (!profile) return

    setRemoveLoading(true)
    try {
      // Soft delete - hide the profile but preserve data
      const { error } = await supabase
        .from('profiles')
        .update({
          is_hidden: true,
          hidden_reason: 'provider_self_remove',
          hidden_at: new Date().toISOString()
        })
        .eq('id', profile.id)

      if (error) throw error

      // Optionally add to do_not_contact to prevent future outreach
      await supabase.from('do_not_contact').upsert({
        email: profile.email,
        reason: 'provider_self_remove',
        notes: `Provider ${profile.full_name} removed their own listing on ${new Date().toISOString()}`
      }, {
        onConflict: 'email'
      })

      // Log the event
      await supabase.from('provider_events').insert({
        provider_email: profile.email,
        profile_id: profile.id,
        event_type: 'removed',
        event_data: {
          removed_by: 'self',
          removed_at: new Date().toISOString(),
          reason: 'provider_self_remove'
        }
      })

      setRemoveSuccess(true)
    } catch (error) {
      console.error('Error removing profile:', error)
      alert('Failed to remove profile. Please contact hello@weddingcounselors.com')
    }

    setRemoveLoading(false)
    setShowRemoveConfirm(false)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status) => {
    const badges = {
      new: 'badge-new',
      contacted: 'badge-success',
      scheduled: 'badge-warning',
      converted: 'badge-primary'
    }
    return badges[status] || 'badge-default'
  }

  const getStatusText = (status) => {
    const texts = {
      new: 'New',
      contacted: 'Contacted',
      scheduled: 'Scheduled',
      converted: 'Converted'
    }
    return texts[status] || status
  }

  // Wait for auth to load
  if (authLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  // Redirect users without profiles to create profile
  if (user && !profile) {
    return <Navigate to="/professional/create" replace />
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Professional Dashboard</h1>
          <p>Welcome back, {profile?.full_name || user?.email}</p>
        </div>
        <div className="dashboard-actions">
          <Link to="/professional/analytics" className="btn btn-primary">
            <i className="fa fa-chart-bar" aria-hidden="true"></i>
            View Analytics
          </Link>
          <Link to="/professional/profile/edit" className="btn btn-outline">
            <i className="fa fa-edit" aria-hidden="true"></i>
            Edit Profile
          </Link>
          <button onClick={handleSignOut} className="btn btn-ghost">
            <i className="fa fa-sign-out" aria-hidden="true"></i>
            Sign Out
          </button>
        </div>
      </div>

      {/* Profile Status Alert */}
      {profile && !profile.is_claimed && (
        <div className="alert alert-warning">
          <i className="fa fa-exclamation-triangle" aria-hidden="true"></i>
          <div>
            <strong>Complete Your Profile Setup</strong>
            <p>Your profile is not fully set up. Complete your profile to start receiving leads.</p>
            <Link to="/professional/profile/edit" className="btn btn-sm btn-primary">
              Complete Setup
            </Link>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon stat-icon-primary">
            <i className="fa fa-users" aria-hidden="true"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.totalLeads}</h3>
            <p>Total Leads</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-success">
            <i className="fa fa-calendar" aria-hidden="true"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.thisMonthLeads}</h3>
            <p>This Month</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-warning">
            <i className="fa fa-bell" aria-hidden="true"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.pendingLeads}</h3>
            <p>Pending</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-info">
            <i className="fa fa-chart-line" aria-hidden="true"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.responseRate}%</h3>
            <p>Response Rate</p>
          </div>
        </div>
      </div>

      {/* Recent Leads */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Recent Leads</h2>
          <Link to="/professional/leads" className="btn btn-outline btn-sm">
            View All Leads
          </Link>
        </div>

        {leads.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <i className="fa fa-heart" aria-hidden="true"></i>
            </div>
            <h3>No leads yet</h3>
            <p>Once couples start contacting you through the directory, you'll see their information here.</p>
            <Link to={(profile?.state_province && profile?.city ? `/premarital-counseling/${String(profile.state_province).toLowerCase().replace(/\s+/g, '-')}/${String(profile.city).toLowerCase().replace(/\s+/g, '-')}/${profile?.slug || profile?.id}` : `/profile/${profile?.slug || profile?.id}`)} className="btn btn-primary">
              View Your Public Profile
            </Link>
          </div>
        ) : (
          <div className="leads-table">
            <div className="table-header">
              <div className="table-cell">Couple</div>
              <div className="table-cell">Contact</div>
              <div className="table-cell">Date</div>
              <div className="table-cell">Status</div>
              <div className="table-cell">Action</div>
            </div>

            {leads.map(lead => (
              <div key={lead.id} className="table-row">
                <div className="table-cell">
                  <div className="lead-info">
                    <strong>{lead.couple_name}</strong>
                    {lead.wedding_date && (
                      <small>Wedding: {new Date(lead.wedding_date).toLocaleDateString()}</small>
                    )}
                  </div>
                </div>

                <div className="table-cell">
                  <div className="contact-info">
                    <div>{lead.couple_email}</div>
                    {lead.couple_phone && <small>{lead.couple_phone}</small>}
                  </div>
                </div>

                <div className="table-cell">
                  <small>{formatDate(lead.created_at)}</small>
                </div>

                <div className="table-cell">
                  <span className={`badge ${getStatusBadge(lead.status)}`}>
                    {getStatusText(lead.status)}
                  </span>
                </div>

                <div className="table-cell">
                  <Link
                    to={`/professional/leads/${lead.id}`}
                    className="btn btn-sm btn-outline"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="dashboard-section">
        <h2>Quick Actions</h2>
        <div className="quick-actions">
          <Link to="/professional/analytics" className="action-card">
            <i className="fa fa-chart-line" aria-hidden="true"></i>
            <h4>View Analytics</h4>
            <p>See profile views, contact reveals, and inquiry stats</p>
          </Link>

          <Link to="/professional/profile/edit" className="action-card">
            <i className="fa fa-user-edit" aria-hidden="true"></i>
            <h4>Update Profile</h4>
            <p>Edit your bio, specialties, and contact information</p>
          </Link>

          <Link to="/professional/leads" className="action-card">
            <i className="fa fa-envelope" aria-hidden="true"></i>
            <h4>View All Leads</h4>
            <p>See all couples who have contacted you</p>
          </Link>

          <Link to={`/profile/${profile?.slug || profile?.id}`} className="action-card">
            <i className="fa fa-eye" aria-hidden="true"></i>
            <h4>View Public Profile</h4>
            <p>See how couples see your profile</p>
          </Link>
        </div>
      </div>

      {/* Remove Profile Section */}
      <div className="dashboard-section" style={{ marginTop: 'var(--space-12)' }}>
        <h2 style={{ color: 'var(--text-secondary)' }}>Account Settings</h2>

        {removeSuccess ? (
          <div style={{
            background: '#d1fae5',
            padding: 'var(--space-6)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #6ee7b7'
          }}>
            <h3 style={{ color: '#065f46', marginBottom: 'var(--space-2)' }}>
              Profile Removed
            </h3>
            <p style={{ color: '#064e3b', margin: 0 }}>
              Your profile has been removed from WeddingCounselors. You will no longer appear in search results or receive inquiries.
              If you change your mind, contact us at hello@weddingcounselors.com to restore your listing.
            </p>
          </div>
        ) : (
          <div style={{
            background: 'var(--bg-secondary)',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--gray-200)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: '0 0 var(--space-2) 0' }}>Remove My Listing</h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Hide your profile from WeddingCounselors. You can contact us later to restore it.
                </p>
              </div>
              <button
                onClick={() => setShowRemoveConfirm(true)}
                style={{
                  padding: 'var(--space-2) var(--space-4)',
                  background: 'white',
                  color: '#dc2626',
                  border: '1px solid #fca5a5',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}
              >
                Remove Profile
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Remove Confirmation Modal */}
      {showRemoveConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: 'var(--space-8)',
            borderRadius: 'var(--radius-lg)',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3 style={{ marginBottom: 'var(--space-4)', color: '#dc2626' }}>
              Remove Your Profile?
            </h3>
            <p style={{ marginBottom: 'var(--space-4)' }}>
              This will:
            </p>
            <ul style={{ marginBottom: 'var(--space-6)', paddingLeft: 'var(--space-4)' }}>
              <li>Hide your profile from all search results</li>
              <li>Stop sending you couple inquiries</li>
              <li>Remove you from city pages</li>
              <li>Prevent future outreach emails from us</li>
            </ul>
            <p style={{ marginBottom: 'var(--space-6)', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              You can contact hello@weddingcounselors.com to restore your listing later if you change your mind.
            </p>

            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button
                onClick={() => setShowRemoveConfirm(false)}
                disabled={removeLoading}
                style={{
                  flex: 1,
                  padding: 'var(--space-3)',
                  background: 'var(--gray-100)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveProfile}
                disabled={removeLoading}
                style={{
                  flex: 1,
                  padding: 'var(--space-3)',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: removeLoading ? 'not-allowed' : 'pointer',
                  fontWeight: '500'
                }}
              >
                {removeLoading ? 'Removing...' : 'Yes, Remove My Profile'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfessionalDashboard
