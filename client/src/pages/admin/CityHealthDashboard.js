import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Link } from 'react-router-dom';

/**
 * City Health Dashboard for Admins
 * Shows which cities are performing well vs need attention
 * Critical for supply-side growth decisions
 */
const CityHealthDashboard = () => {
  const [cityMetrics, setCityMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('profiles');
  const [filterState, setFilterState] = useState('all');
  const [states, setStates] = useState([]);

  useEffect(() => {
    loadCityMetrics();
  }, []);

  const loadCityMetrics = async () => {
    setLoading(true);

    try {
      // Get profile counts by city
      const { data: profiles } = await supabase
        .from('profiles')
        .select('city, state_province');

      // Get click data
      const { data: clicks } = await supabase
        .from('profile_clicks')
        .select('source_city, source_state, created_at');

      // Get inquiry data
      const { data: inquiries } = await supabase
        .from('city_inquiries')
        .select('city, state, created_at');

      // Aggregate by city
      const cityData = {};

      // Count profiles per city
      profiles?.forEach(profile => {
        if (!profile.city || !profile.state_province) return;
        const key = `${profile.city}|${profile.state_province}`;
        if (!cityData[key]) {
          cityData[key] = {
            city: profile.city,
            state: profile.state_province,
            profiles: 0,
            clicks: 0,
            clicks7d: 0,
            inquiries: 0,
            inquiries7d: 0
          };
        }
        cityData[key].profiles++;
      });

      // Count clicks per city
      const now = new Date();
      const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000);

      clicks?.forEach(click => {
        const key = `${click.source_city}|${click.source_state}`;
        if (!cityData[key]) {
          cityData[key] = {
            city: click.source_city,
            state: click.source_state,
            profiles: 0,
            clicks: 0,
            clicks7d: 0,
            inquiries: 0,
            inquiries7d: 0
          };
        }
        cityData[key].clicks++;
        if (new Date(click.created_at) >= last7d) {
          cityData[key].clicks7d++;
        }
      });

      // Count inquiries per city
      inquiries?.forEach(inquiry => {
        const key = `${inquiry.city}|${inquiry.state}`;
        if (!cityData[key]) {
          cityData[key] = {
            city: inquiry.city,
            state: inquiry.state,
            profiles: 0,
            clicks: 0,
            clicks7d: 0,
            inquiries: 0,
            inquiries7d: 0
          };
        }
        cityData[key].inquiries++;
        if (new Date(inquiry.created_at) >= last7d) {
          cityData[key].inquiries7d++;
        }
      });

      // Calculate health scores
      const metricsArray = Object.values(cityData).map(city => {
        // Health score: weighted combination of supply & demand
        // Profiles = supply, clicks + inquiries = demand
        const supplyScore = Math.min(city.profiles * 10, 50); // Max 50 points for 5+ profiles
        const demandScore = Math.min(city.clicks * 2 + city.inquiries * 10, 50); // Max 50 points
        const healthScore = supplyScore + demandScore;

        // Status based on health
        let status = 'critical';
        if (healthScore >= 70) status = 'healthy';
        else if (healthScore >= 40) status = 'growing';
        else if (healthScore >= 20) status = 'needs_attention';

        return {
          ...city,
          healthScore,
          status,
          clicksPerProfile: city.profiles > 0 ? (city.clicks / city.profiles).toFixed(1) : 0,
          conversionRate: city.clicks > 0 ? ((city.inquiries / city.clicks) * 100).toFixed(1) : 0
        };
      });

      // Get unique states for filter
      const uniqueStates = [...new Set(metricsArray.map(m => m.state))].sort();
      setStates(uniqueStates);

      setCityMetrics(metricsArray);
    } catch (error) {
      console.error('Error loading city metrics:', error);
    }

    setLoading(false);
  };

  const getSortedCities = () => {
    let filtered = [...cityMetrics];

    // Apply state filter
    if (filterState !== 'all') {
      filtered = filtered.filter(c => c.state === filterState);
    }

    // Apply sort
    switch (sortBy) {
      case 'profiles':
        return filtered.sort((a, b) => b.profiles - a.profiles);
      case 'clicks':
        return filtered.sort((a, b) => b.clicks - a.clicks);
      case 'inquiries':
        return filtered.sort((a, b) => b.inquiries - a.inquiries);
      case 'health':
        return filtered.sort((a, b) => b.healthScore - a.healthScore);
      case 'conversion':
        return filtered.sort((a, b) => b.conversionRate - a.conversionRate);
      default:
        return filtered;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return '#10b981';
      case 'growing': return '#f59e0b';
      case 'needs_attention': return '#f97316';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'healthy': return 'Healthy';
      case 'growing': return 'Growing';
      case 'needs_attention': return 'Needs Attention';
      case 'critical': return 'Critical';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading city health data...</p>
      </div>
    );
  }

  const sortedCities = getSortedCities();
  const healthyCities = cityMetrics.filter(c => c.status === 'healthy').length;
  const growingCities = cityMetrics.filter(c => c.status === 'growing').length;
  const criticalCities = cityMetrics.filter(c => c.status === 'critical').length;

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>City Health Dashboard</h1>
          <p>Monitor city performance and identify growth opportunities</p>
        </div>
        <div className="dashboard-actions">
          <Link to="/admin/dashboard" className="btn btn-outline">
            Back to Admin
          </Link>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-content">
            <h3>{cityMetrics.length}</h3>
            <p>Total Cities</p>
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="stat-content">
            <h3>{healthyCities}</h3>
            <p>Healthy Cities</p>
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="stat-content">
            <h3>{growingCities}</h3>
            <p>Growing Cities</p>
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div className="stat-content">
            <h3>{criticalCities}</h3>
            <p>Critical Cities</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: 'var(--space-4)',
        marginTop: 'var(--space-8)',
        marginBottom: 'var(--space-4)'
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem', fontWeight: '500' }}>
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--gray-300)',
              fontSize: '0.9rem'
            }}
          >
            <option value="profiles">Profile Count</option>
            <option value="clicks">Total Clicks</option>
            <option value="inquiries">Inquiries</option>
            <option value="health">Health Score</option>
            <option value="conversion">Conversion Rate</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem', fontWeight: '500' }}>
            Filter State
          </label>
          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--gray-300)',
              fontSize: '0.9rem'
            }}
          >
            <option value="all">All States</option>
            {states.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Cities Table */}
      <div className="dashboard-section">
        <div style={{
          background: 'white',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--gray-200)',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr repeat(5, 1fr) 120px',
            padding: 'var(--space-4)',
            background: 'var(--gray-50)',
            borderBottom: '1px solid var(--gray-200)',
            fontWeight: '600',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)'
          }}>
            <div>City</div>
            <div>State</div>
            <div>Profiles</div>
            <div>Clicks</div>
            <div>Clicks/Profile</div>
            <div>Inquiries</div>
            <div>Conv. Rate</div>
            <div>Status</div>
          </div>

          {sortedCities.length === 0 ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
              No city data available
            </div>
          ) : (
            sortedCities.slice(0, 50).map((city, idx) => (
              <div
                key={`${city.city}-${city.state}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr repeat(5, 1fr) 120px',
                  padding: 'var(--space-4)',
                  borderBottom: idx < sortedCities.length - 1 ? '1px solid var(--gray-100)' : 'none',
                  fontSize: '0.9rem',
                  alignItems: 'center'
                }}
              >
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>{city.city}</strong>
                  {city.clicks7d > 0 && (
                    <span style={{
                      marginLeft: '8px',
                      fontSize: '0.75rem',
                      color: '#10b981',
                      fontWeight: '500'
                    }}>
                      +{city.clicks7d} this week
                    </span>
                  )}
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>{city.state}</div>
                <div>
                  <span style={{
                    fontWeight: city.profiles >= 5 ? '600' : '400',
                    color: city.profiles >= 5 ? 'var(--success)' : city.profiles === 0 ? 'var(--error)' : 'var(--text-primary)'
                  }}>
                    {city.profiles}
                  </span>
                </div>
                <div>{city.clicks}</div>
                <div>{city.clicksPerProfile}</div>
                <div>
                  <span style={{
                    fontWeight: city.inquiries > 0 ? '600' : '400',
                    color: city.inquiries > 0 ? 'var(--success)' : 'var(--text-muted)'
                  }}>
                    {city.inquiries}
                  </span>
                </div>
                <div>{city.conversionRate}%</div>
                <div>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    background: `${getStatusColor(city.status)}20`,
                    color: getStatusColor(city.status)
                  }}>
                    {getStatusLabel(city.status)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Action Recommendations */}
      <div style={{ marginTop: 'var(--space-8)' }}>
        <h2 style={{ marginBottom: 'var(--space-4)' }}>Recommended Actions</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 'var(--space-4)'
        }}>
          {/* High Traffic, Low Supply */}
          <div style={{
            background: '#fef3c7',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #fcd34d'
          }}>
            <h4 style={{ marginBottom: 'var(--space-2)', color: '#92400e' }}>
              High Traffic, Low Supply
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#78350f', marginBottom: 'var(--space-3)' }}>
              Cities with clicks but few profiles - prioritize outreach here:
            </p>
            <ul style={{ margin: 0, paddingLeft: 'var(--space-4)', fontSize: '0.85rem' }}>
              {cityMetrics
                .filter(c => c.clicks > 5 && c.profiles < 3)
                .slice(0, 5)
                .map(c => (
                  <li key={`${c.city}-${c.state}`}>
                    {c.city}, {c.state} ({c.clicks} clicks, {c.profiles} profiles)
                  </li>
                ))}
              {cityMetrics.filter(c => c.clicks > 5 && c.profiles < 3).length === 0 && (
                <li>No cities match this criteria</li>
              )}
            </ul>
          </div>

          {/* High Converting Cities */}
          <div style={{
            background: '#d1fae5',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #6ee7b7'
          }}>
            <h4 style={{ marginBottom: 'var(--space-2)', color: '#065f46' }}>
              Top Converting Cities
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#064e3b', marginBottom: 'var(--space-3)' }}>
              Cities with best click-to-inquiry rates - double down:
            </p>
            <ul style={{ margin: 0, paddingLeft: 'var(--space-4)', fontSize: '0.85rem' }}>
              {cityMetrics
                .filter(c => c.clicks >= 10 && c.conversionRate > 0)
                .sort((a, b) => b.conversionRate - a.conversionRate)
                .slice(0, 5)
                .map(c => (
                  <li key={`${c.city}-${c.state}`}>
                    {c.city}, {c.state} ({c.conversionRate}% conv.)
                  </li>
                ))}
              {cityMetrics.filter(c => c.clicks >= 10 && c.conversionRate > 0).length === 0 && (
                <li>Not enough data yet</li>
              )}
            </ul>
          </div>

          {/* Dead Cities */}
          <div style={{
            background: '#fee2e2',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #fca5a5'
          }}>
            <h4 style={{ marginBottom: 'var(--space-2)', color: '#991b1b' }}>
              No Recent Activity
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#7f1d1d', marginBottom: 'var(--space-3)' }}>
              Cities with profiles but zero engagement - investigate SEO:
            </p>
            <ul style={{ margin: 0, paddingLeft: 'var(--space-4)', fontSize: '0.85rem' }}>
              {cityMetrics
                .filter(c => c.profiles > 0 && c.clicks === 0)
                .slice(0, 5)
                .map(c => (
                  <li key={`${c.city}-${c.state}`}>
                    {c.city}, {c.state} ({c.profiles} profiles)
                  </li>
                ))}
              {cityMetrics.filter(c => c.profiles > 0 && c.clicks === 0).length === 0 && (
                <li>All cities with profiles have traffic</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CityHealthDashboard;
