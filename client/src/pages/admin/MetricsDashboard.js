import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import SEOHelmet from '../../components/analytics/SEOHelmet'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const MetricsDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({
    totalProfiles: 0,
    claimedProfiles: 0,
    profilesByCity: [],
    profilesByTier: [],
    topProfilesByContact: [],
    contactReveals7Days: 0,
    contactReveals30Days: 0,
    recentSignups: [],
    signupSources: [],
    contactRevealsByCity: []
  })

  useEffect(() => {
    loadMetrics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadMetrics = async () => {
    setLoading(true)
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (profilesError) throw profilesError

      // Calculate metrics
      const totalProfiles = profiles.length
      const claimedProfiles = profiles.filter(p => p.is_claimed).length

      // Profiles by city (top 10)
      const cityCount = {}
      profiles.forEach(p => {
        const city = p.city || 'Unknown'
        cityCount[city] = (cityCount[city] || 0) + 1
      })
      const profilesByCity = Object.entries(cityCount)
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      // Profiles by tier
      const tierCount = { community: 0, local_featured: 0, area_spotlight: 0 }
      profiles.forEach(p => {
        const tier = p.tier || 'community'
        tierCount[tier] = (tierCount[tier] || 0) + 1
      })
      const profilesByTier = Object.entries(tierCount)
        .map(([tier, count]) => ({ tier: formatTierName(tier), count }))

      // Top profiles by contact reveals
      const topProfilesByContact = profiles
        .filter(p => p.contact_reveals_count > 0)
        .sort((a, b) => (b.contact_reveals_count || 0) - (a.contact_reveals_count || 0))
        .slice(0, 10)
        .map(p => ({
          name: p.full_name,
          city: p.city,
          reveals: p.contact_reveals_count || 0
        }))

      // Contact reveals in last 7/30 days
      const now = new Date()
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const { data: recentReveals } = await supabase
        .from('contact_reveals')
        .select('revealed_at')
        .gte('revealed_at', thirtyDaysAgo.toISOString())

      let contactReveals7Days = 0
      let contactReveals30Days = recentReveals?.length || 0

      if (recentReveals) {
        contactReveals7Days = recentReveals.filter(r =>
          new Date(r.revealed_at) >= sevenDaysAgo
        ).length
      }

      // Recent signups (last 30 days)
      const recentSignups = profiles
        .filter(p => new Date(p.created_at) >= thirtyDaysAgo)
        .slice(0, 10)
        .map(p => ({
          name: p.full_name,
          city: p.city,
          date: new Date(p.created_at).toLocaleDateString(),
          source: p.signup_source || 'organic'
        }))

      // Signup sources breakdown
      const sourceCount = {}
      profiles.forEach(p => {
        const source = p.signup_source || 'organic'
        sourceCount[source] = (sourceCount[source] || 0) + 1
      })
      const signupSources = Object.entries(sourceCount)
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count)

      // Contact reveals by city (geographic KPI)
      let contactRevealsByCity = []
      try {
        const { data: revealData } = await supabase
          .from('contact_reveals')
          .select('city, state_province, revealed_at')
          .not('city', 'is', null)
          .order('revealed_at', { ascending: false })

        if (revealData) {
          const cityRevealStats = {}
          revealData.forEach(reveal => {
            const key = `${reveal.city}, ${reveal.state_province}`
            if (!cityRevealStats[key]) {
              cityRevealStats[key] = {
                city: reveal.city,
                state: reveal.state_province,
                total: 0,
                last7Days: 0,
                last30Days: 0
              }
            }
            cityRevealStats[key].total++

            const revealDate = new Date(reveal.revealed_at)
            if (revealDate >= sevenDaysAgo) cityRevealStats[key].last7Days++
            if (revealDate >= thirtyDaysAgo) cityRevealStats[key].last30Days++
          })

          contactRevealsByCity = Object.values(cityRevealStats)
            .sort((a, b) => b.total - a.total)
            .slice(0, 10)
        }
      } catch (err) {
        console.warn('Failed to load city reveal stats:', err)
      }

      setMetrics({
        totalProfiles,
        claimedProfiles,
        profilesByCity,
        profilesByTier,
        topProfilesByContact,
        contactReveals7Days,
        contactReveals30Days,
        recentSignups,
        signupSources,
        contactRevealsByCity
      })

    } catch (error) {
      console.error('Error loading metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTierName = (tier) => {
    const names = {
      community: 'Community (Free)',
      local_featured: 'Local Featured',
      area_spotlight: 'Area Spotlight'
    }
    return names[tier] || tier
  }

  const COLORS = ['#1e3a5f', '#d4a574', '#28a745', '#ffc107', '#dc3545']

  if (loading) {
    return (
      <div className="container" style={{ padding: 'var(--space-20) 0', textAlign: 'center' }}>
        <div className="loading-spinner"></div>
        <p>Loading metrics...</p>
      </div>
    )
  }

  return (
    <div className="container" style={{ padding: 'var(--space-12) 0' }}>
      <SEOHelmet
        title="Admin Metrics Dashboard"
        description="Internal metrics dashboard for Wedding Counselors directory"
        noindex={true}
      />

      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1>Metrics Dashboard</h1>
        <p className="text-secondary">
          Overview of directory performance and provider engagement
        </p>
        <button
          onClick={loadMetrics}
          className="btn btn-outline btn-small"
          style={{ marginTop: 'var(--space-4)' }}
        >
          <i className="fa fa-refresh" aria-hidden="true"></i> Refresh
        </button>
      </div>

      {/* Key Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'var(--space-6)',
        marginBottom: 'var(--space-12)'
      }}>
        <StatCard
          title="Total Profiles"
          value={metrics.totalProfiles}
          icon="fa-users"
          color="var(--primary)"
        />
        <StatCard
          title="Claimed Profiles"
          value={metrics.claimedProfiles}
          icon="fa-check-circle"
          color="#28a745"
        />
        <StatCard
          title="Contact Reveals (7d)"
          value={metrics.contactReveals7Days}
          icon="fa-phone"
          color="#ffc107"
        />
        <StatCard
          title="Contact Reveals (30d)"
          value={metrics.contactReveals30Days}
          icon="fa-calendar"
          color="var(--accent)"
        />
      </div>

      {/* Charts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
        gap: 'var(--space-8)',
        marginBottom: 'var(--space-12)'
      }}>
        {/* Profiles by City */}
        <div style={{
          background: 'var(--white)',
          padding: 'var(--space-6)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--gray-200)'
        }}>
          <h3 style={{ marginBottom: 'var(--space-4)' }}>Top 10 Cities by Profiles</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.profilesByCity} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="city" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="var(--primary)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Profiles by Tier */}
        <div style={{
          background: 'var(--white)',
          padding: 'var(--space-6)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--gray-200)'
        }}>
          <h3 style={{ marginBottom: 'var(--space-4)' }}>Profiles by Tier</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.profilesByTier}
                  dataKey="count"
                  nameKey="tier"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ tier, count }) => `${tier}: ${count}`}
                >
                  {metrics.profilesByTier.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Signup Sources */}
        <div style={{
          background: 'var(--white)',
          padding: 'var(--space-6)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--gray-200)'
        }}>
          <h3 style={{ marginBottom: 'var(--space-4)' }}>Signup Sources</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.signupSources}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="source" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="var(--accent)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Contact Reveals by City - Critical KPI */}
      {metrics.contactRevealsByCity.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          padding: 'var(--space-8)',
          borderRadius: 'var(--radius-xl)',
          marginBottom: 'var(--space-12)',
          border: '2px solid #ffc107'
        }}>
          <h2 style={{ marginBottom: 'var(--space-6)', color: '#92400e' }}>
            Contact Reveals by City (Core KPI)
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 'var(--space-4)'
          }}>
            {metrics.contactRevealsByCity.map((cityData, idx) => (
              <div key={idx} style={{
                background: 'var(--white)',
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--gray-200)'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: 'var(--space-2)' }}>
                  {cityData.city}, {cityData.state}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                  <div>
                    <div style={{ color: 'var(--text-secondary)' }}>Total</div>
                    <div style={{ fontWeight: 'bold', fontSize: 'var(--text-lg)', color: 'var(--primary)' }}>{cityData.total}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-secondary)' }}>7 Days</div>
                    <div style={{ fontWeight: 'bold', fontSize: 'var(--text-lg)', color: '#059669' }}>{cityData.last7Days}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-secondary)' }}>30 Days</div>
                    <div style={{ fontWeight: 'bold', fontSize: 'var(--text-lg)', color: '#d97706' }}>{cityData.last30Days}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 'var(--space-4)', color: '#92400e', fontSize: 'var(--text-sm)' }}>
            Contact reveals indicate real value delivery - couples taking action to connect with providers.
          </p>
        </div>
      )}

      {/* Tables */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
        gap: 'var(--space-8)'
      }}>
        {/* Top Profiles by Contact Reveals */}
        <div style={{
          background: 'var(--white)',
          padding: 'var(--space-6)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--gray-200)'
        }}>
          <h3 style={{ marginBottom: 'var(--space-4)' }}>Top Profiles by Contact Reveals</h3>
          {metrics.topProfilesByContact.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 'var(--space-2)', borderBottom: '2px solid var(--gray-200)' }}>Name</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-2)', borderBottom: '2px solid var(--gray-200)' }}>City</th>
                  <th style={{ textAlign: 'right', padding: 'var(--space-2)', borderBottom: '2px solid var(--gray-200)' }}>Reveals</th>
                </tr>
              </thead>
              <tbody>
                {metrics.topProfilesByContact.map((profile, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: 'var(--space-2)', borderBottom: '1px solid var(--gray-100)' }}>{profile.name}</td>
                    <td style={{ padding: 'var(--space-2)', borderBottom: '1px solid var(--gray-100)' }}>{profile.city}</td>
                    <td style={{ textAlign: 'right', padding: 'var(--space-2)', borderBottom: '1px solid var(--gray-100)', fontWeight: 'bold', color: 'var(--primary)' }}>{profile.reveals}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-muted">No contact reveals recorded yet.</p>
          )}
        </div>

        {/* Recent Signups */}
        <div style={{
          background: 'var(--white)',
          padding: 'var(--space-6)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--gray-200)'
        }}>
          <h3 style={{ marginBottom: 'var(--space-4)' }}>Recent Signups (Last 30 Days)</h3>
          {metrics.recentSignups.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 'var(--space-2)', borderBottom: '2px solid var(--gray-200)' }}>Name</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-2)', borderBottom: '2px solid var(--gray-200)' }}>City</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-2)', borderBottom: '2px solid var(--gray-200)' }}>Date</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-2)', borderBottom: '2px solid var(--gray-200)' }}>Source</th>
                </tr>
              </thead>
              <tbody>
                {metrics.recentSignups.map((signup, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: 'var(--space-2)', borderBottom: '1px solid var(--gray-100)' }}>{signup.name}</td>
                    <td style={{ padding: 'var(--space-2)', borderBottom: '1px solid var(--gray-100)' }}>{signup.city}</td>
                    <td style={{ padding: 'var(--space-2)', borderBottom: '1px solid var(--gray-100)' }}>{signup.date}</td>
                    <td style={{ padding: 'var(--space-2)', borderBottom: '1px solid var(--gray-100)' }}>
                      <span style={{
                        background: 'var(--gray-100)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: 'var(--text-xs)'
                      }}>
                        {signup.source}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-muted">No new signups in the last 30 days.</p>
          )}
        </div>
      </div>
    </div>
  )
}

const StatCard = ({ title, value, icon, color }) => (
  <div style={{
    background: 'var(--white)',
    padding: 'var(--space-6)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-md)',
    border: '1px solid var(--gray-200)',
    textAlign: 'center'
  }}>
    <div style={{
      fontSize: '2rem',
      marginBottom: 'var(--space-2)',
      color: color
    }}>
      <i className={`fa ${icon}`} aria-hidden="true"></i>
    </div>
    <div style={{
      fontSize: 'var(--text-3xl)',
      fontWeight: 'var(--font-weight-bold)',
      color: 'var(--text-primary)',
      marginBottom: 'var(--space-2)'
    }}>
      {value.toLocaleString()}
    </div>
    <div style={{
      fontSize: 'var(--text-sm)',
      color: 'var(--text-secondary)',
      fontWeight: 'var(--font-weight-medium)'
    }}>
      {title}
    </div>
  </div>
)

export default MetricsDashboard
