import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

const RolloutDashboard = () => {
  const [currentPhase, setCurrentPhase] = useState(1)
  const [stats, setStats] = useState({
    totalProfiles: 0,
    indexedProfiles: 0,
    queuedProfiles: 0,
    approvedStates: 0,
    approvedCities: 0
  })
  const [recentSubmissions, setRecentSubmissions] = useState([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    // Get current phase
    const { data: phase } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'rollout_phase')
      .single()
    
    setCurrentPhase(parseInt(phase?.value || 1))

    // Get profile stats
    const { data: profiles } = await supabase
      .from('profiles')
      .select('ready_for_indexing, queued_for_sitemap, status, state_province, city')
    
    const totalProfiles = profiles?.length || 0
    const indexedProfiles = profiles?.filter(p => p.ready_for_indexing).length || 0
    const queuedProfiles = profiles?.filter(p => p.queued_for_sitemap).length || 0
    const approvedProfiles = profiles?.filter(p => p.status === 'approved') || []
    
    const uniqueStates = [...new Set(approvedProfiles.map(p => p.state_province))].filter(Boolean)
    const uniqueCities = [...new Set(approvedProfiles.map(p => `${p.state_province}/${p.city}`))].filter(Boolean)

    setStats({
      totalProfiles,
      indexedProfiles,
      queuedProfiles,
      approvedStates: uniqueStates.length,
      approvedCities: uniqueCities.length
    })

    // Get recent submissions
    const { data: submissions } = await supabase
      .from('sitemap_submissions')
      .select('*')
      .order('submitted_at', { ascending: false })
      .limit(10)
    
    setRecentSubmissions(submissions || [])
  }

  const advancePhase = async () => {
    if (currentPhase < 4) {
      const newPhase = currentPhase + 1
      
      await supabase
        .from('settings')
        .update({ value: newPhase.toString() })
        .eq('key', 'rollout_phase')
      
      setCurrentPhase(newPhase)
      
      // Trigger sitemap regeneration
      await fetch('/api/regenerate-sitemaps', { method: 'POST' })
      
      alert(`Advanced to Phase ${newPhase}!`)
    }
  }

  const triggerWeeklyGeneration = async () => {
    try {
      const response = await fetch('/api/regenerate-sitemaps', { method: 'POST' })
      const result = await response.json()
      
      alert(`Sitemap regenerated! ${result.profilesCount} profiles, ${result.statesCount} states, ${result.citiesCount} cities`)
      loadDashboardData()
    } catch (error) {
      alert('Error regenerating sitemaps')
    }
  }

  const approveQueuedProfiles = async () => {
    // Approve next batch of profiles for indexing
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('status', 'pending_verification')
      .eq('is_sponsored', true) // Prioritize paying customers
      .limit(50)
    
    if (data?.length > 0) {
      await supabase
        .from('profiles')
        .update({ status: 'approved' })
        .in('id', data.map(p => p.id))
      
      alert(`Approved ${data.length} profiles for indexing`)
      loadDashboardData()
    }
  }

  const getPhaseDescription = (phase) => {
    const descriptions = {
      1: 'Core pages only (Homepage, About, Blog)',
      2: 'Core + Major state pages (Top 10 states)', 
      3: 'Core + All state pages (50 states)',
      4: 'Full rollout (States + Cities + Profiles)'
    }
    return descriptions[phase] || 'Unknown phase'
  }

  return (
    <div className="rollout-dashboard p-6">
      <h1 className="text-3xl font-bold mb-6">SEO Rollout Dashboard</h1>
      
      {/* Current Phase */}
      <div className="current-phase bg-blue-50 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">Current Phase: {currentPhase}</h2>
        <p className="text-gray-600 mb-4">{getPhaseDescription(currentPhase)}</p>
        
        <div className="phase-progress mb-4">
          <div className="flex space-x-2">
            {[1, 2, 3, 4].map(phase => (
              <div 
                key={phase}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  phase <= currentPhase 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                {phase}
              </div>
            ))}
          </div>
        </div>
        
        {currentPhase < 4 && (
          <button 
            onClick={advancePhase}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Advance to Phase {currentPhase + 1}
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="stats-grid grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="stat-card bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Profiles</h3>
          <p className="text-2xl font-bold text-gray-900">{stats.totalProfiles}</p>
        </div>
        
        <div className="stat-card bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Indexed Profiles</h3>
          <p className="text-2xl font-bold text-green-600">{stats.indexedProfiles}</p>
        </div>
        
        <div className="stat-card bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Queued for Sitemap</h3>
          <p className="text-2xl font-bold text-orange-600">{stats.queuedProfiles}</p>
        </div>
        
        <div className="stat-card bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Active States</h3>
          <p className="text-2xl font-bold text-blue-600">{stats.approvedStates}</p>
        </div>
        
        <div className="stat-card bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Active Cities</h3>
          <p className="text-2xl font-bold text-purple-600">{stats.approvedCities}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="actions mb-6 space-x-4">
        <button 
          onClick={triggerWeeklyGeneration}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Regenerate Sitemaps Now
        </button>
        
        <button 
          onClick={approveQueuedProfiles}
          className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
        >
          Approve Next 50 Profiles
        </button>
      </div>

      {/* Recent Submissions */}
      <div className="recent-submissions bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Recent Sitemap Submissions</h3>
        </div>
        <div className="p-4">
          {recentSubmissions.length === 0 ? (
            <p className="text-gray-500">No submissions yet</p>
          ) : (
            <div className="space-y-3">
              {recentSubmissions.map(submission => (
                <div key={submission.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">{submission.type.replace('_', ' ')}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      {new Date(submission.submitted_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm">
                      {submission.profiles_count} profiles, {submission.states_count} states
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      submission.status === 'success' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {submission.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RolloutDashboard
