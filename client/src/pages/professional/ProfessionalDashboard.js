import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { Link, Navigate } from 'react-router-dom'
import ProfileCompletenessWidget from '../../components/profiles/ProfileCompletenessWidget'

const ProfessionalDashboard = () => {
  const { user, profile, loading: authLoading, signOut } = useAuth()
  const [leads, setLeads] = useState([])
  const [stats, setStats] = useState({
    totalLeads: 0,
    thisMonthLeads: 0,
    pendingLeads: 0,
    responseRate: 0
  })
  const [viewStats, setViewStats] = useState({
    total: 0,
    last7d: 0,
    last30d: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [removeLoading, setRemoveLoading] = useState(false)
  const [removeSuccess, setRemoveSuccess] = useState(false)
  const [showAccountSettings, setShowAccountSettings] = useState(false)

  useEffect(() => {
    if (profile) {
      loadDashboardData()
    } else if (!authLoading && user && !profile) {
      setLoading(false)
      setError('No profile found. Please create your profile first.')
    } else if (!authLoading && !user) {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, authLoading, user])

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

      // Calculate lead stats
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

      // Load profile view stats
      const { data: clicksData } = await supabase
        .from('profile_clicks')
        .select('created_at')
        .eq('profile_id', profile.id)

      const now = new Date()
      const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000)
      const last30d = new Date(now - 30 * 24 * 60 * 60 * 1000)

      setViewStats({
        total: clicksData?.length || 0,
        last7d: clicksData?.filter(c => new Date(c.created_at) >= last7d).length || 0,
        last30d: clicksData?.filter(c => new Date(c.created_at) >= last30d).length || 0
      })

    } catch (err) {
      console.error('Error loading dashboard data:', err)
      setError('Failed to load dashboard data. Please try refreshing.')
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
      const { error } = await supabase
        .from('profiles')
        .update({
          is_hidden: true,
          hidden_reason: 'provider_self_remove',
          hidden_at: new Date().toISOString()
        })
        .eq('id', profile.id)

      if (error) throw error

      await supabase.from('do_not_contact').upsert({
        email: profile.email,
        reason: 'provider_self_remove',
        notes: `Provider ${profile.full_name} removed their own listing on ${new Date().toISOString()}`
      }, {
        onConflict: 'email'
      })

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

  // Compute profile age in days
  const getProfileAgeDays = () => {
    if (!profile?.created_at) return 0
    return Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
  }

  // Generate public profile URL
  const getPublicProfileUrl = () => {
    if (!profile) return '#'
    const stateSlug = String(profile.state_province || '').toLowerCase().replace(/\s+/g, '-')
    const citySlug = String(profile.city || '').toLowerCase().replace(/\s+/g, '-')
    return `/premarital-counseling/${stateSlug}/${citySlug}/${profile.slug || profile.id}`
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

  // Show error state
  if (error) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="dashboard-title">
            <h1>Dashboard</h1>
          </div>
        </div>
        <div className="alert alert-error" style={{
          background: '#fee',
          border: '1px solid #fcc',
          padding: 'var(--space-6)',
          borderRadius: 'var(--radius-lg)',
          marginTop: 'var(--space-6)'
        }}>
          <h3 style={{ color: '#c00', marginBottom: 'var(--space-2)' }}>
            <i className="fa fa-exclamation-circle" aria-hidden="true"></i> {error}
          </h3>
          <p>Try one of these options:</p>
          <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
            <Link to="/professional/create" className="btn btn-primary">
              Create Profile
            </Link>
            <button onClick={() => window.location.reload()} className="btn btn-outline">
              Refresh Page
            </button>
            <button onClick={signOut} className="btn btn-ghost">
              Sign Out
            </button>
          </div>
        </div>
      </div>
    )
  }

  const profileAge = getProfileAgeDays()
  const isNewProfile = profileAge < 14
  const isProfileLive = profile?.moderation_status === 'approved'

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

      {/* Moderation Status Alert - Pending */}
      {profile && profile.moderation_status === 'pending' && (
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          border: '1px solid #f59e0b',
          borderRadius: '12px',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1rem'
        }}>
          <div style={{
            background: '#f59e0b',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <i className="fa fa-clock-o" style={{ color: 'white', fontSize: '1.25rem' }} aria-hidden="true"></i>
          </div>
          <div>
            <strong style={{ color: '#92400e', fontSize: '1.1rem', display: 'block', marginBottom: '0.25rem' }}>
              Profile Under Review
            </strong>
            <p style={{ color: '#78350f', margin: '0 0 0.5rem', fontSize: '0.95rem' }}>
              Your profile is being reviewed by our team. This typically takes 24-48 hours.
              Once approved, you'll appear in directory listings and can start receiving inquiries from couples.
            </p>
            <p style={{ color: '#92400e', margin: 0, fontSize: '0.85rem' }}>
              <i className="fa fa-envelope-o" aria-hidden="true" style={{ marginRight: '0.5rem' }}></i>
              We'll email you at <strong>{profile.email}</strong> when your profile is approved.
            </p>
          </div>
        </div>
      )}

      {/* Moderation Status Alert - Rejected */}
      {profile && profile.moderation_status === 'rejected' && (
        <div style={{
          background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
          border: '1px solid #ef4444',
          borderRadius: '12px',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1rem'
        }}>
          <div style={{
            background: '#ef4444',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <i className="fa fa-exclamation" style={{ color: 'white', fontSize: '1.25rem' }} aria-hidden="true"></i>
          </div>
          <div>
            <strong style={{ color: '#991b1b', fontSize: '1.1rem', display: 'block', marginBottom: '0.25rem' }}>
              Profile Not Approved
            </strong>
            <p style={{ color: '#7f1d1d', margin: '0 0 0.5rem', fontSize: '0.95rem' }}>
              Unfortunately, your profile was not approved for our directory.
              {profile.moderation_notes && (
                <span style={{ display: 'block', marginTop: '0.5rem' }}>
                  <strong>Reason:</strong> {profile.moderation_notes}
                </span>
              )}
            </p>
            <p style={{ color: '#991b1b', margin: 0, fontSize: '0.85rem' }}>
              If you believe this was a mistake, please contact us at{' '}
              <a href="mailto:support@weddingcounselors.com" style={{ color: '#991b1b' }}>support@weddingcounselors.com</a>
            </p>
          </div>
        </div>
      )}

      {/* Welcome Banner for New Profiles */}
      {isNewProfile && isProfileLive && (
        <div style={{
          background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          color: 'white'
        }}>
          <h3 style={{ color: 'white', margin: '0 0 0.5rem 0', fontSize: '1.15rem' }}>
            Your profile is live!
          </h3>
          <p style={{ margin: '0 0 1rem 0', opacity: 0.9, fontSize: '0.95rem' }}>
            Couples searching for premarital counseling in {profile.city} can now find you.
            The more complete your profile, the higher you'll appear in search results.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <a
              href={getPublicProfileUrl()}
              style={{
                display: 'inline-block',
                padding: '0.5rem 1rem',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: '500',
                border: '1px solid rgba(255,255,255,0.3)'
              }}
            >
              View your public profile
            </a>
            <Link
              to="/professional/profile/edit"
              style={{
                display: 'inline-block',
                padding: '0.5rem 1rem',
                background: 'white',
                color: '#0d9488',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: '600'
              }}
            >
              Complete your profile
            </Link>
          </div>
        </div>
      )}

      {/* Profile Completeness Widget */}
      <ProfileCompletenessWidget profile={profile} />

      {/* Stats Overview — Views first, then leads */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ede9fe', color: '#7c3aed' }}>
            <i className="fa fa-eye" aria-hidden="true"></i>
          </div>
          <div className="stat-content">
            <h3>{viewStats.total}</h3>
            <p>Profile Views</p>
            {viewStats.last7d > 0 && (
              <small style={{ color: '#7c3aed', fontWeight: '500' }}>
                {viewStats.last7d} this week
              </small>
            )}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-primary">
            <i className="fa fa-users" aria-hidden="true"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.totalLeads}</h3>
            <p>Couple Inquiries</p>
            {stats.thisMonthLeads > 0 && (
              <small style={{ color: 'var(--color-primary)', fontWeight: '500' }}>
                {stats.thisMonthLeads} this month
              </small>
            )}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-warning">
            <i className="fa fa-bell" aria-hidden="true"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.pendingLeads}</h3>
            <p>Awaiting Reply</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>
            <i className="fa fa-calendar" aria-hidden="true"></i>
          </div>
          <div className="stat-content">
            <h3>{profileAge}</h3>
            <p>Days Listed</p>
          </div>
        </div>
      </div>

      {/* Visibility Section — shown when no leads yet */}
      {stats.totalLeads === 0 && isProfileLive && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          border: '1px solid var(--gray-200)',
          padding: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{
              background: '#f0fdf4',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <i className="fa fa-check-circle" style={{ color: '#16a34a', fontSize: '1.25rem' }} aria-hidden="true"></i>
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem' }}>
                Your profile is active and visible
              </h3>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {viewStats.total > 0
                  ? `Your profile has been viewed ${viewStats.total} time${viewStats.total !== 1 ? 's' : ''}. As our directory grows, you'll start receiving inquiries from engaged couples in ${profile.city}.`
                  : `Your profile is now appearing in search results for premarital counseling in ${profile.city}. Views and inquiries will show up here as couples discover you.`
                }
              </p>

              {/* How it works - for new profiles with no leads */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.75rem'
              }}>
                <div style={{
                  padding: '0.75rem',
                  background: 'var(--gray-50)',
                  borderRadius: '8px',
                  fontSize: '0.85rem'
                }}>
                  <strong style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
                    1. Couples search
                  </strong>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Engaged couples find your city page on Google
                  </span>
                </div>
                <div style={{
                  padding: '0.75rem',
                  background: 'var(--gray-50)',
                  borderRadius: '8px',
                  fontSize: '0.85rem'
                }}>
                  <strong style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
                    2. They view profiles
                  </strong>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Couples browse and compare counselors in your area
                  </span>
                </div>
                <div style={{
                  padding: '0.75rem',
                  background: 'var(--gray-50)',
                  borderRadius: '8px',
                  fontSize: '0.85rem'
                }}>
                  <strong style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
                    3. You get contacted
                  </strong>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Inquiries land here and you're notified by email
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Leads */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Recent Inquiries</h2>
          {leads.length > 0 && (
            <Link to="/professional/leads" className="btn btn-outline btn-sm">
              View All
            </Link>
          )}
        </div>

        {leads.length === 0 ? (
          <div style={{
            background: 'var(--gray-50)',
            borderRadius: '12px',
            padding: '2rem',
            textAlign: 'center'
          }}>
            {profile?.moderation_status === 'pending' ? (
              <>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Your profile is under review. Once approved, couples will be able to find you and send inquiries.
                </p>
              </>
            ) : (
              <>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', margin: '0 0 1rem 0' }}>
                  No inquiries yet. When engaged couples reach out through the directory, you'll see their details here and get an email notification.
                </p>
                <Link to={getPublicProfileUrl()} className="btn btn-outline" style={{ fontSize: '0.9rem' }}>
                  Preview Your Public Profile
                </Link>
              </>
            )}
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
          <Link to="/professional/profile/edit" className="action-card">
            <i className="fa fa-user-edit" aria-hidden="true"></i>
            <h4>Update Profile</h4>
            <p>Edit your bio, specialties, and contact information</p>
          </Link>

          <Link to="/professional/analytics" className="action-card">
            <i className="fa fa-chart-line" aria-hidden="true"></i>
            <h4>View Analytics</h4>
            <p>See profile views, traffic sources, and inquiry stats</p>
          </Link>

          <Link to="/professional/leads" className="action-card">
            <i className="fa fa-envelope" aria-hidden="true"></i>
            <h4>Manage Leads</h4>
            <p>View and respond to couple inquiries</p>
          </Link>

          <a href={getPublicProfileUrl()} className="action-card">
            <i className="fa fa-eye" aria-hidden="true"></i>
            <h4>Public Profile</h4>
            <p>
              {profile?.moderation_status === 'pending'
                ? 'Preview your profile (not yet visible to couples)'
                : 'See how couples see your listing'}
            </p>
          </a>
        </div>
      </div>

      {/* Account Settings - Collapsible, de-emphasized */}
      <div className="dashboard-section" style={{ marginTop: 'var(--space-12)' }}>
        <button
          onClick={() => setShowAccountSettings(!showAccountSettings)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
            padding: 0
          }}
        >
          <i className={`fa fa-chevron-${showAccountSettings ? 'down' : 'right'}`} style={{ fontSize: '0.75rem' }} aria-hidden="true"></i>
          Account Settings
        </button>

        {showAccountSettings && (
          <div style={{ marginTop: 'var(--space-4)' }}>
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
