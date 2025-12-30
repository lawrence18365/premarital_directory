import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { Link } from 'react-router-dom';

/**
 * Provider Analytics Dashboard
 * Shows clicks, reveals, inquiries - demonstrates value to providers
 */
const AnalyticsDashboard = () => {
  const { profile } = useAuth();
  const [analytics, setAnalytics] = useState({
    profileClicks: { total: 0, last7d: 0, last30d: 0 },
    contactReveals: { total: 0, last7d: 0, last30d: 0 },
    inquiries: { total: 0, last7d: 0, last30d: 0, pending: 0 },
    topCities: []
  });
  const [recentInquiries, setRecentInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      loadAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const loadAnalytics = async () => {
    setLoading(true);

    try {
      // Load profile clicks
      const { data: clicksData } = await supabase
        .from('profile_clicks')
        .select('*')
        .eq('profile_id', profile.id);

      const now = new Date();
      const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000);
      const last30d = new Date(now - 30 * 24 * 60 * 60 * 1000);

      const clickStats = {
        total: clicksData?.length || 0,
        last7d: clicksData?.filter(c => new Date(c.created_at) >= last7d).length || 0,
        last30d: clicksData?.filter(c => new Date(c.created_at) >= last30d).length || 0
      };

      // Group clicks by city
      const cityCounts = {};
      clicksData?.forEach(click => {
        const key = `${click.source_city}, ${click.source_state}`;
        cityCounts[key] = (cityCounts[key] || 0) + 1;
      });

      const topCities = Object.entries(cityCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([city, count]) => ({ city, count }));

      // Load contact reveals (from profile_leads)
      const { data: revealsData } = await supabase
        .from('profile_leads')
        .select('created_at')
        .eq('profile_id', profile.id);

      const revealStats = {
        total: revealsData?.length || 0,
        last7d: revealsData?.filter(r => new Date(r.created_at) >= last7d).length || 0,
        last30d: revealsData?.filter(r => new Date(r.created_at) >= last30d).length || 0
      };

      // Load inquiries from multi-provider form
      const { data: inquiriesData } = await supabase
        .from('city_inquiries')
        .select('*')
        .contains('provider_ids', [profile.id])
        .order('created_at', { ascending: false });

      const inquiryStats = {
        total: inquiriesData?.length || 0,
        last7d: inquiriesData?.filter(i => new Date(i.created_at) >= last7d).length || 0,
        last30d: inquiriesData?.filter(i => new Date(i.created_at) >= last30d).length || 0,
        pending: inquiriesData?.filter(i => i.status === 'new').length || 0
      };

      setAnalytics({
        profileClicks: clickStats,
        contactReveals: revealStats,
        inquiries: inquiryStats,
        topCities
      });

      setRecentInquiries(inquiriesData?.slice(0, 5) || []);

    } catch (error) {
      console.error('Error loading analytics:', error);
    }

    setLoading(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Your Performance Analytics</h1>
          <p>See how engaged couples are finding and interacting with your profile</p>
        </div>
        <div className="dashboard-actions">
          <Link to="/professional/dashboard" className="btn btn-outline">
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        {/* Profile Views */}
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <div className="stat-content">
            <h3 style={{ fontSize: '2.5rem', marginBottom: 'var(--space-2)' }}>
              {analytics.profileClicks.total}
            </h3>
            <p style={{ fontSize: '1.1rem', marginBottom: 'var(--space-4)', opacity: 0.9 }}>
              Profile Views
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: '0.9rem', opacity: 0.85 }}>
              <span>{analytics.profileClicks.last7d} this week</span>
              <span>{analytics.profileClicks.last30d} this month</span>
            </div>
          </div>
        </div>

        {/* Contact Reveals */}
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
          <div className="stat-content">
            <h3 style={{ fontSize: '2.5rem', marginBottom: 'var(--space-2)' }}>
              {analytics.contactReveals.total}
            </h3>
            <p style={{ fontSize: '1.1rem', marginBottom: 'var(--space-4)', opacity: 0.9 }}>
              Contact Reveals
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: '0.9rem', opacity: 0.85 }}>
              <span>{analytics.contactReveals.last7d} this week</span>
              <span>{analytics.contactReveals.last30d} this month</span>
            </div>
          </div>
        </div>

        {/* Inquiries Received */}
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
          <div className="stat-content">
            <h3 style={{ fontSize: '2.5rem', marginBottom: 'var(--space-2)' }}>
              {analytics.inquiries.total}
            </h3>
            <p style={{ fontSize: '1.1rem', marginBottom: 'var(--space-4)', opacity: 0.9 }}>
              Direct Inquiries
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: '0.9rem', opacity: 0.85 }}>
              <span>{analytics.inquiries.last7d} this week</span>
              <span style={{ fontWeight: '600' }}>{analytics.inquiries.pending} pending</span>
            </div>
          </div>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="dashboard-section" style={{ marginTop: 'var(--space-8)' }}>
        <h2>Your Conversion Funnel</h2>
        <div style={{
          background: 'white',
          padding: 'var(--space-6)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--gray-200)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr auto 1fr',
            alignItems: 'center',
            gap: 'var(--space-4)'
          }}>
            <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                {analytics.profileClicks.last30d}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Profile Views (30d)
              </div>
            </div>

            <div style={{ fontSize: '1.5rem', color: 'var(--gray-400)' }}>→</div>

            <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                {analytics.contactReveals.last30d}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Contact Reveals (30d)
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {analytics.profileClicks.last30d > 0
                  ? `${Math.round((analytics.contactReveals.last30d / analytics.profileClicks.last30d) * 100)}% conversion`
                  : '0% conversion'
                }
              </div>
            </div>

            <div style={{ fontSize: '1.5rem', color: 'var(--gray-400)' }}>→</div>

            <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>
                {analytics.inquiries.last30d}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Inquiries (30d)
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {analytics.contactReveals.last30d > 0
                  ? `${Math.round((analytics.inquiries.last30d / analytics.contactReveals.last30d) * 100)}% engagement`
                  : '0% engagement'
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-8)', marginTop: 'var(--space-8)' }}>
        {/* Top Cities */}
        <div className="dashboard-section">
          <h2>Top Traffic Sources</h2>
          {analytics.topCities.length > 0 ? (
            <div style={{
              background: 'white',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--gray-200)',
              overflow: 'hidden'
            }}>
              {analytics.topCities.map((item, idx) => (
                <div
                  key={item.city}
                  style={{
                    padding: 'var(--space-4)',
                    borderBottom: idx < analytics.topCities.length - 1 ? '1px solid var(--gray-100)' : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>{item.city}</strong>
                  </div>
                  <div style={{
                    background: 'var(--color-primary)',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: '600'
                  }}>
                    {item.count} views
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
              <p>No traffic data yet. Your profile views will appear here.</p>
            </div>
          )}
        </div>

        {/* Recent Inquiries */}
        <div className="dashboard-section">
          <h2>Recent Inquiries</h2>
          {recentInquiries.length > 0 ? (
            <div style={{
              background: 'white',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--gray-200)',
              overflow: 'hidden'
            }}>
              {recentInquiries.map((inquiry, idx) => (
                <div
                  key={inquiry.id}
                  style={{
                    padding: 'var(--space-4)',
                    borderBottom: idx < recentInquiries.length - 1 ? '1px solid var(--gray-100)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {inquiry.couple_name || 'Anonymous Couple'}
                    </strong>
                    <small style={{ color: 'var(--text-muted)' }}>
                      {formatDate(inquiry.created_at)}
                    </small>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
                    {inquiry.city}, {inquiry.state}
                  </div>
                  <div style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    background: 'var(--gray-50)',
                    padding: 'var(--space-2)',
                    borderRadius: 'var(--radius-sm)',
                    maxHeight: '60px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {inquiry.couple_message?.substring(0, 100)}
                    {inquiry.couple_message?.length > 100 ? '...' : ''}
                  </div>
                  <div style={{ marginTop: 'var(--space-2)' }}>
                    <a
                      href={`mailto:${inquiry.couple_email}`}
                      style={{
                        fontSize: '0.85rem',
                        color: 'var(--color-primary)',
                        fontWeight: '500'
                      }}
                    >
                      Reply to {inquiry.couple_email} →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
              <p>No inquiries yet. When couples send messages through city pages, they'll appear here.</p>
            </div>
          )}
        </div>
      </div>

      {/* Upgrade CTA for non-featured providers */}
      {profile?.tier === 'community' && (
        <div style={{
          marginTop: 'var(--space-12)',
          padding: 'var(--space-8)',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 'var(--radius-lg)',
          color: 'white',
          textAlign: 'center'
        }}>
          <h3 style={{ marginBottom: 'var(--space-3)', color: 'white' }}>
            Want More Visibility?
          </h3>
          <p style={{ marginBottom: 'var(--space-4)', opacity: 0.9 }}>
            Featured profiles appear at the top of search results and get 3-5x more views on average.
          </p>
          <Link
            to="/professional/subscription"
            style={{
              display: 'inline-block',
              padding: 'var(--space-3) var(--space-6)',
              background: 'white',
              color: '#667eea',
              fontWeight: '600',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none'
            }}
          >
            Upgrade to Featured →
          </Link>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
