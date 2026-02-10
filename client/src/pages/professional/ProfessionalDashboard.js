import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { getStateNameFromAbbr } from '../../lib/utils'
import { Link, Navigate } from 'react-router-dom'

const RESPONSE_WINDOW_DAYS = 30
const RESPONDED_STATUSES = new Set(['contacted', 'scheduled', 'converted', 'booked_elsewhere'])
const EXCLUDED_RESPONSE_STATUSES = new Set(['spam', 'duplicate'])
const OPEN_LEAD_STATUSES = new Set(['new', 'pending_claim'])

const ProfessionalDashboard = () => {
  const { user, profile, loading: authLoading, signOut } = useAuth()
  const [leads, setLeads] = useState([])
  const [stats, setStats] = useState({
    totalLeads: 0,
    thisMonthLeads: 0,
    pendingLeads: 0,
    responseRate: 0,
    responseEligibleLeads: 0,
    respondedLeads: 0
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
      const { data: recentLeadsData, error: recentLeadsError } = await supabase
        .from('profile_leads')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (recentLeadsError) throw recentLeadsError

      setLeads(recentLeadsData || [])

      const { data: allLeadsData, error: allLeadsError } = await supabase
        .from('profile_leads')
        .select('id, status, created_at')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false })

      if (allLeadsError) throw allLeadsError

      // Calculate lead stats
      const allLeads = allLeadsData || []
      const totalLeads = allLeads.length
      const thisMonth = new Date()
      thisMonth.setDate(1)
      thisMonth.setHours(0, 0, 0, 0)

      const thisMonthLeads = allLeads.filter(
        lead => new Date(lead.created_at) >= thisMonth
      ).length

      const pendingLeads = allLeads.filter((lead) => OPEN_LEAD_STATUSES.has(lead.status)).length

      const now = new Date()
      const responseWindowStart = new Date(now.getTime() - RESPONSE_WINDOW_DAYS * 24 * 60 * 60 * 1000)
      const responseWindowLeads = allLeads.filter((lead) => {
        const createdAt = new Date(lead.created_at)
        return createdAt >= responseWindowStart && !EXCLUDED_RESPONSE_STATUSES.has(lead.status)
      })

      const respondedLeads = responseWindowLeads.filter((lead) => RESPONDED_STATUSES.has(lead.status)).length
      const responseRate = responseWindowLeads.length > 0
        ? Math.round((respondedLeads / responseWindowLeads.length) * 100)
        : 0

      setStats({
        totalLeads,
        thisMonthLeads,
        pendingLeads,
        responseRate,
        responseEligibleLeads: responseWindowLeads.length,
        respondedLeads
      })

      // Load profile view stats
      const { data: clicksData } = await supabase
        .from('profile_clicks')
        .select('created_at')
        .eq('profile_id', profile.id)

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
      pending_claim: 'badge-warning',
      contacted: 'badge-success',
      scheduled: 'badge-warning',
      converted: 'badge-primary',
      booked_elsewhere: 'badge-success',
      no_response: 'badge-default',
      duplicate: 'badge-default',
      spam: 'badge-default',
      archived: 'badge-default'
    }
    return badges[status] || 'badge-default'
  }

  const getStatusText = (status) => {
    const texts = {
      new: 'New',
      pending_claim: 'Pending claim',
      contacted: 'Contacted',
      scheduled: 'Scheduled',
      converted: 'Converted',
      booked_elsewhere: 'Booked elsewhere',
      no_response: 'No response',
      duplicate: 'Duplicate',
      spam: 'Spam',
      archived: 'Archived'
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
    // Convert state abbreviation to full name for SEO-friendly URLs
    const stateSlug = getStateNameFromAbbr(profile.state_province) || String(profile.state_province || '').toLowerCase().replace(/\s+/g, '-')
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
    return <Navigate to="/professional/onboarding" replace />
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
          background: 'var(--ds-accent-soft)',
          border: '1px solid var(--ds-border-strong)',
          padding: 'var(--space-6)',
          borderRadius: 'var(--radius-lg)',
          marginTop: 'var(--space-6)'
        }}>
          <h3 style={{ color: 'var(--ds-ink)', marginBottom: 'var(--space-2)' }}>
            <i className="fa fa-exclamation-circle" aria-hidden="true"></i> {error}
          </h3>
          <p>Try one of these options:</p>
          <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
            <Link to="/professional/onboarding" className="btn btn-primary">
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
  const moderationStatus = profile?.moderation_status || 'pending'
  const isProfileLive = moderationStatus === 'approved'
  const missingProfileFields = []

  if (!profile?.photo_url) missingProfileFields.push('Photo')
  if (!profile?.bio || profile.bio.trim().length < 50) missingProfileFields.push('Bio')
  if (!profile?.phone && !profile?.website) missingProfileFields.push('Contact')
  if (!profile?.specialties || profile.specialties.length === 0) missingProfileFields.push('Specialty')

  const statusConfig = {
    approved: {
      title: 'Live',
      message: `Your profile is visible in ${profile?.city || 'your city'}.`
    },
    pending: {
      title: 'Under Review',
      message: 'Complete remaining fields to speed up approval.'
    },
    rejected: {
      title: 'Needs Updates',
      message: 'Please update your profile and resubmit for review.'
    }
  }

  const activeStatus = statusConfig[moderationStatus] || statusConfig.pending

  return (
    <div className="dashboard-container dashboard-minimal">
      <section className="profdash-hero">
        <div className="profdash-title-block">
          <p className="profdash-eyebrow">Dashboard</p>
          <h1>{profile?.full_name || user?.email}</h1>
          <p className="profdash-subtitle">{activeStatus.message}</p>
        </div>

        <div className="profdash-actions">
          <Link to="/professional/profile/edit" className="btn btn-outline">
            Edit Profile
          </Link>
          <Link to="/professional/analytics" className="btn btn-outline">
            Analytics
          </Link>
          <button onClick={handleSignOut} className="btn btn-ghost">
            Sign Out
          </button>
        </div>
      </section>

      <section className="profdash-status">
        <div className="profdash-status-title-row">
          <span className="profdash-status-pill">{activeStatus.title}</span>
          <a href={getPublicProfileUrl()} className="profdash-inline-link">Public Profile</a>
        </div>

        {moderationStatus === 'pending' && missingProfileFields.length > 0 && (
          <p className="profdash-status-copy">
            Missing: {missingProfileFields.join(' · ')}.
            {' '}
            <Link to="/professional/profile/edit" className="profdash-inline-link">Update profile</Link>
          </p>
        )}

        {moderationStatus === 'rejected' && (
          <p className="profdash-status-copy">
            {profile?.moderation_notes || 'Please update your profile details and resubmit.'}
          </p>
        )}

        {moderationStatus === 'approved' && (
          <p className="profdash-status-copy">
            Listed for {profileAge} day{profileAge === 1 ? '' : 's'} in {profile?.city || 'your city'}.
          </p>
        )}
      </section>

      <section className="profdash-metrics">
        <article className="profdash-metric-card">
          <p>Views</p>
          <h3>{viewStats.total}</h3>
        </article>
        <article className="profdash-metric-card">
          <p>Inquiries</p>
          <h3>{stats.totalLeads}</h3>
        </article>
        <article className="profdash-metric-card">
          <p>Awaiting Reply</p>
          <h3>{stats.pendingLeads}</h3>
        </article>
        <article className="profdash-metric-card">
          <p>30-day response</p>
          <h3>{stats.responseRate}%</h3>
        </article>
      </section>
      <p className="text-muted text-small" style={{ marginBottom: 'var(--space-6)' }}>
        Response rate uses the last {RESPONSE_WINDOW_DAYS} days and counts leads marked contacted, scheduled, converted, or booked elsewhere ({stats.respondedLeads}/{stats.responseEligibleLeads}).
      </p>

      <section className="profdash-grid">
        <div className="profdash-panel">
          <div className="profdash-panel-head">
            <h2>Recent Inquiries</h2>
            {leads.length > 0 && (
              <Link to="/professional/leads" className="profdash-inline-link">
                View all
              </Link>
            )}
          </div>

          {leads.length === 0 ? (
            <div className="profdash-empty">
              <p>No inquiries yet.</p>
              {isProfileLive && (
                <a href={getPublicProfileUrl()} className="profdash-inline-link">
                  Review public profile
                </a>
              )}
            </div>
          ) : (
            <div className="profdash-lead-list">
              {leads.map((lead) => (
                <article key={lead.id} className="profdash-lead-item">
                  <div>
                    <h4>{lead.couple_name}</h4>
                    <p>{lead.couple_email}</p>
                    <small>{formatDate(lead.created_at)}</small>
                  </div>
                  <div className="profdash-lead-actions">
                    <span className={`badge ${getStatusBadge(lead.status)}`}>
                      {getStatusText(lead.status)}
                    </span>
                    <Link to="/professional/leads" className="profdash-inline-link">
                      Open
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="profdash-panel">
          <h2>Actions</h2>
          <div className="profdash-action-list">
            <Link to="/professional/profile/edit" className="profdash-action-item">
              <span>Update Profile</span>
              <i className="fa fa-chevron-right" aria-hidden="true"></i>
            </Link>
            <Link to="/professional/analytics" className="profdash-action-item">
              <span>View Analytics</span>
              <i className="fa fa-chevron-right" aria-hidden="true"></i>
            </Link>
            <Link to="/professional/leads" className="profdash-action-item">
              <span>Manage Leads</span>
              <i className="fa fa-chevron-right" aria-hidden="true"></i>
            </Link>
            <a href={getPublicProfileUrl()} className="profdash-action-item">
              <span>Public Profile</span>
              <i className="fa fa-chevron-right" aria-hidden="true"></i>
            </a>
          </div>

          <div className="profdash-account-block">
            <button
              onClick={() => setShowAccountSettings(!showAccountSettings)}
              className="profdash-account-toggle"
            >
              <i className={`fa fa-chevron-${showAccountSettings ? 'down' : 'right'}`} aria-hidden="true"></i>
              Account Settings
            </button>

            {showAccountSettings && (
              <div className="profdash-account-content">
                {removeSuccess ? (
                  <p className="profdash-account-success">
                    Profile removed. Contact hello@weddingcounselors.com to restore.
                  </p>
                ) : (
                  <div className="profdash-account-row">
                    <p>Hide your listing from search results.</p>
                    <button onClick={() => setShowRemoveConfirm(true)} className="profdash-danger-btn">
                      Remove Profile
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {showRemoveConfirm && (
        <div className="profdash-modal-backdrop">
          <div className="profdash-modal">
            <h3>Remove profile?</h3>
            <p>This hides your profile and stops new inquiries.</p>
            <div className="profdash-modal-actions">
              <button onClick={() => setShowRemoveConfirm(false)} disabled={removeLoading} className="btn btn-outline">
                Cancel
              </button>
              <button onClick={handleRemoveProfile} disabled={removeLoading} className="profdash-danger-btn">
                {removeLoading ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfessionalDashboard
