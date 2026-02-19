import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { Link, useSearchParams } from 'react-router-dom'

const AdminLeadsPage = () => {
  const { signOut } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || 'all',
    notified: searchParams.get('notified') || 'all',
    dateRange: searchParams.get('dateRange') || '30'
  })

  const loadLeads = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('profile_leads')
        .select(`
          *,
          profile:profiles(id, full_name, slug, city, state_province)
        `)
        .order('created_at', { ascending: false })

      if (filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      if (filters.notified === 'notified') {
        query = query.eq('professional_notified', true)
      } else if (filters.notified === 'unnotified') {
        query = query.eq('professional_notified', false)
      }

      if (filters.dateRange !== 'all') {
        const daysAgo = new Date()
        daysAgo.setDate(daysAgo.getDate() - parseInt(filters.dateRange))
        query = query.gte('created_at', daysAgo.toISOString())
      }

      const { data, error } = await query
      if (error) throw error
      setLeads(data || [])
    } catch (error) {
      console.error('Error loading leads:', error)
    }
    setLoading(false)
  }, [filters])

  useEffect(() => {
    loadLeads()
  }, [loadLeads])

  const updateFilter = (key, value) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    const params = new URLSearchParams()
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v !== 'all' && v !== '30') params.set(k, v)
    })
    setSearchParams(params, { replace: true })
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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading leads...</p>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>All Leads</h1>
          <p>{leads.length} leads found</p>
        </div>
        <div className="dashboard-actions">
          <Link to="/admin/dashboard" className="btn btn-outline">
            <i className="fa fa-arrow-left" aria-hidden="true"></i>
            Back to Dashboard
          </Link>
          <button onClick={loadLeads} className="btn btn-outline">
            <i className="fa fa-refresh" aria-hidden="true"></i>
            Refresh
          </button>
          <button onClick={signOut} className="btn btn-ghost">
            <i className="fa fa-sign-out" aria-hidden="true"></i>
            Sign Out
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '24px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px', color: '#6b7280' }}>
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.9rem' }}
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="pending_claim">Pending Claim</option>
            <option value="contacted">Contacted</option>
            <option value="scheduled">Scheduled</option>
            <option value="converted">Converted</option>
            <option value="booked_elsewhere">Booked Elsewhere</option>
            <option value="no_response">No Response</option>
            <option value="spam">Spam</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px', color: '#6b7280' }}>
            Notification
          </label>
          <select
            value={filters.notified}
            onChange={(e) => updateFilter('notified', e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.9rem' }}
          >
            <option value="all">All</option>
            <option value="notified">Notified</option>
            <option value="unnotified">Not Notified</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px', color: '#6b7280' }}>
            Date Range
          </label>
          <select
            value={filters.dateRange}
            onChange={(e) => updateFilter('dateRange', e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.9rem' }}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.9rem'
        }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
              <th style={{ padding: '12px 8px', fontWeight: 600, color: '#374151' }}>Date</th>
              <th style={{ padding: '12px 8px', fontWeight: 600, color: '#374151' }}>Couple</th>
              <th style={{ padding: '12px 8px', fontWeight: 600, color: '#374151' }}>Email</th>
              <th style={{ padding: '12px 8px', fontWeight: 600, color: '#374151' }}>Professional</th>
              <th style={{ padding: '12px 8px', fontWeight: 600, color: '#374151' }}>Status</th>
              <th style={{ padding: '12px 8px', fontWeight: 600, color: '#374151' }}>Notified</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
                  No leads found matching your filters.
                </td>
              </tr>
            ) : (
              leads.map((lead) => {
                // Red = admin was NOT notified (email failure). Unmatched leads (no profile_id)
                // intentionally have professional_notified=false, so don't flag those as broken.
                const isNotificationFailed = !lead.admin_notified
                return (
                  <tr
                    key={lead.id}
                    style={{
                      borderBottom: '1px solid #f3f4f6',
                      background: isNotificationFailed ? '#fef2f2' : 'transparent'
                    }}
                  >
                    <td style={{ padding: '10px 8px', whiteSpace: 'nowrap' }}>
                      {formatDate(lead.created_at)}
                    </td>
                    <td style={{ padding: '10px 8px', fontWeight: 500 }}>
                      {lead.couple_name || 'Anonymous'}
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      <a href={`mailto:${lead.couple_email}`} style={{ color: '#0d9488' }}>
                        {lead.couple_email}
                      </a>
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      {lead.profile ? (
                        <Link
                          to={`/premarital-counseling/${lead.profile.state_province?.toLowerCase().replace(/\s+/g, '-')}/${lead.profile.city?.toLowerCase().replace(/\s+/g, '-')}/${lead.profile.slug}`}
                          style={{ color: '#0d9488', textDecoration: 'underline' }}
                        >
                          {lead.profile.full_name}
                        </Link>
                      ) : (
                        <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Unmatched</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        background: lead.status === 'new' ? '#dbeafe' : lead.status === 'contacted' ? '#fef3c7' : lead.status === 'converted' ? '#d1fae5' : '#f3f4f6',
                        color: lead.status === 'new' ? '#1e40af' : lead.status === 'contacted' ? '#92400e' : lead.status === 'converted' ? '#065f46' : '#374151'
                      }}>
                        {lead.status || 'new'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      {lead.profile_id === null ? (
                        // Unmatched lead — show admin notified status
                        lead.admin_notified
                          ? <span style={{ color: '#059669', fontWeight: 600 }}>Admin Sent</span>
                          : <span style={{ color: '#dc2626', fontWeight: 600 }}>Admin Pending</span>
                      ) : (
                        // Matched lead — show professional notified status
                        lead.professional_notified
                          ? <span style={{ color: '#059669', fontWeight: 600 }}>Pro Sent</span>
                          : <span style={{ color: '#dc2626', fontWeight: 600 }}>Pro Pending</span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminLeadsPage
