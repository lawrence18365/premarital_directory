import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

const CampaignDashboard = () => {
  const [campaignStats, setCampaignStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [campaignRunning, setCampaignRunning] = useState(false)
  const [config, setConfig] = useState({
    emailsPerHour: 33,
    maxMonthlyEmails: 1000,
    campaign: 'profile-activation-v1',
    testMode: false
  })

  useEffect(() => {
    loadCampaignStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadCampaignStats = async () => {
    try {
      // Get today's stats
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()
      
      const { data: monthStats } = await supabase
        .from('campaign_logs')
        .select('status')
        .gte('sent_at', monthStart)
        .lt('sent_at', monthEnd)

      // Get total stats
      const { data: totalStats } = await supabase
        .from('campaign_logs')
        .select('status, sent_at')

      // Get uncontacted profiles count
      const { data: uncontactedProfiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_verified', false)
        .not('email', 'is', null)
        .not('email', 'eq', '')

      const { data: contactedProfiles } = await supabase
        .from('campaign_logs')
        .select('profile_id')
        .eq('campaign', config.campaign)

      const contactedIds = new Set(contactedProfiles?.map(log => log.profile_id) || [])
      const remainingProfiles = uncontactedProfiles?.filter(p => !contactedIds.has(p.id)).length || 0

      const monthSent = monthStats?.filter(s => s.status === 'sent').length || 0
      const monthFailed = monthStats?.filter(s => s.status === 'failed').length || 0
      const totalSent = totalStats?.filter(s => s.status === 'sent').length || 0
      const totalFailed = totalStats?.filter(s => s.status === 'failed').length || 0

      setCampaignStats({
        monthSent,
        monthFailed,
        totalSent,
        totalFailed,
        remainingProfiles,
        totalProfiles: uncontactedProfiles?.length || 0,
        progressPercent: uncontactedProfiles?.length > 0 
          ? Math.round(((uncontactedProfiles.length - remainingProfiles) / uncontactedProfiles.length) * 100)
          : 0
      })
    } catch (error) {
      console.error('Error loading campaign stats:', error)
    }
  }

  const runCampaignBatch = async () => {
    setLoading(true)
    setCampaignRunning(true)
    
    try {
      const response = await supabase.functions.invoke('profile-activation-campaign', {
        body: config
      })

      if (response.error) {
        throw response.error
      }

      console.log('Campaign batch result:', response.data)
      
      // Reload stats
      await loadCampaignStats()
      
      alert(`Campaign batch completed!\n\nEmails sent: ${response.data.emailsSent}\nErrors: ${response.data.emailsErrored}`)
    } catch (error) {
      console.error('Error running campaign:', error)
      alert('Error running campaign: ' + error.message)
    }
    
    setLoading(false)
    setCampaignRunning(false)
  }

  const startAutomatedCampaign = () => {
    // This would set up a cron job or scheduling service
    alert('Automated campaign setup:\n\n1. Deploy the campaign function to Supabase\n2. Set up a cron job to call the endpoint every hour\n3. Use a service like GitHub Actions or Vercel Cron\n\nExample cron expression: "0 * * * *" (every hour)')
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Profile Activation Campaign Dashboard</h1>
      
      {/* Stats Overview */}
      {campaignStats && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px', 
          marginBottom: '30px' 
        }}>
          <div style={{ 
            background: '#f0f9ff', 
            padding: '20px', 
            borderRadius: '8px', 
            border: '1px solid #0ea5e9',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#0ea5e9', margin: '0 0 10px 0' }}>This Month</h3>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
              {campaignStats.monthSent}/1000
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              {campaignStats.monthFailed} failed
            </div>
          </div>

          <div style={{ 
            background: '#f0fdf4', 
            padding: '20px', 
            borderRadius: '8px', 
            border: '1px solid #22c55e',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#22c55e', margin: '0 0 10px 0' }}>Total Sent</h3>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
              {campaignStats.totalSent}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              {campaignStats.totalFailed} failed
            </div>
          </div>

          <div style={{ 
            background: '#fefce8', 
            padding: '20px', 
            borderRadius: '8px', 
            border: '1px solid #eab308',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#eab308', margin: '0 0 10px 0' }}>Remaining</h3>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
              {campaignStats.remainingProfiles}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              of {campaignStats.totalProfiles} profiles
            </div>
          </div>

          <div style={{ 
            background: '#faf5ff', 
            padding: '20px', 
            borderRadius: '8px', 
            border: '1px solid #a855f7',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#a855f7', margin: '0 0 10px 0' }}>Progress</h3>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
              {campaignStats.progressPercent}%
            </div>
            <div style={{ 
              background: '#e5e7eb', 
              height: '8px', 
              borderRadius: '4px', 
              marginTop: '10px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                background: '#a855f7', 
                height: '100%', 
                width: `${campaignStats.progressPercent}%`,
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        </div>
      )}

      {/* Campaign Configuration */}
      <div style={{ 
        background: 'white', 
        padding: '20px', 
        borderRadius: '8px', 
        border: '1px solid #e5e7eb',
        marginBottom: '20px'
      }}>
        <h2>Campaign Configuration</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '15px',
          marginBottom: '20px'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Emails per Hour
            </label>
            <input
              type="number"
              min="1"
              max="200"
              value={config.emailsPerHour}
              onChange={(e) => setConfig({...config, emailsPerHour: parseInt(e.target.value)})}
              style={{ 
                width: '100%', 
                padding: '8px', 
                border: '1px solid #d1d5db', 
                borderRadius: '4px' 
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Max Monthly Emails (SMTP2GO Limit)
            </label>
            <input
              type="number"
              min="1"
              max="1000"
              value={config.maxMonthlyEmails}
              onChange={(e) => setConfig({...config, maxMonthlyEmails: parseInt(e.target.value)})}
              style={{ 
                width: '100%', 
                padding: '8px', 
                border: '1px solid #d1d5db', 
                borderRadius: '4px' 
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Campaign Name
            </label>
            <input
              type="text"
              value={config.campaign}
              onChange={(e) => setConfig({...config, campaign: e.target.value})}
              style={{ 
                width: '100%', 
                padding: '8px', 
                border: '1px solid #d1d5db', 
                borderRadius: '4px' 
              }}
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', fontWeight: '500' }}>
              <input
                type="checkbox"
                checked={config.testMode}
                onChange={(e) => setConfig({...config, testMode: e.target.checked})}
                style={{ marginRight: '8px' }}
              />
              Test Mode (emails to haylee@)
            </label>
          </div>
        </div>
      </div>

      {/* Campaign Controls */}
      <div style={{ 
        background: 'white', 
        padding: '20px', 
        borderRadius: '8px', 
        border: '1px solid #e5e7eb',
        marginBottom: '20px'
      }}>
        <h2>Campaign Controls</h2>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <button
            onClick={runCampaignBatch}
            disabled={loading || campaignRunning}
            style={{
              background: '#059669',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Sending...' : 'Send Batch Now'}
          </button>

          <button
            onClick={startAutomatedCampaign}
            style={{
              background: '#0ea5e9',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Setup Automation
          </button>

          <button
            onClick={loadCampaignStats}
            style={{
              background: '#6b7280',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Refresh Stats
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div style={{ 
        background: '#fef3c7', 
        padding: '20px', 
        borderRadius: '8px', 
        border: '1px solid #f59e0b' 
      }}>
        <h3 style={{ color: '#92400e', marginTop: 0 }}>Quick Setup Instructions</h3>
        <ol style={{ color: '#92400e' }}>
          <li>Deploy the campaign functions to Supabase</li>
          <li>Run the database migration to create campaign_logs table</li>
          <li>Configure your SMTP2GO API key in Supabase environment variables</li>
          <li>Test with a small batch first (use Test Mode)</li>
          <li>Set up automation with a cron job service</li>
        </ol>
        <p style={{ color: '#92400e', margin: '15px 0 0 0' }}>
          <strong>Recommended:</strong> Start with 25 emails/hour, 1000/month (SMTP2GO limit). Timeline: ~45 days to contact all 1500 profiles.
        </p>
      </div>
    </div>
  )
}

export default CampaignDashboard
