import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { Link } from 'react-router-dom'

const LeadsPage = () => {
  const { profile } = useAuth()
  const [leads, setLeads] = useState([])
  const [filteredLeads, setFilteredLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (profile) {
      loadLeads()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  useEffect(() => {
    applyFilters()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads, statusFilter, searchTerm])

  const loadLeads = async () => {
    if (!profile) return

    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('profile_leads')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setLeads(data || [])
    } catch (error) {
      console.error('Error loading leads:', error)
    }

    setLoading(false)
  }

  const applyFilters = () => {
    let filtered = [...leads]

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter)
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(lead =>
        lead.couple_name.toLowerCase().includes(term) ||
        lead.couple_email.toLowerCase().includes(term) ||
        (lead.message && lead.message.toLowerCase().includes(term))
      )
    }

    setFilteredLeads(filtered)
  }

  const updateLeadStatus = async (leadId, newStatus) => {
    try {
      const { error } = await supabase
        .from('profile_leads')
        .update({ status: newStatus })
        .eq('id', leadId)

      if (error) throw error

      // Update local state
      setLeads(prev =>
        prev.map(lead =>
          lead.id === leadId ? { ...lead, status: newStatus } : lead
        )
      )
    } catch (error) {
      console.error('Error updating lead status:', error)
      alert('Failed to update lead status')
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      new: { class: 'badge-new', text: 'New', icon: 'fa-bell' },
      contacted: { class: 'badge-success', text: 'Contacted', icon: 'fa-phone' },
      scheduled: { class: 'badge-warning', text: 'Scheduled', icon: 'fa-calendar' },
      converted: { class: 'badge-primary', text: 'Client', icon: 'fa-heart' }
    }
    return badges[status] || { class: 'badge-default', text: status, icon: 'fa-question' }
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

  const getLeadStats = () => {
    const stats = {
      total: leads.length,
      new: leads.filter(l => l.status === 'new').length,
      contacted: leads.filter(l => l.status === 'contacted').length,
      converted: leads.filter(l => l.status === 'converted').length
    }
    
    stats.responseRate = stats.total > 0 
      ? Math.round(((stats.contacted + stats.converted) / stats.total) * 100) 
      : 0

    return stats
  }

  const stats = getLeadStats()

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your leads...</p>
      </div>
    )
  }

  return (
    <div className="leads-page">
      {/* Header */}
      <div className="leads-header">
        <Link to="/professional/dashboard" className="back-link">
          <i className="fa fa-arrow-left" aria-hidden="true"></i>
          Back to Dashboard
        </Link>
        
        <div className="header-content">
          <h1>Your Leads</h1>
          <p>Manage couples who have contacted you for premarital counseling</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="leads-stats">
        <div className="stat-item">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total Leads</div>
        </div>
        
        <div className="stat-item">
          <div className="stat-number">{stats.new}</div>
          <div className="stat-label">New</div>
        </div>
        
        <div className="stat-item">
          <div className="stat-number">{stats.contacted}</div>
          <div className="stat-label">Contacted</div>
        </div>
        
        <div className="stat-item">
          <div className="stat-number">{stats.converted}</div>
          <div className="stat-label">Clients</div>
        </div>
        
        <div className="stat-item">
          <div className="stat-number">{stats.responseRate}%</div>
          <div className="stat-label">Response Rate</div>
        </div>
      </div>

      {/* Filters */}
      <div className="leads-filters">
        <div className="filter-group">
          <label htmlFor="search">Search Leads</label>
          <input
            type="text"
            id="search"
            placeholder="Search by name, email, or message..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="status">Filter by Status</label>
          <select
            id="status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="scheduled">Scheduled</option>
            <option value="converted">Converted to Client</option>
          </select>
        </div>

        <button onClick={loadLeads} className="btn btn-outline">
          <i className="fa fa-refresh" aria-hidden="true"></i>
          Refresh
        </button>
      </div>

      {/* Leads List */}
      {filteredLeads.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <i className="fa fa-heart" aria-hidden="true"></i>
          </div>
          <h3>
            {leads.length === 0 ? 'No leads yet' : 'No leads match your filters'}
          </h3>
          <p>
            {leads.length === 0 
              ? "Once couples start contacting you through the directory, you'll see their information here."
              : "Try adjusting your search or filter criteria."
            }
          </p>
          {leads.length === 0 && (
            <Link to={(profile?.state_province && profile?.city ? `/premarital-counseling/${String(profile.state_province).toLowerCase().replace(/\s+/g, '-')}/${String(profile.city).toLowerCase().replace(/\s+/g, '-')}/${profile?.slug || profile?.id}` : `/profile/${profile?.slug || profile?.id}`)} className="btn btn-primary">
              View Your Public Profile
            </Link>
          )}
        </div>
      ) : (
        <div className="leads-list">
          {filteredLeads.map(lead => {
            const statusInfo = getStatusBadge(lead.status)
            
            return (
              <div key={lead.id} className="lead-card">
                <div className="lead-header">
                  <div className="lead-info">
                    <h3>{lead.couple_name}</h3>
                    <div className="lead-contact">
                      <a href={`mailto:${lead.couple_email}`} className="contact-link">
                        <i className="fa fa-envelope" aria-hidden="true"></i>
                        {lead.couple_email}
                      </a>
                      {lead.couple_phone && (
                        <a href={`tel:${lead.couple_phone}`} className="contact-link">
                          <i className="fa fa-phone" aria-hidden="true"></i>
                          {lead.couple_phone}
                        </a>
                      )}
                    </div>
                  </div>
                  
                  <div className="lead-meta">
                    <span className={`badge ${statusInfo.class}`}>
                      <i className={`fa ${statusInfo.icon}`} aria-hidden="true"></i>
                      {statusInfo.text}
                    </span>
                    <small>{formatDate(lead.created_at)}</small>
                  </div>
                </div>

                <div className="lead-details">
                  {lead.wedding_date && (
                    <div className="detail-item">
                      <i className="fa fa-ring" aria-hidden="true"></i>
                      <strong>Wedding:</strong> {new Date(lead.wedding_date).toLocaleDateString()}
                    </div>
                  )}
                  
                  {lead.location && (
                    <div className="detail-item">
                      <i className="fa fa-map-marker" aria-hidden="true"></i>
                      <strong>Location:</strong> {lead.location}
                    </div>
                  )}
                  
                  <div className="detail-item">
                    <i className="fa fa-comment" aria-hidden="true"></i>
                    <strong>Message:</strong>
                  </div>
                  <div className="lead-message">
                    {lead.message}
                  </div>
                </div>

                <div className="lead-actions">
                  <a 
                    href={`mailto:${lead.couple_email}?subject=Re: Premarital Counseling Inquiry`}
                    className="btn btn-primary"
                  >
                    <i className="fa fa-reply" aria-hidden="true"></i>
                    Reply via Email
                  </a>

                  {lead.couple_phone && (
                    <a 
                      href={`tel:${lead.couple_phone}`}
                      className="btn btn-outline"
                    >
                      <i className="fa fa-phone" aria-hidden="true"></i>
                      Call
                    </a>
                  )}

                  <div className="status-actions">
                    <label>Status:</label>
                    <select
                      value={lead.status}
                      onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="converted">Converted</option>
                    </select>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default LeadsPage
