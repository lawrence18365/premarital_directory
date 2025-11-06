import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

const AdminDashboard = () => {
  const { signOut } = useAuth()
  const [stats, setStats] = useState({
    totalProfessionals: 0,
    totalLeads: 0,
    monthlyRevenue: 0,
    activeSubscriptions: 0,
    recentSignups: 0,
    conversionRate: 0
  })
  const [chartData, setChartData] = useState({
    leadsOverTime: [],
    revenueByPlan: [],
    professionalsByLocation: []
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  const loadAdminData = useCallback(async () => {
    setLoading(true)

    try {
      // Load basic stats
      const [
        { count: totalProfessionals },
        { count: totalLeads },
        { data: subscriptions },
        { data: leads },
        { data: profiles }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profile_leads').select('*', { count: 'exact', head: true }),
        supabase.from('professional_subscriptions').select(`
          *,
          plan:subscription_plans(*)
        `).eq('status', 'active'),
        supabase.from('profile_leads').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').order('created_at', { ascending: false })
      ])

      // Calculate revenue
      const monthlyRevenue = subscriptions?.reduce((sum, sub) => {
        return sum + (sub.plan?.price_monthly || 0)
      }, 0) || 0

      // Recent signups (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const recentSignups = profiles?.filter(
        profile => new Date(profile.created_at) >= thirtyDaysAgo
      ).length || 0

      // Conversion rate (claimed profiles vs total)
      const claimedProfiles = profiles?.filter(p => p.is_claimed).length || 0
      const conversionRate = totalProfessionals > 0 
        ? Math.round((claimedProfiles / totalProfessionals) * 100) 
        : 0

      setStats({
        totalProfessionals,
        totalLeads,
        monthlyRevenue,
        activeSubscriptions: subscriptions?.length || 0,
        recentSignups,
        conversionRate
      })

      // Prepare chart data
      prepareChartData(leads, subscriptions, profiles)

      // Recent activity
      const activity = [
        ...leads?.slice(0, 5).map(lead => ({
          type: 'lead',
          description: `New lead: ${lead.couple_name}`,
          timestamp: lead.created_at,
          icon: 'fa-heart'
        })) || [],
        ...profiles?.filter(p => p.is_claimed).slice(0, 3).map(profile => ({
          type: 'signup',
          description: `${profile.full_name} claimed their profile`,
          timestamp: profile.claimed_at,
          icon: 'fa-user-plus'
        })) || []
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10)

      setRecentActivity(activity)

    } catch (error) {
      console.error('Error loading admin data:', error)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    loadAdminData()
  }, [loadAdminData])

  const prepareChartData = (leads, subscriptions, profiles) => {
    // Leads over time (last 30 days)
    const leadsOverTime = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dayLeads = leads?.filter(lead => {
        const leadDate = new Date(lead.created_at)
        return leadDate.toDateString() === date.toDateString()
      }).length || 0

      leadsOverTime.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        leads: dayLeads
      })
    }

    // Revenue by plan
    const planRevenue = {}
    subscriptions?.forEach(sub => {
      const planName = sub.plan?.name || 'Unknown'
      planRevenue[planName] = (planRevenue[planName] || 0) + (sub.plan?.price_monthly || 0)
    })

    const revenueByPlan = Object.entries(planRevenue).map(([plan, revenue]) => ({
      plan,
      revenue: revenue / 100, // Convert cents to dollars
      count: subscriptions?.filter(sub => sub.plan?.name === plan).length || 0
    }))

    // Professionals by location
    const locationCount = {}
    profiles?.forEach(profile => {
      const location = profile.city || 'Unknown'
      locationCount[location] = (locationCount[location] || 0) + 1
    })

    const professionalsByLocation = Object.entries(locationCount)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    setChartData({
      leadsOverTime,
      revenueByPlan,
      professionalsByLocation
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading admin dashboard...</p>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Admin Dashboard</h1>
          <p>Directory Management & Analytics</p>
        </div>
        <div className="dashboard-actions">
          <a href="/admin/campaigns" className="btn btn-primary">
            <i className="fa fa-envelope" aria-hidden="true"></i>
            Email Campaigns
          </a>
          <button onClick={() => loadAdminData()} className="btn btn-outline">
            <i className="fa fa-refresh" aria-hidden="true"></i>
            Refresh
          </button>
          <button onClick={signOut} className="btn btn-ghost">
            <i className="fa fa-sign-out" aria-hidden="true"></i>
            Sign Out
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="admin-stats-grid">
        <div className="stat-card stat-primary">
          <div className="stat-icon">
            <i className="fa fa-users" aria-hidden="true"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.totalProfessionals}</h3>
            <p>Total Professionals</p>
            <small>{stats.recentSignups} new this month</small>
          </div>
        </div>

        <div className="stat-card stat-success">
          <div className="stat-icon">
            <i className="fa fa-heart" aria-hidden="true"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.totalLeads}</h3>
            <p>Total Leads Generated</p>
            <small>Connecting couples with professionals</small>
          </div>
        </div>

        <div className="stat-card stat-warning">
          <div className="stat-icon">
            <i className="fa fa-dollar-sign" aria-hidden="true"></i>
          </div>
          <div className="stat-content">
            <h3>{formatCurrency(stats.monthlyRevenue)}</h3>
            <p>Monthly Recurring Revenue</p>
            <small>{stats.activeSubscriptions} active subscriptions</small>
          </div>
        </div>

        <div className="stat-card stat-info">
          <div className="stat-icon">
            <i className="fa fa-chart-line" aria-hidden="true"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.conversionRate}%</h3>
            <p>Profile Claim Rate</p>
            <small>Professionals claiming profiles</small>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        {/* Leads Over Time */}
        <div className="chart-card">
          <h3>Leads Over Time (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.leadsOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="leads" stroke="#0077be" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue by Plan */}
        <div className="chart-card">
          <h3>Revenue by Subscription Plan</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.revenueByPlan}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="plan" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'revenue' ? formatCurrency(value * 100) : value,
                  name === 'revenue' ? 'Monthly Revenue' : 'Subscribers'
                ]}
              />
              <Bar dataKey="revenue" fill="#ff6b35" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Professionals by Location */}
        <div className="chart-card">
          <h3>Top Locations</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.professionalsByLocation} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="location" type="category" />
              <Tooltip />
              <Bar dataKey="count" fill="#8fbc8f" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="activity-section">
        <h2>Recent Activity</h2>
        <div className="activity-feed">
          {recentActivity.length === 0 ? (
            <div className="empty-state">
              <p>No recent activity</p>
            </div>
          ) : (
            recentActivity.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className={`activity-icon activity-${activity.type}`}>
                  <i className={`fa ${activity.icon}`} aria-hidden="true"></i>
                </div>
                <div className="activity-content">
                  <p>{activity.description}</p>
                  <small>{formatDate(activity.timestamp)}</small>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h2>Quick Actions</h2>
        <div className="admin-actions">
          <div className="action-card">
            <i className="fa fa-users" aria-hidden="true"></i>
            <h4>Manage Professionals</h4>
            <p>View, edit, and manage professional profiles</p>
            <button className="btn btn-primary">View Professionals</button>
          </div>

          <div className="action-card">
            <i className="fa fa-envelope" aria-hidden="true"></i>
            <h4>View All Leads</h4>
            <p>Monitor couple inquiries and lead quality</p>
            <button className="btn btn-primary">View Leads</button>
          </div>

          <div className="action-card">
            <i className="fa fa-credit-card" aria-hidden="true"></i>
            <h4>Billing & Subscriptions</h4>
            <p>Manage payments and subscription plans</p>
            <button className="btn btn-primary">Manage Billing</button>
          </div>

          <div className="action-card">
            <i className="fa fa-chart-bar" aria-hidden="true"></i>
            <h4>Advanced Analytics</h4>
            <p>Detailed reports and business insights</p>
            <button className="btn btn-primary">View Reports</button>
          </div>

          <div className="action-card">
            <i className="fa fa-sitemap" aria-hidden="true"></i>
            <h4>SEO Tools</h4>
            <p>Generate sitemap and optimize search visibility</p>
            <button className="btn btn-primary" onClick={() => window.location.href = '/admin/sitemap'}>
              Generate Sitemap
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
