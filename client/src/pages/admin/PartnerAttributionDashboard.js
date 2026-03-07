import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import SEOHelmet from '../../components/analytics/SEOHelmet'
import { supabase } from '../../lib/supabaseClient'
import { PARTNER_REPORT_LOOKBACKS } from '../../data/growthConfig'

const getPartnerKey = (record) => {
  return record?.partner_ref || record?.utm_campaign || null
}

const inferAudience = (ref = '') => {
  const normalized = String(ref || '').toLowerCase()
  if (normalized.startsWith('church')) return 'Church'
  if (normalized.startsWith('officiant')) return 'Officiant'
  if (normalized.startsWith('planner')) return 'Planner'
  if (normalized.startsWith('community')) return 'Community'
  return 'Partner'
}

const formatLastSeen = (value) => {
  if (!value) return 'No activity'
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`

const PartnerAttributionDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [lookback, setLookback] = useState('30')
  const [rows, setRows] = useState([])
  const [summary, setSummary] = useState({
    activeRefs: 0,
    totalClicks: 0,
    totalLeads: 0,
    conversionRate: 0
  })

  useEffect(() => {
    loadPartnerMetrics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lookback])

  const loadPartnerMetrics = async () => {
    setLoading(true)

    try {
      const cutoff = lookback === 'all'
        ? null
        : new Date(Date.now() - Number(lookback) * 24 * 60 * 60 * 1000).toISOString()

      let clicksQuery = supabase
        .from('profile_clicks')
        .select('created_at, partner_ref, source_page, utm_campaign')

      let leadsQuery = supabase
        .from('profile_leads')
        .select('created_at, partner_ref, source_page, utm_campaign')

      if (cutoff) {
        clicksQuery = clicksQuery.gte('created_at', cutoff)
        leadsQuery = leadsQuery.gte('created_at', cutoff)
      }

      const [{ data: clicks }, { data: leads }] = await Promise.all([
        clicksQuery.order('created_at', { ascending: false }),
        leadsQuery.order('created_at', { ascending: false })
      ])

      const partnerMap = {}
      const ensurePartner = (ref) => {
        if (!partnerMap[ref]) {
          partnerMap[ref] = {
            ref,
            audience: inferAudience(ref),
            clicks: 0,
            leads: 0,
            topLanding: null,
            lastClickAt: null,
            lastLeadAt: null,
            landings: {}
          }
        }
        return partnerMap[ref]
      }

      ;(clicks || []).forEach((record) => {
        const ref = getPartnerKey(record)
        if (!ref) return
        const partner = ensurePartner(ref)
        partner.clicks += 1
        partner.lastClickAt = partner.lastClickAt || record.created_at
        const landing = record.source_page || 'Unknown landing'
        partner.landings[landing] = (partner.landings[landing] || 0) + 1
      })

      ;(leads || []).forEach((record) => {
        const ref = getPartnerKey(record)
        if (!ref) return
        const partner = ensurePartner(ref)
        partner.leads += 1
        partner.lastLeadAt = partner.lastLeadAt || record.created_at
        const landing = record.source_page || 'Unknown landing'
        partner.landings[landing] = (partner.landings[landing] || 0) + 1
      })

      const nextRows = Object.values(partnerMap)
        .map((partner) => {
          const topLanding = Object.entries(partner.landings)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown landing'

          return {
            ...partner,
            topLanding,
            conversionRate: partner.clicks > 0 ? (partner.leads / partner.clicks) * 100 : 0
          }
        })
        .sort((a, b) => {
          if (b.leads !== a.leads) return b.leads - a.leads
          if (b.clicks !== a.clicks) return b.clicks - a.clicks
          return String(a.ref).localeCompare(String(b.ref))
        })

      const totalClicks = nextRows.reduce((sum, row) => sum + row.clicks, 0)
      const totalLeads = nextRows.reduce((sum, row) => sum + row.leads, 0)

      setRows(nextRows)
      setSummary({
        activeRefs: nextRows.length,
        totalClicks,
        totalLeads,
        conversionRate: totalClicks > 0 ? (totalLeads / totalClicks) * 100 : 0
      })
    } catch (error) {
      console.error('Error loading partner dashboard:', error)
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ padding: 'var(--space-12) 0' }}>
      <SEOHelmet
        title="Partner Attribution Dashboard"
        description="Internal partner attribution dashboard"
        noindex={true}
      />

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 'var(--space-4)',
        flexWrap: 'wrap',
        marginBottom: 'var(--space-8)'
      }}>
        <div>
          <h1>Partner Attribution</h1>
          <p className="text-secondary" style={{ marginTop: 'var(--space-2)' }}>
            Track clicks and inquiries by partner ref so you can prove distribution value before monetization.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <Link to="/partners" className="btn btn-primary">Build New Link</Link>
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
          { label: 'Active refs', value: summary.activeRefs },
          { label: 'Tracked clicks', value: summary.totalClicks },
          { label: 'Tracked leads', value: summary.totalLeads },
          { label: 'Click to lead', value: formatPercent(summary.conversionRate) }
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

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 'var(--space-4)',
        flexWrap: 'wrap',
        marginBottom: 'var(--space-5)'
      }}>
        <strong style={{ color: 'var(--primary-dark)' }}>Partner refs</strong>
        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Window</span>
          <select
            value={lookback}
            onChange={(event) => setLookback(event.target.value)}
            className="form-control"
            style={{ minWidth: 180 }}
          >
            {PARTNER_REPORT_LOOKBACKS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div style={{
        background: 'white',
        border: '1px solid rgba(14, 94, 94, 0.12)',
        borderRadius: 'var(--radius-2xl)',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
            <div className="loading-spinner"></div>
            <p style={{ marginTop: 'var(--space-3)' }}>Loading partner metrics...</p>
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
            <h3 style={{ marginBottom: 'var(--space-2)' }}>No tracked partner activity yet</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
              Create a tracked link on the partner tools page, then distribute it through officiants, churches, planners, or community posts.
            </p>
            <Link to="/partners" className="btn btn-primary">Open Partner Tools</Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
              <thead>
                <tr style={{ background: 'rgba(14, 94, 94, 0.05)' }}>
                  {['Ref', 'Audience', 'Clicks', 'Leads', 'Click to lead', 'Top landing page', 'Last activity'].map((heading) => (
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
                  <tr key={row.ref} style={{ borderTop: '1px solid rgba(14, 94, 94, 0.08)' }}>
                    <td style={{ padding: 'var(--space-4)', fontWeight: 600, color: 'var(--primary-dark)' }}>{row.ref}</td>
                    <td style={{ padding: 'var(--space-4)', color: 'var(--text-secondary)' }}>{row.audience}</td>
                    <td style={{ padding: 'var(--space-4)' }}>{row.clicks}</td>
                    <td style={{ padding: 'var(--space-4)' }}>{row.leads}</td>
                    <td style={{ padding: 'var(--space-4)' }}>{formatPercent(row.conversionRate)}</td>
                    <td style={{ padding: 'var(--space-4)', color: 'var(--text-secondary)' }}>{row.topLanding}</td>
                    <td style={{ padding: 'var(--space-4)', color: 'var(--text-secondary)' }}>
                      {formatLastSeen(row.lastLeadAt || row.lastClickAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default PartnerAttributionDashboard

