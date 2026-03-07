import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import SEOHelmet from '../../components/analytics/SEOHelmet'
import { supabase } from '../../lib/supabaseClient'
import { TARGET_METRO_CLUSTERS, TARGET_SPECIALTY_CLUSTERS } from '../../data/growthConfig'

const normalizeValue = (value) => String(value || '').trim().toLowerCase()

const stateMatchesCluster = (value, cluster) => {
  const normalized = normalizeValue(value)
  return normalized === normalizeValue(cluster.stateAbbr) || normalized === normalizeValue(cluster.stateName)
}

const cityMatchesCluster = (value, cluster) => normalizeValue(value) === normalizeValue(cluster.city)

const specialtyMatchesCluster = (profile, cluster) => {
  const haystack = [
    profile?.profession,
    profile?.bio,
    profile?.approach,
    ...(Array.isArray(profile?.specialties) ? profile.specialties : []),
    ...(Array.isArray(profile?.treatment_approaches) ? profile.treatment_approaches : []),
    ...(Array.isArray(profile?.client_focus) ? profile.client_focus : [])
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return cluster.matchTerms.some((term) => haystack.includes(String(term).toLowerCase()))
}

const formatRate = (value) => `${Math.round(Number(value || 0))}%`

const formatOpportunity = (cluster) => {
  if (cluster.clicks30d >= 20 && cluster.stubCount >= 10) return 'Demand exists, claim supply now'
  if (cluster.responseRate < 15 && cluster.outreachCount >= 10) return 'Messaging is weak'
  if (cluster.claimRate >= 55 && cluster.leads30d >= 5) return 'Ready for proof-of-value selling'
  return 'Keep seeding and measuring'
}

const SupplyClustersDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [metroRows, setMetroRows] = useState([])
  const [specialtyRows, setSpecialtyRows] = useState([])

  useEffect(() => {
    loadClusters()
  }, [])

  const loadClusters = async () => {
    setLoading(true)

    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

      const [
        { data: profiles },
        { data: outreach },
        { data: leads },
        { data: clicks }
      ] = await Promise.all([
        supabase.from('profiles').select('id, city, state_province, is_claimed, specialties, profession, bio, approach, treatment_approaches, client_focus'),
        supabase.from('provider_outreach').select('city, state, outreach_status'),
        supabase.from('profile_leads').select('created_at, profile_id, source_page').gte('created_at', thirtyDaysAgo),
        supabase.from('profile_clicks').select('created_at, profile_id, source_city, source_state, source_page').gte('created_at', thirtyDaysAgo)
      ])

      const profileById = {}
      ;(profiles || []).forEach((profile) => {
        profileById[profile.id] = profile
      })

      const nextMetroRows = TARGET_METRO_CLUSTERS.map((cluster) => {
        const clusterProfiles = (profiles || []).filter((profile) => (
          cityMatchesCluster(profile.city, cluster) && stateMatchesCluster(profile.state_province, cluster)
        ))

        const claimedCount = clusterProfiles.filter((profile) => Boolean(profile.is_claimed)).length
        const clusterProfileIds = new Set(clusterProfiles.map((profile) => profile.id))

        const clusterLeads = (leads || []).filter((lead) => (
          clusterProfileIds.has(lead.profile_id) ||
          String(lead.source_page || '').includes(`/${cluster.stateSlug}/${cluster.citySlug}`)
        ))

        const clusterClicks = (clicks || []).filter((click) => (
          (cityMatchesCluster(click.source_city, cluster) && stateMatchesCluster(click.source_state, cluster)) ||
          clusterProfileIds.has(click.profile_id)
        ))

        const clusterOutreach = (outreach || []).filter((entry) => (
          cityMatchesCluster(entry.city, cluster) && stateMatchesCluster(entry.state, cluster)
        ))

        const eligibleOutreach = clusterOutreach.filter((entry) => !['bounced', 'unsubscribed'].includes(entry.outreach_status))
        const responsiveOutreach = clusterOutreach.filter((entry) => ['replied', 'claimed'].includes(entry.outreach_status))

        return {
          key: cluster.id,
          label: `${cluster.city}, ${cluster.stateAbbr}`,
          totalProfiles: clusterProfiles.length,
          stubCount: clusterProfiles.length - claimedCount,
          claimRate: clusterProfiles.length > 0 ? (claimedCount / clusterProfiles.length) * 100 : 0,
          responseRate: eligibleOutreach.length > 0 ? (responsiveOutreach.length / eligibleOutreach.length) * 100 : 0,
          outreachCount: clusterOutreach.length,
          leads30d: clusterLeads.length,
          clicks30d: clusterClicks.length
        }
      }).sort((a, b) => {
        if (b.leads30d !== a.leads30d) return b.leads30d - a.leads30d
        if (b.clicks30d !== a.clicks30d) return b.clicks30d - a.clicks30d
        return a.label.localeCompare(b.label)
      })

      const nextSpecialtyRows = TARGET_SPECIALTY_CLUSTERS.map((cluster) => {
        const specialtyProfiles = (profiles || []).filter((profile) => specialtyMatchesCluster(profile, cluster))
        const specialtyProfileIds = new Set(specialtyProfiles.map((profile) => profile.id))
        const claimedCount = specialtyProfiles.filter((profile) => Boolean(profile.is_claimed)).length

        const specialtyLeads = (leads || []).filter((lead) => (
          specialtyProfileIds.has(lead.profile_id) ||
          String(lead.source_page || '').includes(`/premarital-counseling/${cluster.slug}`)
        ))

        const specialtyClicks = (clicks || []).filter((click) => (
          specialtyProfileIds.has(click.profile_id) ||
          String(click.source_page || '').includes(`/premarital-counseling/${cluster.slug}`)
        ))

        return {
          key: cluster.slug,
          label: cluster.label,
          totalProfiles: specialtyProfiles.length,
          stubCount: specialtyProfiles.length - claimedCount,
          claimRate: specialtyProfiles.length > 0 ? (claimedCount / specialtyProfiles.length) * 100 : 0,
          leads30d: specialtyLeads.length,
          clicks30d: specialtyClicks.length
        }
      }).sort((a, b) => {
        if (b.leads30d !== a.leads30d) return b.leads30d - a.leads30d
        if (b.clicks30d !== a.clicks30d) return b.clicks30d - a.clicks30d
        return a.label.localeCompare(b.label)
      })

      setMetroRows(nextMetroRows)
      setSpecialtyRows(nextSpecialtyRows)
    } catch (error) {
      console.error('Error loading supply clusters:', error)
      setMetroRows([])
      setSpecialtyRows([])
    } finally {
      setLoading(false)
    }
  }

  const metroSummary = {
    stubCount: metroRows.reduce((sum, row) => sum + row.stubCount, 0),
    leads30d: metroRows.reduce((sum, row) => sum + row.leads30d, 0),
    clicks30d: metroRows.reduce((sum, row) => sum + row.clicks30d, 0)
  }

  return (
    <div className="container" style={{ padding: 'var(--space-12) 0' }}>
      <SEOHelmet title="Supply Cluster Dashboard" description="Internal supply cluster dashboard" noindex={true} />

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 'var(--space-4)',
        flexWrap: 'wrap',
        marginBottom: 'var(--space-8)'
      }}>
        <div>
          <h1>Supply Clusters</h1>
          <p className="text-secondary" style={{ marginTop: 'var(--space-2)' }}>
            Work the business in tight metro and specialty clusters instead of spreading supply effort across the whole country.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <Link to="/admin/distribution" className="btn btn-primary">Distribution Ops</Link>
          <Link to="/admin/dashboard" className="btn btn-outline">Back to Admin</Link>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-8)'
      }}>
        {[
          { label: 'Priority metros', value: metroRows.length },
          { label: 'Unclaimed profiles', value: metroSummary.stubCount },
          { label: 'Leads in 30d', value: metroSummary.leads30d },
          { label: 'Clicks in 30d', value: metroSummary.clicks30d }
        ].map((item) => (
          <div
            key={item.label}
            style={{
              padding: 'var(--space-5)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid rgba(14, 94, 94, 0.12)',
              background: 'white'
            }}
          >
            <div style={{ fontSize: '0.84rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
              {item.label}
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 700, color: 'var(--primary-dark)', marginTop: 'var(--space-2)' }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
          <div className="loading-spinner"></div>
          <p style={{ marginTop: 'var(--space-3)' }}>Loading cluster metrics...</p>
        </div>
      ) : (
        <>
          <ClusterTable
            title="Metro clusters"
            subtitle="Track stub count, claim rate, outreach response, and inquiry volume in your top markets."
            rows={metroRows.map((row) => ({
              ...row,
              responseDisplay: formatRate(row.responseRate),
              opportunity: formatOpportunity(row)
            }))}
            showResponse={true}
          />

          <div style={{ height: 'var(--space-8)' }} />

          <ClusterTable
            title="Specialty clusters"
            subtitle="Use these to decide where to publish intent pages and which wedges need more counselor supply."
            rows={specialtyRows.map((row) => ({
              ...row,
              responseDisplay: 'N/A',
              opportunity: row.leads30d > 0 ? 'Keep building this wedge' : 'Seed profiles before publishing more pages'
            }))}
            showResponse={false}
          />
        </>
      )}
    </div>
  )
}

const ClusterTable = ({ title, subtitle, rows, showResponse }) => (
  <div style={{
    background: 'white',
    border: '1px solid rgba(14, 94, 94, 0.12)',
    borderRadius: 'var(--radius-2xl)',
    overflow: 'hidden'
  }}>
    <div style={{ padding: 'var(--space-6)', borderBottom: '1px solid rgba(14, 94, 94, 0.08)' }}>
      <h2 style={{ marginBottom: 'var(--space-2)' }}>{title}</h2>
      <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{subtitle}</p>
    </div>
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 920 }}>
        <thead>
          <tr style={{ background: 'rgba(14, 94, 94, 0.04)' }}>
            {['Cluster', 'Stub count', 'Claim rate', ...(showResponse ? ['Response rate'] : []), 'Clicks (30d)', 'Leads (30d)', 'Opportunity'].map((heading) => (
              <th
                key={heading}
                style={{
                  textAlign: 'left',
                  padding: 'var(--space-4)',
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-secondary)'
                }}
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} style={{ borderTop: '1px solid rgba(14, 94, 94, 0.08)' }}>
              <td style={{ padding: 'var(--space-4)', fontWeight: 600, color: 'var(--primary-dark)' }}>{row.label}</td>
              <td style={{ padding: 'var(--space-4)' }}>{row.stubCount}</td>
              <td style={{ padding: 'var(--space-4)' }}>{formatRate(row.claimRate)}</td>
              {showResponse && <td style={{ padding: 'var(--space-4)' }}>{row.responseDisplay}</td>}
              <td style={{ padding: 'var(--space-4)' }}>{row.clicks30d}</td>
              <td style={{ padding: 'var(--space-4)' }}>{row.leads30d}</td>
              <td style={{ padding: 'var(--space-4)', color: 'var(--text-secondary)' }}>{row.opportunity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

export default SupplyClustersDashboard

